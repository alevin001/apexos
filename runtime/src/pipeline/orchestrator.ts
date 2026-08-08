import type { ExecutiveRequest } from "../types/executive-request.js";
import type { PipelineContext, RuntimeResponse } from "../types/pipeline.js";
import { RuntimeError } from "../shared/errors.js";
import { runtimeEntry } from "./stages/runtime-entry.js";
import { runtimeEntryStage } from "./stages/runtime-entry.js";
import { continuityRetrievalStage } from "./stages/continuity-retrieval.js";
import { knowledgeRetrievalStage } from "./stages/knowledge-retrieval.js";
import { memoryRetrievalStage } from "./stages/memory-retrieval.js";
import { contextRetrievalStage } from "./stages/context-retrieval.js";
import { evidenceAssemblyStage } from "./stages/evidence-assembly.js";
import { governanceValidationStage } from "./stages/governance-validation.js";
import { contextPackageBuilderStage } from "./stages/context-package-builder.js";
import { llmInvocationStage } from "./stages/llm-invocation.js";
import {
  responseProcessingStage,
  buildRuntimeResponse,
} from "./stages/response-processing.js";
import { interactionCaptureStage } from "./stages/interaction-capture.js";

const STAGES = [
  runtimeEntryStage,
  continuityRetrievalStage,
  knowledgeRetrievalStage,
  memoryRetrievalStage,
  contextRetrievalStage,
  evidenceAssemblyStage,
  governanceValidationStage,
  contextPackageBuilderStage,
  llmInvocationStage,
  responseProcessingStage,
  interactionCaptureStage,
] as const;

function emptyContext(validated: Awaited<ReturnType<typeof runtimeEntry>>): PipelineContext {
  return {
    request: validated,
    executive: null,
    situation: null,
    memory: null,
    continuity: null,
    contextRelevance: null,
    evidence: null,
    governance: null,
    contextPackage: null,
    llmResponse: null,
    interactionId: null,
    captureAudit: null,
    retrievalAudit: null,
    stages: [],
  };
}

/**
 * Orchestrator — executes the runtime pipeline for an executive request.
 * Coordinates stages; does not perform executive reasoning.
 */
export async function executePipeline(request: ExecutiveRequest): Promise<RuntimeResponse> {
  const validated = await runtimeEntry(request);
  const ctx = emptyContext(validated);

  try {
    for (const stage of STAGES) {
      await stage(ctx);
    }
    return buildRuntimeResponse(ctx);
  } catch (err) {
    if (err instanceof RuntimeError) {
      ctx.stages.push({
        stage: err.stage ?? "unknown",
        status: "failed",
        durationMs: 0,
        detail: err.message,
      });
      throw err;
    }
    throw new RuntimeError(
      err instanceof Error ? err.message : "Pipeline execution failed",
      "PIPELINE_ERROR"
    );
  }
}

/** Execute pipeline through context package construction only (no LLM call). */
export async function executePipelineDry(request: ExecutiveRequest): Promise<PipelineContext> {
  const validated = await runtimeEntry(request);
  const ctx = emptyContext(validated);

  const dryStages = STAGES.slice(0, 7);
  for (const stage of dryStages) {
    await stage(ctx);
  }
  return ctx;
}
