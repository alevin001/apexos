import type {
  AuthorityClassification,
  ExtractionStatus,
  IngestionReceipt,
  IntegrityStatus,
  ProcessingStatus,
} from "./types.js";

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
}): IngestionReceipt {
  // Durable knowledge requires a persisted source record plus either original
  // storage or confirmed extracted text. Never claim a *file* was stored when
  // only text was captured — originalStored remains the file-specific signal.
  const durableKnowledgeConfirmed =
    input.ingested &&
    Boolean(input.sourceExternalId) &&
    (input.originalStored || input.textExtracted) &&
    (input.processingStatus === "processed" ||
      input.processingStatus === "stored" ||
      input.processingStatus === "registered");

  const glassBoxHint = durableKnowledgeConfirmed
    ? `Say “Show the Glass Box” after asking about this source to inspect authority, retrieval reason, and excerpts. Source: ${input.title}.`
    : "This material is not confirmed in the durable ApexOS knowledge base. Ask ApexOS to ingest it explicitly, then inspect via the Glass Box.";

  return {
    ...input,
    durableKnowledgeConfirmed,
    glassBoxHint,
  };
}

/** Executive-facing plain-language receipt. */
export function formatReceiptPlainLanguage(receipt: IngestionReceipt): string {
  const lines: string[] = [];
  if (receipt.claim === "ingested" && receipt.durableKnowledgeConfirmed) {
    lines.push(`ApexOS ingested “${receipt.title}” into the durable knowledge base.`);
  } else if (receipt.claim === "duplicate") {
    lines.push(
      `“${receipt.title}” matches an existing ApexOS source (duplicate detected). The prior original was preserved — nothing was overwritten.`
    );
  } else if (receipt.claim === "partial") {
    lines.push(`ApexOS partially processed “${receipt.title}”.`);
  } else {
    lines.push(`ApexOS did not confirm durable ingestion of “${receipt.title}”.`);
  }

  lines.push(
    `Original stored: ${receipt.originalStored ? "yes" : "no"}.`,
    `Text extracted: ${receipt.textExtracted ? "yes" : "no"}.`,
    `Ready for retrieval: ${receipt.retrievalReady ? "yes" : "no"}.`,
    `Authority status: ${receipt.authorityClassification} (upload/ingest does not make contents true).`,
    `Extraction status: ${receipt.extractionStatus}.`,
    `Processing status: ${receipt.processingStatus}.`
  );

  if (receipt.limitation) {
    lines.push(`Limitation: ${receipt.limitation}`);
  }
  if (receipt.duplicateOfExternalId) {
    lines.push(`Duplicate of existing source: ${receipt.duplicateOfExternalId}`);
  }
  lines.push(receipt.glassBoxHint);
  return lines.join("\n");
}
