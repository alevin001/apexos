import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { getSupabase } from "../shared/supabase.js";
import { contentHash } from "./content-hash.js";
import { findDuplicateByHash, ingestSource, newRunExternalId } from "./ingest.js";
import { classifySourceType, guessMimeType, isStorable } from "./mime.js";
import type {
  AuthorityClassification,
  BulkImportSummary,
  IngestionReceipt,
  ItemDisposition,
} from "./types.js";

const SKIP_NAMES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
  "readme.md",
  ".gitkeep",
]);

const SKIP_EXT = new Set([".meta.md"]);

export interface BulkImportOptions {
  rootPath: string;
  dryRun: boolean;
  method?: string;
  authorityClassification?: AuthorityClassification;
  scopeClassification?: string;
  /** Resume a prior execute run by external_id */
  resumeRunExternalId?: string;
  /** Optional manifest JSON listing relative paths */
  manifestPath?: string;
  maxFiles?: number;
}

interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  filename: string;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root: string): Promise<DiscoveredFile[]> {
  const out: DiscoveredFile[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const lower = entry.name.toLowerCase();
      if (SKIP_NAMES.has(lower)) continue;
      if (lower.endsWith(".meta.md")) continue;
      if (SKIP_EXT.has(extname(lower))) continue;
      out.push({
        absolutePath: abs,
        relativePath: relative(root, abs).replace(/\\/g, "/"),
        filename: entry.name,
      });
    }
  }

  await walk(root);
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function loadManifestFiles(root: string, manifestPath: string): Promise<DiscoveredFile[]> {
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as { files?: string[] } | string[];
  const list = Array.isArray(parsed) ? parsed : (parsed.files ?? []);
  const out: DiscoveredFile[] = [];
  for (const rel of list) {
    const abs = resolve(root, rel);
    if (!(await pathExists(abs))) {
      out.push({
        absolutePath: abs,
        relativePath: rel.replace(/\\/g, "/"),
        filename: basename(rel),
      });
      continue;
    }
    const stat = await fs.stat(abs);
    if (!stat.isFile()) continue;
    out.push({
      absolutePath: abs,
      relativePath: rel.replace(/\\/g, "/"),
      filename: basename(rel),
    });
  }
  return out;
}

/**
 * Bulk ingestion with dry-run, duplicate detection, and resumable execute runs.
 */
