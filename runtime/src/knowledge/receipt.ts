import {
  DEFAULT_AUTHORITY_DISPLAY,
  type AttachmentCoverageSummary,
  type AuthorityClassification,
  type DurableSourceRecordStatus,
  type ExtractionStatus,
  type HandlingPath,
  type IngestionReceipt,
  type IntegrityStatus,
  type InventoryStatus,
  type OriginalStorageStatus,
  type ProcessingStatus,
  type ProviderModeLabel,
  type RetrievalReadiness,
  type RetrievalUnitStatus,
} from "./types.js";
import { resolveProviderMode } from "./provider-mode.js";

export function authorityDisplayFor(classification: AuthorityClassification): string {
  if (classification === "unverified") return DEFAULT_AUTHORITY_DISPLAY;
  return `${classification} (governed classification — relevance is not authority)`;
}

export function buildReceipt(input: {
  ingested: boolean;
  claim: IngestionReceipt["claim"];
  title: string;
  sourceType: string;
  originalStored: boolean;
  originalAvailable: boolean;
  textExtracted: boolean;
  retrievalReady: boolean;
  authorityClassification: AuthorityClassification;
  extractionStatus: ExtractionStatus;
  processingStatus: ProcessingStatus;
  integrityStatus: IntegrityStatus;
  limitation?: string;
  sourceExternalId?: string;
  duplicateOfExternalId?: string;
  retrievalUnitCount: number;
  inventoryStatus?: InventoryStatus;
  originalStorageStatus?: OriginalStorageStatus;
  durableSourceRecordStatus?: DurableSourceRecordStatus;
  retrievalUnitStatus?: RetrievalUnitStatus;
  retrievalReadiness?: RetrievalReadiness;
  handlingPath?: HandlingPath;
  materialLimitations?: string;
  documentIdentity?: string;
  attachmentCoverage?: AttachmentCoverageSummary;
  parentEmailExternalIds?: string[];
  pageCoverageComplete?: boolean;
  sourceCardStatus?: IngestionReceipt["sourceCardStatus"];
  sourceCardExternalId?: string;
  sourceCardCoverage?: string;
  sourceCardLimitation?: string;
  sourceCardMayInformRecall?: boolean;
  providerMode?: ProviderModeLabel;
}): IngestionReceipt {
  const durableSourceRecordStatus: DurableSourceRecordStatus =
    input.durableSourceRecordStatus ??
    (input.sourceExternalId ? "persisted" : "not_created");

  const originalStorageStatus: OriginalStorageStatus =
    input.originalStorageStatus ??
    (input.originalStored ? "stored" : "not_applicable");

  /**
   * Locked Build 19 rule:
   * durableKnowledgeConfirmed requires private original storage AND durable source-record
   * persistence. Extraction alone can never satisfy it.
   */
  const durableKnowledgeConfirmed =
    Boolean(input.sourceExternalId) &&
    durableSourceRecordStatus === "persisted" &&
    input.originalStored === true &&
    originalStorageStatus === "stored" &&
    (input.claim === "ingested" || input.claim === "partial") &&
    (input.processingStatus === "processed" ||
      input.processingStatus === "stored" ||
      input.processingStatus === "registered");

  const retrievalReadiness: RetrievalReadiness =
    input.retrievalReadiness ??
    (input.retrievalReady ? "ready" : "not_ready");

  const retrievalUnitStatus: RetrievalUnitStatus =
    input.retrievalUnitStatus ??
    (input.retrievalUnitCount > 0 ? "created" : "none");

  const glassBoxHint = durableKnowledgeConfirmed
    ? `Say “Show the Glass Box” after asking about this source to inspect authority, locator, retrieval reason, and excerpts. Source: ${input.title}. Retrieval is not authority.`
    : "This material is not confirmed as fully ingested durable ApexOS knowledge (requires private original storage and a durable source record). Ask ApexOS to ingest the original file explicitly, then inspect via the Glass Box.";

  return {
    ingested: durableKnowledgeConfirmed,
    claim: input.claim,
    title: input.title,
    sourceType: input.sourceType,
    originalStored: input.originalStored,
    originalAvailable: input.originalAvailable,
    textExtracted: input.textExtracted,
    retrievalReady: input.retrievalReady,
    authorityClassification: input.authorityClassification,
    authorityDisplay: authorityDisplayFor(input.authorityClassification),
    extractionStatus: input.extractionStatus,
    processingStatus: input.processingStatus,
    integrityStatus: input.integrityStatus,
    limitation: input.limitation,
    glassBoxHint,
    sourceExternalId: input.sourceExternalId,
    duplicateOfExternalId: input.duplicateOfExternalId,
    retrievalUnitCount: input.retrievalUnitCount,
    providerMode: input.providerMode ?? resolveProviderMode(),
    durableKnowledgeConfirmed,
    inventoryStatus: input.inventoryStatus ?? "executed",
    originalStorageStatus,
    durableSourceRecordStatus,
    retrievalUnitStatus,
    retrievalReadiness,
    handlingPath: input.handlingPath,
    materialLimitations: input.materialLimitations ?? input.limitation,
    documentIdentity: input.documentIdentity,
    attachmentCoverage: input.attachmentCoverage,
    parentEmailExternalIds: input.parentEmailExternalIds,
    pageCoverageComplete: input.pageCoverageComplete,
    sourceCardStatus: input.sourceCardStatus ?? "none",
    sourceCardExternalId: input.sourceCardExternalId,
    sourceCardCoverage: input.sourceCardCoverage,
    sourceCardLimitation: input.sourceCardLimitation,
    sourceCardMayInformRecall: input.sourceCardMayInformRecall,
  };
}

