/** Build 18 — governed knowledge ingestion types. */

export type IngestionMethod =
  | "bulk_import"
  | "single_file"
  | "chatgpt_attachment"
  | "chatgpt_text"
  | "operator_cli";

export type AuthorityClassification =
  | "unverified"
  | "executive_material"
  | "architecture"
  | "internal_operating"
  | "external_reference";

export type ExtractionStatus =
  | "pending"
  | "extracted"
  | "deferred"
  | "failed"
  | "unsupported"
  | "skipped";

export type ProcessingStatus =
  | "pending"
  | "registered"
  | "stored"
  | "processed"
  | "failed"
  | "duplicate_skipped";

export type IntegrityStatus = "ok" | "error" | "partial";

export type ItemDisposition =
  | "pending"
  | "would_ingest"
  | "ingested"
  | "duplicate"
  | "failed"
  | "unsupported"
  | "skipped"
  | "deferred_extraction";

export interface SourceInput {
  /** Display / original filename */
  filename: string;
  /** Raw bytes of the original source */
  bytes: Buffer;
  mimeType?: string;
  /** Filesystem or logical location reference */
  sourceLocation?: string;
  sourceOwner?: string;
  sourceType?: string;
  title?: string;
  authorityClassification?: AuthorityClassification;
  scopeClassification?: string;
  tags?: string[];
  ingestionMethod: IngestionMethod;
  /** When replacing/correcting a prior source — prior remains inspectable */
  replacesSourceId?: string;
  /** Optional operator-provided text when binary cannot be transferred */
  providedText?: string;
  /** ChatGPT host file id when applicable */
  hostFileId?: string;
}

export interface ExtractionResult {
  status: ExtractionStatus;
  method: string;
  text?: string;
  limitation?: string;
  mimeType?: string;
}

export interface RetrievalUnitDraft {
  unitIndex: number;
  content: string;
  contentPreview: string;
}

/** Plain-language ingestion receipt for the executive / operator. */
export interface IngestionReceipt {
  ingested: boolean;
  claim: "ingested" | "not_ingested" | "duplicate" | "partial";
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
  glassBoxHint: string;
  sourceExternalId?: string;
  duplicateOfExternalId?: string;
  retrievalUnitCount: number;
  /** Never claim durable KB membership unless storage + source record confirmed */
  durableKnowledgeConfirmed: boolean;
}

export interface BulkImportSummary {
  runExternalId: string;
  dryRun: boolean;
  filesDiscovered: number;
  filesIngested: number;
  filesDuplicate: number;
  filesFailed: number;
  filesPending: number;
  filesSkipped: number;
  items: Array<{
    path: string;
    disposition: ItemDisposition;
    reason?: string;
    receipt?: IngestionReceipt;
  }>;
}

export interface RetrievedKnowledgeUnit {
  id: string;
  externalId: string;
  sourceId: string;
  sourceExternalId: string;
  sourceTitle: string;
  sourceType: string;
  authorityClassification: string;
  extractionStatus: string;
  content: string;
  contentPreview: string;
  whyRetrieved: string;
  transformationNote: string;
  score: number;
  epistemicType: "source_evidence";
}

export interface ChatGptFileRef {
  download_url?: string;
  file_id?: string;
  mime_type?: string;
  file_name?: string;
}
