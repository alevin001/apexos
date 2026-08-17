/** Build 18/19 — governed knowledge ingestion types. */

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

/** Glass Box default when no governed authority assignment exists. */
export const DEFAULT_AUTHORITY_DISPLAY =
  "evidence/reference—authority unasserted" as const;

export type ExtractionStatus =
  | "pending"
  | "extracted"
  | "deferred"
  | "failed"
  | "unsupported"
  | "skipped"
  | "blocked_encrypted"
  | "blocked_corrupt"
  | "preserve_only";

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
  | "deferred_extraction"
  | "preserve_only"
  | "blocked_changed"
  | "deferred_mailbox"
  | "excluded";

/** Build 19 — independently visible status dimensions */
export type InventoryStatus =
  | "discovered"
  | "classified"
  | "manifested"
  | "executed"
  | "skipped";

export type OriginalStorageStatus =
  | "pending"
  | "stored"
  | "failed"
  | "not_applicable";

export type DurableSourceRecordStatus = "pending" | "persisted" | "failed" | "not_created";

export type RetrievalUnitStatus = "none" | "created" | "failed";

export type RetrievalReadiness = "ready" | "not_ready" | "partial";

/**
 * Handling path classification — why a file takes a given route.
 * Legacy .doc/.xls are preserve_only_legacy_office unless separately proven.
 */
export type HandlingPath =
  | "extractable_native"
  | "deferred_extraction"
  | "preserve_only"
  | "preserve_only_legacy_office"
  | "preserve_only_encrypted"
  | "preserve_only_corrupt"
  | "preserve_only_unsupported"
  | "email_message"
  | "email_attachment_child"
  | "deferred_mailbox_container"
  | "vision_assisted"
  | "excluded_system_sidecar";

/**
 * Derived representation kinds. Source cards are catalog representations —
 * never source_evidence and never citable as sole evidence.
 */
export type RepresentationKind =
  | "native_text"
  | "deterministic_parser"
  | "vision_transcription"
  | "vision_visual_description"
  | "email_headers"
  | "email_plain_text"
  | "email_html"
  | "email_html_derived_text"
  | "email_quoted"
  | "email_attachment_manifest"
  | "source_card"
  | "provided_text";

export type EpistemicType = "source_evidence" | "derived_catalog";

export interface SourceLocator {
  kind:
    | "pdf_page"
    | "pdf_page_range"
    | "docx_block"
    | "docx_table"
    | "docx_cell"
    | "xlsx_range"
    | "pptx_slide"
    | "pptx_notes"
    | "pptx_table"
    | "pptx_cell"
    | "email_section"
    | "email_headers"
    | "email_attachment"
    | "image"
    | "text_offset";
  label: string;
  page?: number;
  pageEnd?: number;
  sheet?: string;
  range?: string;
  section?: string;
  /** MIME part path for email bodies/attachments when available */
  partPath?: string;
  blockIndex?: number;
  tableIndex?: number;
  slide?: number;
  rowIndex?: number;
  cellIndex?: number;
  /** Formula text when distinct from displayed/cached value (XLSX) */
  formula?: string;
  /** Cached/displayed value when distinct from formula */
  cachedValue?: string;
  sheetHidden?: boolean;
}

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
  /**
   * Explicit prior source UUID when operator-confirmed replacement.
   * Never inferred from filename or path.
   */
  replacesSourceId?: string;
  /**
   * Explicit stable document identity for version linking.
   * Never inferred from filename or path.
   */
  documentIdentity?: string;
  /** Optional operator-provided text when binary cannot be transferred */
  providedText?: string;
  /** ChatGPT host file id when applicable */
  hostFileId?: string;
  /** Pre-classified handling path from import workflow */
  handlingPath?: HandlingPath;
  /** When set, this ingest is an email attachment child of the given parent source UUID */
  parentEmailSourceId?: string;
  parentEmailExternalId?: string;
  attachmentMeta?: {
    ordinal: number;
    mimePartPath?: string;
    contentId?: string;
    inline?: boolean;
    displayedFilename?: string;
  };
  /** Prevent nested email attachment expansion (attachment children of children) */
  skipAttachmentExpansion?: boolean;
}

export interface PageCoverageEntry {
  page: number;
  status:
    | "native"
    | "vision_derived"
    | "both_separate"
    | "unavailable"
    | "partial"
    | "blocked";
  methods: Array<"native" | "vision_transcription" | "vision_visual_description">;
  nativeCharCount?: number;
  visionCharCount?: number;
  limitation?: string;
}