/** Executive-facing plain-language receipt. */
export function formatReceiptPlainLanguage(receipt: IngestionReceipt): string {
  const lines: string[] = [];
  const lim = receipt.materialLimitations ?? receipt.limitation ?? "";
  const extractionBlocked =
    receipt.extractionStatus === "blocked_encrypted" ||
    receipt.extractionStatus === "blocked_corrupt" ||
    receipt.extractionStatus === "preserve_only" ||
    receipt.extractionStatus === "failed" ||
    receipt.extractionStatus === "deferred" ||
    receipt.extractionStatus === "unsupported";
  const isEmail =
    receipt.handlingPath === "email_message" || receipt.sourceType === "email";
  const isAttachmentChild =
    receipt.handlingPath === "email_attachment_child" ||
    Boolean(receipt.parentEmailExternalIds?.length);
  const visionIncomplete =
    /vision extraction partial or blocked|not fully extracted|coverage unavailable/i.test(lim) ||
    (/vision extraction blocked|vision provider (?:failure|error|timed out|unavailable)|timed out/i.test(
      lim
    ) &&
      !receipt.pageCoverageComplete);

  if (receipt.claim === "duplicate") {
    lines.push(
      `“${receipt.title}” matches an existing ApexOS source (duplicate detected). The prior original was preserved — nothing was overwritten.`
    );
  } else if (
    receipt.durableKnowledgeConfirmed &&
    isEmail &&
    receipt.retrievalReady &&
    !extractionBlocked
  ) {
    lines.push(
      `ingested—original preserved; deterministic email extraction confirmed; retrieval-ready for confirmed email units. (“${receipt.title}”)`
    );
    if (receipt.attachmentCoverage) {
      lines.push(receipt.attachmentCoverage.summary);
    }
  } else if (
    receipt.durableKnowledgeConfirmed &&
    isEmail &&
    !receipt.retrievalReady &&
    extractionBlocked
  ) {
    lines.push(
      `ingested—original preserved; email extraction blocked; not retrieval-ready. (“${receipt.title}”)`
    );
  } else if (
    receipt.durableKnowledgeConfirmed &&
    isAttachmentChild &&
    !receipt.retrievalReady &&
    extractionBlocked
  ) {
    lines.push(
      `ingested—original preserved; attachment extraction blocked; not retrieval-ready. (“${receipt.title}”)`
    );
  } else if (
    receipt.durableKnowledgeConfirmed &&
    !receipt.retrievalReady &&
    extractionBlocked
  ) {
    const visionish =
      (receipt.handlingPath === "vision_assisted" || /vision/i.test(lim)) &&
      /blocked|partial|fail|timeout|unavailable/i.test(lim || receipt.extractionStatus);
    lines.push(
      visionish
        ? `ingested—original preserved; vision extraction partial or blocked; retrieval availability limited to confirmed units. (“${receipt.title}”)`
        : `ingested—original preserved; extraction blocked; not retrieval-ready. (“${receipt.title}”)`
    );
  } else if (
    receipt.durableKnowledgeConfirmed &&
    receipt.retrievalReady &&
    receipt.pageCoverageComplete
  ) {
    lines.push(
      `ingested—original preserved; page coverage confirmed; retrieval-ready for confirmed units. (“${receipt.title}”)`
    );
  } else if (
    receipt.durableKnowledgeConfirmed &&
    receipt.retrievalReady &&
    visionIncomplete &&
    !receipt.pageCoverageComplete
  ) {
    lines.push(
      `ingested—original preserved; vision extraction partial or blocked; retrieval availability limited to confirmed units. (“${receipt.title}”)`
    );
  } else if (receipt.claim === "ingested" && receipt.durableKnowledgeConfirmed) {
    lines.push(`ApexOS ingested “${receipt.title}” into the durable knowledge base.`);
  } else if (receipt.claim === "partial") {
    lines.push(
      `ApexOS could not fully complete “${receipt.title}” (original and/or extraction incomplete).`
    );
  } else {
    lines.push(`ApexOS did not confirm durable ingestion of “${receipt.title}”.`);
  }

  lines.push(
    `Original stored: ${receipt.originalStored ? "yes" : "no"}.`,
    `Durable source record: ${receipt.durableSourceRecordStatus}.`,
    `Text extracted: ${receipt.textExtracted ? "yes" : "no"}.`,
    `Ready for retrieval: ${receipt.retrievalReady ? "yes" : "no"} (${receipt.retrievalReadiness}).`,
    `Authority status: ${receipt.authorityDisplay}.`,
    `Extraction status: ${receipt.extractionStatus}.`,
    `Processing status: ${receipt.processingStatus}.`,
    `Handling path: ${receipt.handlingPath ?? "unspecified"}.`
  );

  if (receipt.pageCoverageComplete) {
    lines.push("Page/image coverage: confirmed complete for required units.");
  }
  if (receipt.attachmentCoverage) {
    lines.push(`Attachment coverage: ${receipt.attachmentCoverage.summary}`);
  }
  if (receipt.parentEmailExternalIds?.length) {
    lines.push(
      `Parent email source(s) via attachment links: ${receipt.parentEmailExternalIds.join(", ")}`
    );
  }
  if (receipt.sourceCardStatus && receipt.sourceCardStatus !== "none") {
    lines.push(`Source-card status: ${receipt.sourceCardStatus}.`);
    if (receipt.sourceCardExternalId) {
      lines.push(`Source-card ID: ${receipt.sourceCardExternalId}.`);
    }
    if (receipt.sourceCardCoverage) {
      lines.push(`Source-card coverage: ${receipt.sourceCardCoverage}`);
    }
    if (receipt.sourceCardLimitation) {
      lines.push(`Source-card limitation: ${receipt.sourceCardLimitation}`);
    }
    if (receipt.sourceCardMayInformRecall != null) {
      lines.push(
        `Source card may inform candidate recall: ${receipt.sourceCardMayInformRecall ? "yes" : "no"}.`
      );
    }
  }
  if (receipt.materialLimitations || receipt.limitation) {
    lines.push(`Limitation: ${receipt.materialLimitations ?? receipt.limitation}`);
  }
  if (receipt.duplicateOfExternalId) {
    lines.push(`Duplicate of existing source: ${receipt.duplicateOfExternalId}`);
  }
  if (receipt.documentIdentity) {
    lines.push(`Document identity (explicit): ${receipt.documentIdentity}`);
  }
  lines.push(receipt.glassBoxHint);
  return lines.join("\n");
}
