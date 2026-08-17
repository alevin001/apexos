import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { getSupabase } from "../shared/supabase.js";
import { buildBatchReceipt } from "./batch-receipt.js";
import { classifyFile } from "./classify.js";
import {
  findSourceRowByHash,
  ingestSource,
  isIncompleteSourceRow,
  newRunExternalId,
} from "./ingest.js";
import { inventoryAndClassify } from "./inventory.js";
import {
  assertManifestExecutable,
  buildManifest,
  loadImportManifest,
  verifyManifestHashes,
  writeManifest,
} from "./manifest.js";
import {
  getProviderCallCounters,
  resetProviderCallCounters,
  resolveProviderMode,
  type ProviderMode,
} from "./provider-mode.js";
import type {
  AuthorityClassification,
  BulkImportSummary,
  HandlingPath,
  IngestionReceipt,
  ItemDisposition,
} from "./types.js";

export interface BulkImportOptions {
  rootPath: string;
  dryRun: boolean;
  method?: string;
  authorityClassification?: AuthorityClassification;
  scopeClassification?: string;
  /** Resume a prior execute run by external_id */
  resumeRunExternalId?: string;
  /**
   * Path to a Build 19 reconciled manifest (schema build19-manifest-1.0),
   * or legacy path-list manifest for inventory discovery only.
   */
  manifestPath?: string;
  /** Write inventory/classify dry-run manifest JSON here (local filesystem only) */
  writeManifestPath?: string;
  /** Mark written dry-run manifest as reconciled (operator confirmation) */
  markReconciled?: boolean;
  maxFiles?: number;
  /**
   * Required for execute when using a Build 19 manifest.
   * Explicit authorization — not inferred.
   */
  authorizeExecute?: boolean;
  /** Explicit provider mode for this batch (production must not silently use mocks) */
  providerMode?: ProviderMode;
}

/**
 * Bulk ingestion with zero-write dry-run, hash manifests, and resumable execute.
 */
export async function runBulkImport(opts: BulkImportOptions): Promise<BulkImportSummary> {
  if (opts.providerMode) {
    const { setProviderModeForTests } = await import("./provider-mode.js");
    setProviderModeForTests(opts.providerMode);
  }
  if (opts.dryRun) {
    return runZeroWriteDryRun(opts);
  }
  return runAuthorizedExecute(opts);
}