export interface ExtractionCoverage {
  pagesExtracted?: number;
  pagesTotal?: number;
  sheetsExtracted?: number;
  sheetsTotal?: number;
  slidesExtracted?: number;
  slidesTotal?: number;
  blocksExtracted?: number;
  note?: string;
  pageCoverage?: PageCoverageEntry[];
}

/** Multi-derivative extraction drafts (native + vision, etc.) for lineage-preserving ingest */
export interface DerivedExtractionDraft {
  representationKind: RepresentationKind;
  method: string;
  processVersion: string;
  providerName?: string;
  providerModel?: string;
  promptVersion?: string;
  text: string;
  units: RetrievalUnitDraft[];
  createRetrievalUnits: boolean;
  limitation?: string;
  coverage?: ExtractionCoverage;
  attemptVersion: number;
  responseId?: string;
}

/** Attachment bytes extracted from a parent email — ingested as child sources. */
export interface AttachmentDraft {
  ordinal: number;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  contentId?: string;
  inline?: boolean;
  mimePartPath?: string;
  limitation?: string;
}

export interface EmailMetadata {
  format: "eml" | "msg";
  subject?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  /** Only when present in source — never invented */
  bcc?: string[];
  date?: string;
  messageId?: string;
  headersSummary?: string;
  hasHtml?: boolean;
  hasPlain?: boolean;
  quoteBoundaryHeuristic?: boolean;
  externalUrlsNoted?: string[];
  unavailableFields?: string[];
}

export interface AttachmentCoverageSummary {
  total: number;
  confirmed: number;
  blocked: number;
  deferred: number;
  duplicateLinked: number;
  summary: string;
}

export interface ExtractionResult {
  status: ExtractionStatus;
  method: string;
  text?: string;
  limitation?: string;
  mimeType?: string;
  representationKind?: RepresentationKind;
  processVersion?: string;
  locators?: SourceLocator[];
  /** Locator-aware retrieval units — preferred over chunking plain text */
  units?: RetrievalUnitDraft[];
  coverage?: ExtractionCoverage;
  pageCoverage?: PageCoverageEntry[];
  /** True when every page has confirmed native and/or vision coverage (not partial/blocked) */
  pageCoverageComplete?: boolean;
  /** When present, ingest persists each derivative separately (no silent overwrite) */
  derivatives?: DerivedExtractionDraft[];
  visionInvoked?: boolean;
  providerName?: string;
  providerModel?: string;
  /** Email parent attachments for child-source lineage */
  attachments?: AttachmentDraft[];
  emailMetadata?: EmailMetadata;
}

export interface RetrievalUnitDraft {
  unitIndex: number;
  content: string;
  contentPreview: string;
  locator?: SourceLocator;
}

/** Neutral source card — derived catalog representation, not evidence. */
export interface SourceCardDraft {
  description: string;
  apparentPurpose: string;
  documentType: string;
  materialLimitations: string;
  processVersion: string;
  providerModel?: string;
  linkedExtractionExternalId: string;
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
  /** Executive-readable authority; defaults to unasserted evidence/reference. */
  authorityDisplay: string;
  extractionStatus: ExtractionStatus;
  processingStatus: ProcessingStatus;
  integrityStatus: IntegrityStatus;
  limitation?: string;
  glassBoxHint: string;
  sourceExternalId?: string;
  duplicateOfExternalId?: string;
  retrievalUnitCount: number;
  /**
   * True only when private original is stored AND durable source record persisted.
   * Extraction alone can never satisfy this.
   */
  durableKnowledgeConfirmed: boolean;
  /** Build 19 independent status dimensions */
  inventoryStatus: InventoryStatus;
  originalStorageStatus: OriginalStorageStatus;
  durableSourceRecordStatus: DurableSourceRecordStatus;
  retrievalUnitStatus: RetrievalUnitStatus;
  retrievalReadiness: RetrievalReadiness;
  handlingPath?: HandlingPath;
  materialLimitations?: string;
  documentIdentity?: string;
  attachmentCoverage?: AttachmentCoverageSummary;
  /** Parent email external ids (canonical junction) when this receipt is for an attachment child */
  parentEmailExternalIds?: string[];
  pageCoverageComplete?: boolean;
  /** Independent source-card status — does not affect retrievalReady */
  sourceCardStatus?: SourceCardStatus;
  sourceCardExternalId?: string;
  sourceCardCoverage?: string;
  sourceCardLimitation?: string;
  sourceCardMayInformRecall?: boolean;
  /** live | test_mock | disabled — recorded to prevent unmarked mock artifacts */
  providerMode?: ProviderModeLabel;
}

