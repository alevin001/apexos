import type { ValidatedRequest } from "./executive-request.js";
import type {
  ContextRelevanceData,
  ContinuityPackage,
  EvidenceAssembly,
  ExecutiveContextPackage,
  MemoryItem,
  GovernanceConstraints,
} from "./context-package.js";
import type { LLMResponse } from "./llm.js";
import type { ColdStartExtraction } from "../pipeline/capture/cold-start-extractor.js";

/** Mutable state carried through the orchestration pipeline. */
export interface PipelineContext {
  request: ValidatedRequest;
  executive: ExecutiveRecord | null;
  situation: SituationRecord | null;
  memory: MemoryRetrievalResult | null;
  continuity: ContinuityPackage | null;
  contextRelevance: ContextRelevanceData | null;
  evidence: EvidenceAssembly | null;
  governance: GovernanceConstraints | null;
  contextPackage: ExecutiveContextPackage | null;
  llmResponse: LLMResponse | null;
  interactionId: string | null;
  captureAudit: CaptureAudit | null;
  retrievalAudit: RetrievalAudit | null;
  stages: PipelineStageResult[];
}

export interface ExecutiveRecord {
  id: string;
  slug: string;
  displayName: string;
  summary?: string;
}

export interface SituationRecord {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  situationType?: string;
}

export interface MemoryRetrievalResult {
  executive: MemoryItem[];
  person: MemoryItem[];
  relationship: MemoryItem[];
  pattern: MemoryItem[];
  outcomes: MemoryItem[];
  observations: MemoryItem[];
}

export interface AuditRecordRef {
  table: string;
  id: string;
  type?: string;
  externalId?: string;
}

export interface CaptureAudit {
  created: AuditRecordRef[];
  situationId: string | null;
  situationSlug: string | null;
  errors: string[];
  extraction?: ColdStartExtraction;
}

export interface RetrievalAudit {
  retrieved: AuditRecordRef[];
  contextItems: string[];
  errors: string[];
}

export interface PipelineStageResult {
  stage: string;
  status: "success" | "skipped" | "failed";
  durationMs: number;
  detail?: string;
}

/** Final response returned to the interface layer. */
export interface RuntimeResponse {
  requestId: string;
  response: string;
  responseId?: string;
  situationSlug: string | null;
  conversationId: string | null;
  interactionId: string | null;
  contextPackageId: string | null;
  stages: PipelineStageResult[];
  metadata: RuntimeResponseMetadata;
}

export interface RuntimeResponseMetadata {
  model: string;
  provider: string;
  dryRun: boolean;
  persistenceStatus: "persisted" | "failed" | "skipped";
  situationId: string | null;
  recordsCreated: AuditRecordRef[];
  recordsRetrieved: AuditRecordRef[];
  contextItems: string[];
  captureErrors: string[];
  retrievalErrors: string[];
}

export type PipelineStage = (ctx: PipelineContext) => Promise<PipelineContext>;

export const PIPELINE_STAGES = [
  "runtime-entry",
  "continuity-retrieval",
  "memory-retrieval",
  "context-retrieval",
  "evidence-assembly",
  "governance-validation",
  "context-package-construction",
  "llm-invocation",
  "response-processing",
  "interaction-capture",
] as const;

export type PipelineStageName = (typeof PIPELINE_STAGES)[number];