export async function runBulkImport(opts: BulkImportOptions): Promise<BulkImportSummary> {
  const root = resolve(opts.rootPath);
  const discovered = opts.manifestPath
    ? await loadManifestFiles(root, resolve(opts.manifestPath))
    : await walkFiles(root);

  const files = opts.maxFiles ? discovered.slice(0, opts.maxFiles) : discovered;
  const supabase = getSupabase();
  const runExternalId = opts.resumeRunExternalId ?? newRunExternalId(opts.dryRun ? "DRY" : "ING");

  const completedPaths = new Set<string>();
  let runId: string | undefined;

  if (opts.resumeRunExternalId && !opts.dryRun) {
    const { data: existing } = await supabase
      .from("ingestion_runs")
      .select("id, status")
      .eq("external_id", opts.resumeRunExternalId)
      .maybeSingle();
    if (existing) {
      runId = existing.id as string;
      const { data: items } = await supabase
        .from("ingestion_run_items")
        .select("source_path, disposition")
        .eq("run_id", existing.id);
      for (const item of items ?? []) {
        if (["ingested", "duplicate", "skipped"].includes(item.disposition)) {
          completedPaths.add(item.source_path);
        }
      }
    }
  }

  if (!runId) {
    const { data: run, error } = await supabase
      .from("ingestion_runs")
      .insert({
        external_id: runExternalId,
        mode: opts.dryRun ? "dry_run" : "execute",
        method: opts.method ?? "bulk_import",
        root_path: root,
        manifest_path: opts.manifestPath ?? null,
        status: "running",
        dry_run: opts.dryRun,
        files_discovered: files.length,
      })
      .select("id")
      .single();
    if (error || !run) {
      throw new Error(`Failed to create ingestion run: ${error?.message ?? "unknown"}`);
    }
    runId = run.id as string;
  }

  const activeRunId = runId;

  const summaryItems: BulkImportSummary["items"] = [];
  let ingested = 0;
  let duplicates = 0;
  let failed = 0;
  let skipped = 0;
  let pending = 0;

  for (const file of files) {
    if (completedPaths.has(file.relativePath)) {
      skipped += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "skipped",
        reason: "Already completed in resumed run",
      });
      continue;
    }

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(file.absolutePath);
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : "Cannot read file";
      summaryItems.push({ path: file.relativePath, disposition: "failed", reason });
      await recordItem(activeRunId, file, null, "failed", reason);
      continue;
    }

    const hash = contentHash(bytes);
    const mimeType = guessMimeType(file.filename);
    const sourceType = classifySourceType(file.filename, mimeType);
    const duplicate = await findDuplicateByHash(hash);

    if (duplicate) {
      duplicates += 1;
      const reason = `Duplicate of ${duplicate.external_id}`;
      summaryItems.push({ path: file.relativePath, disposition: "duplicate", reason });
      await recordItem(activeRunId, file, hash, "duplicate", reason, undefined, duplicate.id);
      continue;
    }

    if (!isStorable(mimeType)) {
      failed += 1;
      const reason = `Unsupported/storable MIME: ${mimeType}`;
      summaryItems.push({ path: file.relativePath, disposition: "unsupported", reason });
      await recordItem(activeRunId, file, hash, "unsupported", reason);
      continue;
    }

    if (opts.dryRun) {
      pending += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "would_ingest",
        reason: `Would ingest as ${sourceType} (${mimeType}, ${bytes.length} bytes)`,
      });
      await recordItem(
        activeRunId,
        file,
        hash,
        "would_ingest",
        `Would ingest as ${sourceType}`,
        undefined,
        undefined
      );
      continue;
    }

    let receipt: IngestionReceipt;
    try {
      receipt = await ingestSource({
        filename: file.filename,
        bytes,
        mimeType,
        sourceLocation: file.relativePath,
        sourceType,
        title: file.filename,
        authorityClassification: opts.authorityClassification ?? "unverified",
        scopeClassification: opts.scopeClassification,
        tags: ["bulk-import"],
        ingestionMethod: "bulk_import",
      });
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : "Ingest failed";
      summaryItems.push({ path: file.relativePath, disposition: "failed", reason });
      await recordItem(activeRunId, file, hash, "failed", reason);
      continue;
    }

    if (receipt.claim === "duplicate") {
      duplicates += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "duplicate",
        reason: receipt.limitation,
        receipt,
      });
      await recordItem(activeRunId, file, hash, "duplicate", receipt.limitation, receipt);
    } else if (!receipt.durableKnowledgeConfirmed && receipt.claim === "not_ingested") {
      failed += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "failed",
        reason: receipt.limitation ?? "Not confirmed ingested",
        receipt,
      });
      await recordItem(activeRunId, file, hash, "failed", receipt.limitation, receipt);
    } else {
      ingested += 1;
      const disposition: ItemDisposition =
        receipt.extractionStatus === "deferred" ? "deferred_extraction" : "ingested";
      summaryItems.push({
        path: file.relativePath,
        disposition,
        reason: receipt.limitation,
        receipt,
      });
      await recordItem(activeRunId, file, hash, disposition, receipt.limitation, receipt);
    }
  }

  const summary: BulkImportSummary = {
    runExternalId,
    dryRun: opts.dryRun,
    filesDiscovered: files.length,
    filesIngested: ingested,
    filesDuplicate: duplicates,
    filesFailed: failed,
    filesPending: pending,
    filesSkipped: skipped,
    items: summaryItems,
  };

  await supabase
    .from("ingestion_runs")
    .update({
      status: "completed",
      files_discovered: files.length,
      files_ingested: ingested,
      files_duplicate: duplicates,
      files_failed: failed,
      files_pending: pending,
      files_skipped: skipped,
      summary: {
        dryRun: opts.dryRun,
        itemCount: summaryItems.length,
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", activeRunId);

  return summary;
}

async function recordItem(
  runId: string,
  file: DiscoveredFile,
  hash: string | null,
  disposition: ItemDisposition,
  reason?: string,
  receipt?: IngestionReceipt,
  duplicateOfSourceId?: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("ingestion_run_items").upsert(
    {
      run_id: runId,
      source_path: file.relativePath,
      original_filename: file.filename,
      content_hash: hash,
      disposition,
      reason: reason ?? null,
      receipt: receipt ?? {},
      duplicate_of_source_id: duplicateOfSourceId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "run_id,source_path" }
  );
}

/** Format operator summary for CLI stdout. */
export function formatBulkSummary(summary: BulkImportSummary): string {
  const lines = [
    `Ingestion run: ${summary.runExternalId}`,
    `Mode: ${summary.dryRun ? "DRY RUN (no durable writes of sources)" : "EXECUTE"}`,
    `Files discovered: ${summary.filesDiscovered}`,
    `Files ingested: ${summary.filesIngested}`,
    `Duplicates/skipped: ${summary.filesDuplicate + summary.filesSkipped}`,
    `Failed: ${summary.filesFailed}`,
    `Processing still pending (dry-run candidates): ${summary.filesPending}`,
    "",
    "Per-file:",
  ];
  for (const item of summary.items) {
    lines.push(`  [${item.disposition}] ${item.path}${item.reason ? ` — ${item.reason}` : ""}`);
  }
  return lines.join("\n");
}

/** Stable content identity for tests without IO. */
export function hashPathHint(path: string): string {
  return createHash("sha256").update(path).digest("hex").slice(0, 12);
}