/** Dry-run: inventory + classify only. Zero ApexOS writes (no DB/storage). */
async function runZeroWriteDryRun(opts: BulkImportOptions): Promise<BulkImportSummary> {
  resetProviderCallCounters(opts.providerMode ?? resolveProviderMode());
  const { root, classified } = await inventoryAndClassify(opts.rootPath, {
    // Legacy path-list manifests may be used for discovery; Build 19 hash manifests use execute path
    maxFiles: opts.maxFiles,
  });

  // Optional read-only duplicate awareness (SELECT only — not a write)
  const existingHashes = new Set<string>();
  try {
    const supabase = getSupabase();
    const hashes = classified.map((c) => c.contentHash).filter(Boolean);
    if (hashes.length) {
      const { data } = await supabase
        .from("knowledge_sources")
        .select("content_hash")
        .in("content_hash", hashes.slice(0, 200));
      for (const row of data ?? []) {
        if (row.content_hash) existingHashes.add(String(row.content_hash));
      }
    }
  } catch {
    // Dry-run remains valid without DB connectivity — duplicates reported as unknown/new
  }

  const manifest = buildManifest({
    rootPath: root,
    classified,
    reconciled: opts.markReconciled ?? false,
    existingHashes,
  });

  if (opts.writeManifestPath) {
    await writeManifest(opts.writeManifestPath, manifest);
  }

  const runExternalId = newRunExternalId("DRY");
  const items: BulkImportSummary["items"] = [];
  let pending = 0;
  let duplicates = 0;
  let failed = 0;
  let excluded = 0;

  for (const item of manifest.items) {
    if (item.handlingPath === "excluded_system_sidecar" || item.itemKind === "excluded") {
      excluded += 1;
      items.push({
        path: item.relativePath,
        disposition: "excluded",
        reason: item.classificationReason,
        contentHash: item.contentHash,
        handlingPath: item.handlingPath,
      });
      continue;
    }
    if (item.itemKind === "path_rejected") {
      failed += 1;
      items.push({
        path: item.relativePath,
        disposition: "failed",
        reason: item.expectedLimitation ?? item.classificationReason,
        handlingPath: item.handlingPath,
      });
      continue;
    }
    if (item.duplicateStatus === "duplicate_of_existing") {
      duplicates += 1;
      items.push({
        path: item.relativePath,
        disposition: "duplicate",
        reason: `Would skip duplicate hash ${item.contentHash.slice(0, 12)}…`,
        contentHash: item.contentHash,
        handlingPath: item.handlingPath,
      });
      continue;
    }
    if (item.handlingPath === "deferred_mailbox_container") {
      pending += 1;
      items.push({
        path: item.relativePath,
        disposition: "deferred_mailbox",
        reason: item.classificationReason,
        contentHash: item.contentHash,
        handlingPath: item.handlingPath,
      });
      continue;
    }
    if (
      item.handlingPath.startsWith("preserve_only") ||
      item.handlingPath === "deferred_extraction" ||
      item.handlingPath === "email_message"
    ) {
      pending += 1;
      items.push({
        path: item.relativePath,
        disposition:
          item.handlingPath.startsWith("preserve_only") ? "preserve_only" : "would_ingest",
        reason: `${item.classificationReason}${
          item.expectedLimitation ? ` — ${item.expectedLimitation}` : ""
        }`,
        contentHash: item.contentHash,
        handlingPath: item.handlingPath,
      });
      continue;
    }
    if (!item.contentHash) {
      failed += 1;
      items.push({
        path: item.relativePath,
        disposition: "failed",
        reason: item.expectedLimitation ?? "Inventory failed",
        handlingPath: item.handlingPath,
      });
      continue;
    }
    pending += 1;
    items.push({
      path: item.relativePath,
      disposition: "would_ingest",
      reason: item.classificationReason,
      contentHash: item.contentHash,
      handlingPath: item.handlingPath,
    });
  }

  const counters = getProviderCallCounters();
  if (counters.visionCalls + counters.sourceCardCalls > 0) {
    throw new Error(
      "Dry-run safety violation: provider calls were invoked. Dry-run must make zero provider calls."
    );
  }

  const summary: BulkImportSummary = {
    runExternalId,
    dryRun: true,
    zeroWrites: true,
    filesDiscovered: classified.length,
    filesIngested: 0,
    filesDuplicate: duplicates,
    filesFailed: failed,
    filesPending: pending,
    filesSkipped: excluded,
    blockedChanged: 0,
    providerMode: resolveProviderMode(opts.providerMode),
    items,
  };
  summary.batchReceipt = buildBatchReceipt({
    runExternalId,
    summary,
    providerMode: opts.providerMode,
  });
  return summary;
}