export type SourceCardStatus =
  | "generated"
  | "generated_partial"
  | "withheld"
  | "unavailable"
  | "failed"
  | "none";

export interface BulkImportSummary {
  runExternalId: string;
  dryRun: boolean;
  filesDiscovered: number;
  filesIngested: number;
  filesDuplicate: number;
  filesFailed: number;
  filesPending: number;
  filesSkipped: number;
  /** True when dry-run made zero ApexOS writes */
  zeroWrites?: boolean;
  blockedChanged?: number;
  batchReceipt?: BatchImportReceipt;
  providerMode?: ProviderModeLabel;
  items: Array<{
    path: string;
    disposition: ItemDisposition;
    reason?: string;
    receipt?: IngestionReceipt;
    contentHash?: string;
    handlingPath?: HandlingPath;
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
  authorityDisplay: string;
  extractionStatus: string;
  content: string;
  contentPreview: string;
  whyRetrieved: string;
  transformationNote: string;
  score: number;
  epistemicType: "source_evidence";
  locator?: SourceLocator;
  extractionMethod?: string;
  materialLimitation?: string;
  /** True when a source card helped surface the document — never the citation itself */
  sourceCardInformed?: boolean;
  sourceCardId?: string;
  sourceCardRole?: "candidate recall only";
  sourceCardWhyNominated?: string;
  /**
   * Parent email external ids from canonical knowledge_source_attachment_links.
   * A hash-deduplicated child may have multiple parents.
   */
  parentEmailExternalIds?: string[];
}

export interface ChatGptFileRef {
  download_url?: string;
  file_id?: string;
  mime_type?: string;
  file_name?: string;
}

/** Build 19 reconciled import manifest item */
export interface ImportManifestItem {
  relativePath: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  contentHash: string;
  handlingPath: HandlingPath;
  classificationReason: string;
  duplicateStatus: "new" | "duplicate_of_existing" | "changed_from_manifest";
  expectedLimitation?: string;
  documentIdentity?: string;
  /** Explicit operator-confirmed replaces mapping only */
  replacesSourceId?: string;
  /** Checkpoint G preflight expectations (operational provenance only) */
  expectedExtractionMethod?: string;
  expectedProviderUse?: "none" | "vision" | "source_card" | "vision_and_source_card";
  expectedSourceCardEligibility?: "eligible" | "ineligible" | "n/a";
  expectedTerminalStatus?: string;
  exclusionRule?: string;
  itemKind?:
    | "top_level"
    | "duplicate_occurrence"
    | "excluded"
    | "attachment_child_planned"
    | "path_rejected";
}

export interface ImportManifest {
  schemaVersion: "build19-manifest-1.0";
  reconciled: boolean;
  createdAt: string;
  rootPath: string;
  items: ImportManifestItem[];
  notes?: string[];
  /** Checkpoint G operational counts — never retrieval-eligible evidence */
  preflightSummary?: PreflightManifestSummary;
  providerMode?: ProviderModeLabel;
}

export type ProviderModeLabel = "live" | "test_mock" | "disabled";

export interface PreflightManifestSummary {
  topLevelDiscovered: number;
  uniqueDurableSourcesPlanned: number;
  duplicateIntakeOccurrences: number;
  attachmentChildrenPlanned: number;
  attachmentLinksPlanned: number;
  excludedVisible: number;
  pathRejected: number;
}

/** Batch execute receipt — operational provenance only */
export interface BatchImportReceipt {
  runExternalId: string;
  providerMode: ProviderModeLabel;
  discoveredItems: number;
  uniqueDurableSources: number;
  duplicateOccurrences: number;
  attachmentChildSources: number;
  attachmentLinks: number;
  retrievalReadySources: number;
  preserveOnlyOrDeferredSources: number;
  blockedSources: number;
  sourceCardsGenerated: number;
  sourceCardsWithheld: number;
  sourceCardsFailed: number;
  sourceCardsUnavailable: number;
  incompleteOrRetryableItems: number;
  liveProviderCalls: number;
  testMockProviderCalls: number;
  visionProviderCalls: number;
  sourceCardProviderCalls: number;
  zeroProtectedWrites?: boolean;
  dryRun?: boolean;
}
