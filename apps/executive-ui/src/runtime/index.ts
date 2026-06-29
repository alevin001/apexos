/**
 * Runtime boundary marker — UI must call services only, never perform pipeline logic.
 * Re-exports traceability pattern from validated Build 09 runtime.
 *
 * Build 11: Executive Conversation Adapter delegates to runtime-invocation-service.
 * The adapter must NOT perform retrieval, inference, or recommendation generation.
 */
export { queryTraceabilityChainForSituation } from "@/services/pipeline-service";
export { invokeRuntimeForSituation } from "@/services/runtime-invocation-service";
export type { TraceabilityChain } from "@/types/executive";

export const RUNTIME_BOUNDARY = {
  uiMayNot: [
    "inference",
    "recommendation generation",
    "context weighting",
    "evidence retrieval",
    "pattern learning",
    "confidence scoring",
    "situation extraction inference beyond adapter classification",
  ],
  uiMust: [
    "read pipeline artifacts from Supabase",
    "display layers separately",
    "capture executive decisions and outcomes",
    "preserve traceability visibility",
    "route executive conversation through adapter to existing runtime",
    "expose Glass Box for every runtime execution",
  ],
  conversationAdapterMay: [
    "accept natural language",
    "classify conversation intent",
    "extract situation package structure",
    "request clarification for missing fields",
    "invoke runtime via runtime-invocation-service",
    "compose conversational responses from runtime results",
  ],
  conversationAdapterMayNot: [
    "perform retrieval",
    "perform inference",
    "generate recommendations",
    "create memory",
    "skip runtime stages",
  ],
} as const;