async function runAuthorizedExecute(opts: BulkImportOptions): Promise<BulkImportSummary> {
  const root = resolve(opts.rootPath);
  const supabase = getSupabase();

  // Build 19 path: execute only from reconciled hash manifest
  if (opts.manifestPath) {
    const raw = await fs.readFile(resolve(opts.manifestPath), "utf8");
    const parsed = JSON.parse(raw) as { schemaVersion?: string; files?: string[] };

    if (parsed.schemaVersion === "build19-manifest-1.0") {
      if (!opts.authorizeExecute) {
        throw new Error(
          "Execute requires explicit --authorize-execute when using a Build 19 reconciled manifest."
        );
      }
      const manifest = await loadImportManifest(opts.manifestPath);
      assertManifestExecutable(manifest);

      const verified = await verifyManifestHashes(manifest, (p) => fs.readFile(p));
      if (!verified.ok) {
        return {
          runExternalId: newRunExternalId("BLK"),
          dryRun: false,
          filesDiscovered: manifest.items.length,
          filesIngested: 0,
          filesDuplicate: 0,
          filesFailed: 0,
          filesPending: 0,
          filesSkipped: 0,
          blockedChanged: verified.mismatches.length,
          items: verified.mismatches.map((m) => ({
            path: m.relativePath,
            disposition: "blocked_changed" as ItemDisposition,
            reason: `Hash mismatch: manifest ${m.expectedHash.slice(0, 12)}… vs file ${m.actualHash.slice(0, 12)}… — re-reconcile required`,
            contentHash: m.actualHash,
          })),
        };
      }

      return executeManifestItems(opts, manifest.items.map((item) => ({
        relativePath: item.relativePath,
        absolutePath: resolve(manifest.rootPath, item.relativePath),
        filename: item.filename,
        contentHash: item.contentHash,
        handlingPath: item.handlingPath,
        replacesSourceId: item.replacesSourceId,
        documentIdentity: item.documentIdentity,
        expectedLimitation: item.expectedLimitation,
      })));
    }
  }

  // Legacy execute (Build 18 compatibility): walk folder without reconciled hash manifest
  const { classified } = await inventoryAndClassify(root, {
    maxFiles: opts.maxFiles,
  });

  return executeManifestItems(
    opts,
    classified.map((c) => ({
      relativePath: c.relativePath,
      absolutePath: c.absolutePath ?? resolve(root, c.relativePath),
      filename: c.filename,
      contentHash: c.contentHash,
      handlingPath: c.handlingPath,
      expectedLimitation: c.expectedLimitation,
    }))
  );
}

