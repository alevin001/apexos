/**
 * Build 18/19 — knowledge ingestion CLI
 *
 * Zero-write dry-run + local manifest:
 *   npm run knowledge:ingest -- --dry-run --path ../knowledge/import/seed-controlled --write-manifest ../knowledge/import/seed-controlled.manifest.json
 *
 * Authorized execute from reconciled Build 19 manifest:
 *   npm run knowledge:ingest -- --execute --authorize-execute --path <folder> --manifest <reconciled.json>
 *
 * Single file:
 *   npm run knowledge:ingest-file -- --file ./path/to/file.md
 *
 * Resume:
 *   npm run knowledge:ingest -- --execute --path ... --resume ING-...
 */
import { promises as fs } from "node:fs";
import { basename, resolve } from "node:path";
import { formatBulkSummary, runBulkImport } from "../knowledge/bulk-import.js";
import { ingestSource } from "../knowledge/ingest.js";
import { formatReceiptPlainLanguage } from "../knowledge/receipt.js";
import type { AuthorityClassification } from "../knowledge/types.js";

function argValue(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx < 0) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const singleFile = argValue(args, "--file");

  if (singleFile) {
    const abs = resolve(singleFile);
    const bytes = await fs.readFile(abs);
    const receipt = await ingestSource({
      filename: basename(abs),
      bytes,
      sourceLocation: abs,
      title: argValue(args, "--title") ?? basename(abs),
      sourceOwner: argValue(args, "--owner"),
      authorityClassification:
        (argValue(args, "--authority") as AuthorityClassification) ?? "unverified",
      scopeClassification: argValue(args, "--scope"),
      documentIdentity: argValue(args, "--document-identity"),
      replacesSourceId: argValue(args, "--replaces-source-id"),
      ingestionMethod: "single_file",
      tags: ["single-file"],
    });
    console.log(formatReceiptPlainLanguage(receipt));
    console.log("\nReceipt JSON:");
    console.log(JSON.stringify(receipt, null, 2));
    if (!receipt.durableKnowledgeConfirmed) process.exitCode = 1;
    return;
  }

  const path = argValue(args, "--path");
  if (!path) {
    console.error(
      "Usage:\n" +
        "  npm run knowledge:ingest -- --dry-run --path <import-folder> [--write-manifest <file>]\n" +
        "  npm run knowledge:ingest -- --execute --authorize-execute --path <folder> --manifest <reconciled.json>\n" +
        "  npm run knowledge:ingest-file -- --file <path>"
    );
    process.exit(1);
  }

  const dryRun = hasFlag(args, "--dry-run") || !hasFlag(args, "--execute");
  if (!hasFlag(args, "--dry-run") && !hasFlag(args, "--execute")) {
    console.log("Neither --dry-run nor --execute specified; defaulting to --dry-run.\n");
  }

  const providerModeRaw = argValue(args, "--provider-mode");
  const providerMode =
    providerModeRaw === "live" ||
    providerModeRaw === "test_mock" ||
    providerModeRaw === "disabled"
      ? providerModeRaw
      : undefined;

  const summary = await runBulkImport({
    rootPath: path,
    dryRun,
    manifestPath: argValue(args, "--manifest"),
    writeManifestPath: argValue(args, "--write-manifest"),
    markReconciled: hasFlag(args, "--mark-reconciled"),
    authorizeExecute: hasFlag(args, "--authorize-execute"),
    resumeRunExternalId: argValue(args, "--resume"),
    authorityClassification:
      (argValue(args, "--authority") as AuthorityClassification) ?? "unverified",
    scopeClassification: argValue(args, "--scope"),
    maxFiles: argValue(args, "--max") ? Number(argValue(args, "--max")) : undefined,
    providerMode,
  });

  console.log(formatBulkSummary(summary));
  if (summary.batchReceipt) {
    console.log("\nBatch receipt (operational provenance only — not evidence):");
    console.log(JSON.stringify(summary.batchReceipt, null, 2));
  }
  console.log("\nSummary JSON:");
  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun && (summary.filesFailed > 0 || (summary.blockedChanged ?? 0) > 0)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
