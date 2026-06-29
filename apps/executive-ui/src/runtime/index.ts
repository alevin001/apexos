/**
 * Runtime boundary marker — UI must call services only, never perform pipeline logic.
 * Re-exports traceability pattern from validated Build 09 runtime.
 */
export { queryTraceabilityChainForSituation } from "@/services/pipeline-service";
export type { TraceabilityChain } from "@/types/executive";

export const RUNTIME_BOUNDARY = {
  uiMayNot: [
    "inference",
    "recommendation generation",
    "context weighting",
    "evidence retrieval",
    "pattern learning",
    "confidence scoring",
  ],
  uiMust: [
    "read pipeline artifacts from Supabase",
    "display layers separately",
    "capture executive decisions and outcomes",
    "preserve traceability visibility",
  ],
} as const;