async function executeManifestItems(
  opts: BulkImportOptions,
  files: Array<{
    relativePath: string;
    absolutePath: string;
    filename: string;
    contentHash: string;
    handlingPath: HandlingPath;
    replacesSourceId?: string;
    documentIdentity?: string;
    expectedLimitation?: string;
  }>
): Promise<BulkImportSummary> {
  resetProviderCallCounters(opts.providerMode ?? resolveProviderMode());
  const supabase = getSupabase();
  const runExternalId = opts.resumeRunExternalId ?? newRunExternalId("ING");
  const completedPaths = new Set<string>();
  let runId: string | undefined;
  let attachmentChildSources = 0;
  let attachmentLinks = 0;

  if (opts.resumeRunExternalId) {
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
        if (
          ["ingested", "duplicate", "skipped", "preserve_only", "deferred_extraction", "deferred_mailbox"].includes(
            item.disposition
          )
        ) {
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
        mode: "execute",
        method: opts.method ?? "bulk_import",
        root_path: resolve(opts.rootPath),
        manifest_path: opts.manifestPath ?? null,
        status: "running",
        dry_run: false,
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

  for (const file of files) {
    if (completedPaths.has(file.relativePath)) {
      skipped += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "skipped",
        reason: "Already completed in resumed run",
        handlingPath: file.handlingPath,
      });
      continue;
    }

    if (file.handlingPath === "excluded_system_sidecar") {
      skipped += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "excluded",
        reason: "Excluded under build19-system-sidecar-v1 — visibly recorded, not ingested.",
        contentHash: file.contentHash,
        handlingPath: file.handlingPath,
      });
      await recordItem(
        activeRunId,
        file.relativePath,
        file.filename,
        file.contentHash,
        "excluded",
        "Excluded under build19-system-sidecar-v1"
      );
      continue;
    }

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(file.absolutePath);
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : "Cannot read file";
      summaryItems.push({ path: file.relativePath, disposition: "failed", reason });
      await recordItem(activeRunId, file.relativePath, file.filename, null, "failed", reason);
      continue;
    }

    // Execute-time hash guard even for legacy walk
    const liveHash = (await import("./content-hash.js")).contentHash(bytes);
    if (file.contentHash && liveHash !== file.contentHash) {
      failed += 1;
      const reason =
        "File hash changed since inventory/manifest — refusing silent ingest of a different version.";
      summaryItems.push({
        path: file.relativePath,
        disposition: "blocked_changed",
        reason,
        contentHash: liveHash,
        handlingPath: file.handlingPath,
      });
      await recordItem(activeRunId, file.relativePath, file.filename, liveHash, "failed", reason);
      continue;
    }

    const classified = classifyFile({
      relativePath: file.relativePath,
      filename: file.filename,
      bytes,
    });

    const existing = await findSourceRowByHash(liveHash);
    if (existing && !isIncompleteSourceRow(existing)) {
      duplicates += 1;
      const reason = `Duplicate of ${existing.external_id}`;
      summaryItems.push({
        path: file.relativePath,
        disposition: "duplicate",
        reason,
        contentHash: liveHash,
        handlingPath: classified.handlingPath,
      });
      await recordItem(
        activeRunId,
        file.relativePath,
        file.filename,
        liveHash,
        "duplicate",
        reason,
        undefined,
        existing.id
      );
      continue;
    }

    let receipt: IngestionReceipt;
    try {
      receipt = await ingestSource({
        filename: file.filename,
        bytes,
        mimeType: classified.mimeType,
        sourceLocation: file.relativePath,
        sourceType: classified.sourceType,
        title: file.filename,
        authorityClassification: opts.authorityClassification ?? "unverified",
        scopeClassification: opts.scopeClassification,
        tags: ["bulk-import"],
        ingestionMethod: "bulk_import",
        handlingPath: file.handlingPath ?? classified.handlingPath,
        replacesSourceId: file.replacesSourceId,
        documentIdentity: file.documentIdentity,
      });
      if (receipt.attachmentCoverage) {
        attachmentChildSources += receipt.attachmentCoverage.total;
        attachmentLinks +=
          receipt.attachmentCoverage.confirmed +
          receipt.attachmentCoverage.blocked +
          receipt.attachmentCoverage.deferred;
      }
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : "Ingest failed";
      summaryItems.push({ path: file.relativePath, disposition: "failed", reason });
      await recordItem(activeRunId, file.relativePath, file.filename, liveHash, "failed", reason);
      continue;
    }

    if (receipt.claim === "duplicate") {
      duplicates += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "duplicate",
        reason: receipt.limitation,
        receipt,
        contentHash: liveHash,
        handlingPath: receipt.handlingPath,
      });
      await recordItem(
        activeRunId,
        file.relativePath,
        file.filename,
        liveHash,
        "duplicate",
        receipt.limitation,
        receipt
      );
    } else if (!receipt.durableKnowledgeConfirmed && receipt.claim === "not_ingested") {
      failed += 1;
      summaryItems.push({
        path: file.relativePath,
        disposition: "failed",
        reason: receipt.limitation ?? "Not confirmed ingested",
        receipt,
        contentHash: liveHash,
        handlingPath: receipt.handlingPath,
      });
      await recordItem(
        activeRunId,
        file.relativePath,
        file.filename,
        liveHash,
        "failed",
        receipt.limitation,
        receipt
      );
    } else {
      ingested += 1;
      const disposition: ItemDisposition =
        receipt.extractionStatus === "deferred"
          ? "deferred_extraction"
          : receipt.extractionStatus === "preserve_only" ||
              receipt.extractionStatus === "blocked_encrypted" ||
              receipt.extractionStatus === "blocked_corrupt"
            ? "preserve_only"
            : receipt.handlingPath === "deferred_mailbox_container"
              ? "deferred_mailbox"
              : "ingested";
      summaryItems.push({
        path: file.relativePath,
        disposition,
        reason: receipt.limitation,
        receipt,
        contentHash: liveHash,
        handlingPath: receipt.handlingPath,
      });
      await recordItem(
        activeRunId,
        file.relativePath,
        file.filename,
        liveHash,
        disposition,
        receipt.limitation,
        receipt
      );
    }
  }

  const summary: BulkImportSummary = {
    runExternalId,
    dryRun: false,
    zeroWrites: false,
    filesDiscovered: files.length,
    filesIngested: ingested,
    filesDuplicate: duplicates,
    filesFailed: failed,
    filesPending: 0,
    filesSkipped: skipped,
    providerMode: resolveProviderMode(opts.providerMode),
    items: summaryItems,
  };
  summary.batchReceipt = buildBatchReceipt({
    runExternalId,
    summary,
    attachmentChildSources,
    attachmentLinks,
    providerMode: opts.providerMode,
  });

  await supabase
    .from("ingestion_runs")
    .update({
      status: "completed",
      files_discovered: files.length,
      files_ingested: ingested,
      files_duplicate: duplicates,
      files_failed: failed,
      files_pending: 0,
      files_skipped: skipped,
      summary: {
        dryRun: false,
        itemCount: summaryItems.length,
        batchReceipt: summary.batchReceipt,
        providerMode: summary.providerMode,
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", activeRunId);

  return summary;
}

async function recordItem(
  runId: string,
  sourcePath: string,
  filename: string,
  hash: string | null,
  disposition: ItemDisposition,
  reason?: string,
  receipt?: IngestionReceipt,
  duplicateOfSourceId?: string
): Promise<void> {
  const supabase = getSupabase();
  // Map new dispositions to DB-safe values if constraint is still Build 18
  const dbDisposition = mapDispositionForDb(disposition);
  await supabase.from("ingestion_run_items").upsert(
    {
      run_id: runId,
      source_path: sourcePath,
      original_filename: filename,
      content_hash: hash,
      disposition: dbDisposition,
      reason: reason ?? null,
      receipt: receipt ?? {},
      duplicate_of_source_id: duplicateOfSourceId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "run_id,source_path" }
  );
}

/** Keep DB CHECK constraint happy until migration expands dispositions. */
function mapDispositionForDb(disposition: ItemDisposition): string {
  switch (disposition) {
    case "preserve_only":
      return "deferred_extraction";
    case "blocked_changed":
      return "failed";
    case "deferred_mailbox":
      return "skipped";
    case "excluded":
      return "skipped";
    default:
      return disposition;
  }
}

/** Format operator summary for CLI stdout. */
export function formatBulkSummary(summary: BulkImportSummary): string {
  const lines = [
    `Ingestion run: ${summary.runExternalId}`,
    `Mode: ${
      summary.dryRun
        ? `DRY RUN (zero ApexOS writes${summary.zeroWrites ? " confirmed" : ""})`
        : "EXECUTE"
    }`,
    `Files discovered: ${summary.filesDiscovered}`,
    `Files ingested: ${summary.filesIngested}`,
    `Duplicates/skipped: ${summary.filesDuplicate + summary.filesSkipped}`,
    `Failed: ${summary.filesFailed}`,
    `Blocked (changed hash): ${summary.blockedChanged ?? 0}`,
    `Processing still pending (dry-run candidates): ${summary.filesPending}`,
    "",
    "Per-file:",
  ];
  for (const item of summary.items) {
    lines.push(
      `  [${item.disposition}] ${item.path}${item.handlingPath ? ` {${item.handlingPath}}` : ""}${
        item.reason ? ` — ${item.reason}` : ""
      }`
    );
  }
  return lines.join("\n");
}

/** Stable content identity for tests without IO. */
export function hashPathHint(path: string): string {
  return createHash("sha256").update(path).digest("hex").slice(0, 12);
}
