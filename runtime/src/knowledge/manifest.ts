import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { toManifestItem, type ClassifiedItem } from "./classify.js";
import { contentHash } from "./content-hash.js";
import {
  annotateProviderMode,
  buildPreflightSummary,
  enrichManifestItem,
} from "./preflight.js";
import { resolveProviderMode } from "./provider-mode.js";
import type { ImportManifest, ImportManifestItem } from "./types.js";

export const MANIFEST_SCHEMA_VERSION = "build19-manifest-1.0" as const;

export function buildManifest(input: {
  rootPath: string;
  classified: ClassifiedItem[];
  reconciled?: boolean;
  notes?: string[];
  /** Existing content hashes in ApexOS (read-only duplicate awareness) */
  existingHashes?: Set<string>;
}): ImportManifest {
  const existing = input.existingHashes ?? new Set<string>();
  const seenHashes = new Set<string>();
  const items: ImportManifestItem[] = input.classified.map((c) => {
    const duplicateStatus = c.contentHash && existing.has(c.contentHash)
      ? "duplicate_of_existing"
      : "new";
    let duplicateOccurrence = false;
    if (c.contentHash && !c.excluded && !c.pathRejected) {
      if (seenHashes.has(c.contentHash)) duplicateOccurrence = true;
      else seenHashes.add(c.contentHash);
    }
    const base = toManifestItem(c, duplicateStatus);
    return enrichManifestItem(base, c, { duplicateOccurrence });
  });

  const providerMode = resolveProviderMode();
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    reconciled: input.reconciled ?? false,
    createdAt: new Date().toISOString(),
    rootPath: resolve(input.rootPath),
    items,
    preflightSummary: buildPreflightSummary(items),
    ...annotateProviderMode(providerMode),
    notes: input.notes ?? [
      "Dry-run / inventory artifact. Execute only after reconciled=true and explicit authorization.",
      "Changed content hashes at execute time must stop or require re-reconciliation.",
      "Version lineage is never inferred from filename or path.",
      "Batch manifest is operational provenance only — never evidence or retrieval-eligible.",
      "Exclusions under build19-system-sidecar-v1 are visibly recorded; never silently ignored.",
    ],
  };
}

export async function writeManifest(path: string, manifest: ImportManifest): Promise<void> {
  await fs.writeFile(resolve(path), JSON.stringify(manifest, null, 2), "utf8");
}

export async function loadImportManifest(path: string): Promise<ImportManifest> {
  const raw = await fs.readFile(resolve(path), "utf8");
  const parsed = JSON.parse(raw) as ImportManifest;
  if (parsed.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported manifest schemaVersion: ${String(parsed.schemaVersion)}. Expected ${MANIFEST_SCHEMA_VERSION}.`
    );
  }
  if (!Array.isArray(parsed.items)) {
    throw new Error("Manifest missing items array.");
  }
  return parsed;
}

export type ManifestReconcileResult =
  | { ok: true; manifest: ImportManifest }
  | {
      ok: false;
      reason: string;
      mismatches: Array<{ relativePath: string; expectedHash: string; actualHash: string }>;
    };

/**
 * Re-hash files against a reconciled manifest. Never silently ingest a different version.
 */
export async function verifyManifestHashes(
  manifest: ImportManifest,
  readFile: (absolutePath: string) => Promise<Buffer>
): Promise<ManifestReconcileResult> {
  const mismatches: Array<{ relativePath: string; expectedHash: string; actualHash: string }> = [];

  for (const item of manifest.items) {
    const abs = resolve(manifest.rootPath, item.relativePath);
    let bytes: Buffer;
    try {
      bytes = await readFile(abs);
    } catch (err) {
      return {
        ok: false,
        reason: `Cannot read ${item.relativePath} for hash verification: ${
          err instanceof Error ? err.message : "read failed"
        }`,
        mismatches,
      };
    }
    const actual = contentHash(bytes);
    if (actual !== item.contentHash) {
      mismatches.push({
        relativePath: item.relativePath,
        expectedHash: item.contentHash,
        actualHash: actual,
      });
    }
  }

  if (mismatches.length > 0) {
    return {
      ok: false,
      reason:
        "One or more files changed since manifest creation. Re-reconcile before execute — refusing silent ingest of a different version.",
      mismatches,
    };
  }

  return { ok: true, manifest };
}

export function assertManifestExecutable(manifest: ImportManifest): void {
  if (!manifest.reconciled) {
    throw new Error(
      "Manifest is not marked reconciled=true. Review inventory/classify output, set reconciled, then authorize execute."
    );
  }
}
