import { promises as fs } from "node:fs";
import { basename, join, resolve } from "node:path";
import { classifyFile, type ClassifiedItem } from "./classify.js";
import { contentHash } from "./content-hash.js";
import {
  assertRealPathInsideRoot,
  isPathInsideRoot,
  matchSystemSidecarExclusion,
  normalizeIntakeRelative,
  PathEscapeError,
  SYSTEM_SIDECAR_EXCLUSION_RULE,
} from "./path-safety.js";

export interface InventoryFile {
  absolutePath: string;
  relativePath: string;
  filename: string;
  excluded?: boolean;
  exclusionRule?: string;
  exclusionReason?: string;
  pathRejected?: boolean;
  pathRejectReason?: string;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Recursive file discovery before any ApexOS writes. Never silently drops items. */
export async function walkFiles(root: string): Promise<InventoryFile[]> {
  const out: InventoryFile[] = [];
  const rootResolved = resolve(root);

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const abs = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.isSymbolicLink()) {
          try {
            await assertRealPathInsideRoot(rootResolved, abs);
          } catch (err) {
            out.push({
              absolutePath: abs,
              relativePath: normalizeIntakeRelative(rootResolved, abs),
              filename: entry.name,
              pathRejected: true,
              pathRejectReason:
                err instanceof PathEscapeError
                  ? err.message
                  : "Symlink directory escape refused under staging root policy.",
            });
            continue;
          }
        }
        await walk(abs);
        continue;
      }

      if (!entry.isFile() && !entry.isSymbolicLink()) continue;

      const relativePath = normalizeIntakeRelative(rootResolved, abs);
      if (!isPathInsideRoot(rootResolved, abs)) {
        out.push({
          absolutePath: abs,
          relativePath,
          filename: entry.name,
          pathRejected: true,
          pathRejectReason: `Path escape refused for “${relativePath}”.`,
        });
        continue;
      }

      try {
        await assertRealPathInsideRoot(rootResolved, abs);
      } catch (err) {
        out.push({
          absolutePath: abs,
          relativePath,
          filename: entry.name,
          pathRejected: true,
          pathRejectReason:
            err instanceof Error ? err.message : "Path/symlink escape refused.",
        });
        continue;
      }

      const exclusion = matchSystemSidecarExclusion(entry.name);
      if (exclusion) {
        out.push({
          absolutePath: abs,
          relativePath,
          filename: entry.name,
          excluded: true,
          exclusionRule: exclusion.rule,
          exclusionReason: exclusion.reason,
        });
        continue;
      }

      out.push({
        absolutePath: abs,
        relativePath,
        filename: entry.name,
      });
    }
  }

  await walk(rootResolved);
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function loadManifestPaths(
  root: string,
  manifestPath: string
): Promise<InventoryFile[]> {
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as
    | { files?: string[]; items?: Array<{ relativePath: string }> }
    | string[];
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed.items?.map((i) => i.relativePath) ?? parsed.files ?? []);
  const out: InventoryFile[] = [];
  for (const rel of list) {
    const abs = resolve(root, rel);
    if (!isPathInsideRoot(root, abs)) {
      out.push({
        absolutePath: abs,
        relativePath: rel.replace(/\\/g, "/"),
        filename: basename(rel),
        pathRejected: true,
        pathRejectReason: `Path escape refused for manifest entry “${rel}”.`,
      });
      continue;
    }
    await pathExists(abs);
    const exclusion = matchSystemSidecarExclusion(basename(rel));
    out.push({
      absolutePath: abs,
      relativePath: rel.replace(/\\/g, "/"),
      filename: basename(rel),
      ...(exclusion
        ? {
            excluded: true,
            exclusionRule: exclusion.rule,
            exclusionReason: exclusion.reason,
          }
        : {}),
    });
  }
  return out;
}

/**
 * Inventory + classify every file. Zero ApexOS writes.
 * Exclusions and path rejects are visible ClassifiedItems — never silent.
 */
export async function inventoryAndClassify(
  rootPath: string,
  opts?: { manifestPath?: string; maxFiles?: number }
): Promise<{ root: string; files: InventoryFile[]; classified: ClassifiedItem[] }> {
  const root = resolve(rootPath);
  const discovered = opts?.manifestPath
    ? await loadManifestPaths(root, resolve(opts.manifestPath))
    : await walkFiles(root);
  const files = opts?.maxFiles ? discovered.slice(0, opts.maxFiles) : discovered;
  const classified: ClassifiedItem[] = [];

  for (const file of files) {
    if (file.pathRejected) {
      classified.push({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        filename: file.filename,
        mimeType: "application/octet-stream",
        byteSize: 0,
        contentHash: "",
        sourceType: "unknown",
        handlingPath: "preserve_only_unsupported",
        classificationReason: file.pathRejectReason ?? "Path rejected",
        expectedLimitation: file.pathRejectReason,
        extractionSupport: "unsupported",
        encrypted: false,
        corrupt: false,
        excluded: false,
        pathRejected: true,
      });
      continue;
    }
    if (file.excluded) {
      let bytes = Buffer.alloc(0);
      try {
        bytes = await fs.readFile(file.absolutePath);
      } catch {
        /* exclusion still recorded */
      }
      classified.push({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        filename: file.filename,
        mimeType: "application/octet-stream",
        byteSize: bytes.length,
        contentHash: bytes.length ? contentHash(bytes) : "",
        sourceType: "system_sidecar",
        handlingPath: "excluded_system_sidecar",
        classificationReason:
          file.exclusionReason ?? `Excluded under ${SYSTEM_SIDECAR_EXCLUSION_RULE}`,
        expectedLimitation: "excluded—not ingested",
        extractionSupport: "unsupported",
        encrypted: false,
        corrupt: false,
        excluded: true,
        exclusionRule: file.exclusionRule ?? SYSTEM_SIDECAR_EXCLUSION_RULE,
      });
      continue;
    }

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(file.absolutePath);
    } catch (err) {
      classified.push({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        filename: file.filename,
        mimeType: "application/octet-stream",
        byteSize: 0,
        contentHash: "",
        sourceType: "unknown",
        handlingPath: "preserve_only_corrupt",
        classificationReason: "Cannot read file during inventory.",
        expectedLimitation: err instanceof Error ? err.message : "Cannot read file",
        extractionSupport: "unsupported",
        encrypted: false,
        corrupt: true,
      });
      continue;
    }
    classified.push(
      classifyFile({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        filename: file.filename,
        bytes,
      })
    );
  }

  return { root, files, classified };
}

export function shouldSkipFilename(name: string): boolean {
  return Boolean(matchSystemSidecarExclusion(name));
}
