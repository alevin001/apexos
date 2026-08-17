/**
 * Build 19 Checkpoint G — batch import receipt (operational provenance only).
 */
import {
  getProviderCallCounters,
  resolveProviderMode,
  type ProviderMode,
} from "./provider-mode.js";
import type {
  BatchImportReceipt,
  BulkImportSummary,
  IngestionReceipt,
  ProviderModeLabel,
} from "./types.js";

export function buildBatchReceipt(input: {
  runExternalId: string;
  summary: BulkImportSummary;
  attachmentChildSources?: number;
  attachmentLinks?: number;
  providerMode?: ProviderMode;
}): BatchImportReceipt {
  const mode = (input.providerMode ?? resolveProviderMode()) as ProviderModeLabel;
  const counters = getProviderCallCounters();
  const receipts = input.summary.items
    .map((i) => i.receipt)
    .filter((r): r is IngestionReceipt => Boolean(r));

  let retrievalReadySources = 0;
  let preserveOnlyOrDeferred = 0;
  let blockedSources = 0;
  let cardsGenerated = 0;
  let cardsWithheld = 0;
  let cardsFailed = 0;
  let cardsUnavailable = 0;
  const uniqueSourceIds = new Set<string>();

  for (const r of receipts) {
    if (r.sourceExternalId) uniqueSourceIds.add(r.sourceExternalId);
    if (r.retrievalReady) retrievalReadySources += 1;
    if (
      r.extractionStatus === "preserve_only" ||
      r.extractionStatus === "deferred" ||
      r.handlingPath === "deferred_mailbox_container" ||
      r.handlingPath?.startsWith("preserve_only")
    ) {
      preserveOnlyOrDeferred += 1;
    }
    if (
      r.extractionStatus === "blocked_corrupt" ||
      r.extractionStatus === "blocked_encrypted" ||
      r.claim === "not_ingested"
    ) {
      blockedSources += 1;
    }
    switch (r.sourceCardStatus) {
      case "generated":
      case "generated_partial":
        cardsGenerated += 1;
        break;
      case "withheld":
        cardsWithheld += 1;
        break;
      case "failed":
        cardsFailed += 1;
        break;
      case "unavailable":
        cardsUnavailable += 1;
        break;
      default:
        break;
    }
  }

  for (const item of input.summary.items) {
    if (
      item.disposition === "preserve_only" ||
      item.disposition === "deferred_extraction" ||
      item.disposition === "deferred_mailbox"
    ) {
      if (!item.receipt) preserveOnlyOrDeferred += 1;
    }
    if (item.disposition === "excluded") {
      /* counted in discovered only */
    }
  }

  const incompleteOrRetryable = input.summary.items.filter(
    (i) =>
      i.disposition === "failed" ||
      i.disposition === "pending" ||
      (i.receipt &&
        (i.receipt.processingStatus === "stored" ||
          i.receipt.extractionStatus === "pending"))
  ).length;

  const liveCalls =
    mode === "live" ? counters.visionCalls + counters.sourceCardCalls : 0;
  const mockCalls =
    mode === "test_mock" ? counters.visionCalls + counters.sourceCardCalls : 0;

  return {
    runExternalId: input.runExternalId,
    providerMode: mode,
    discoveredItems: input.summary.filesDiscovered,
    uniqueDurableSources: uniqueSourceIds.size || input.summary.filesIngested,
    duplicateOccurrences: input.summary.filesDuplicate,
    attachmentChildSources: input.attachmentChildSources ?? 0,
    attachmentLinks: input.attachmentLinks ?? 0,
    retrievalReadySources,
    preserveOnlyOrDeferredSources: preserveOnlyOrDeferred,
    blockedSources,
    sourceCardsGenerated: cardsGenerated,
    sourceCardsWithheld: cardsWithheld,
    sourceCardsFailed: cardsFailed,
    sourceCardsUnavailable: cardsUnavailable,
    incompleteOrRetryableItems: incompleteOrRetryable,
    liveProviderCalls: liveCalls,
    testMockProviderCalls: mockCalls,
    visionProviderCalls: counters.visionCalls,
    sourceCardProviderCalls: counters.sourceCardCalls,
    dryRun: input.summary.dryRun,
    zeroProtectedWrites: input.summary.zeroWrites,
  };
}
