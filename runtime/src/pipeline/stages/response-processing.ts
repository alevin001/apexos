import type { PipelineContext, RuntimeResponse } from "../../types/pipeline.js";
import { runtimeConfig } from "../../config.js";

/**
 * Response Processing — normalizes LLM output into a RuntimeResponse.
 * Does not modify or reason over the LLM response content.
 */
export async function responseProcessingStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();

  if (!ctx.llmResponse) {
    ctx.stages.push({
      stage: "response-processing",
      status: "failed",
      durationMs: Date.now() - start,
      detail: "No LLM response to process",
    });
    return ctx;
  }

  ctx.stages.push({
    stage: "response-processing",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Response: ${ctx.llmResponse.text.length} chars`,
  });

  return ctx;
}

export function buildRuntimeResponse(ctx: PipelineContext): RuntimeResponse {
  return {
    requestId: ctx.request.requestId,
    response: ctx.llmResponse?.text ?? "",
    responseId: ctx.llmResponse?.responseId,
    situationSlug: ctx.situation?.slug ?? null,
    conversationId: ctx.request.conversationId,
    interactionId: ctx.interactionId,
    contextPackageId: ctx.evidence?.assembledContextPackage?.externalId ?? null,
    stages: ctx.stages,
  metadata: {
    model: ctx.llmResponse?.model ?? "none",
    provider: ctx.llmResponse?.provider ?? "none",
    dryRun: runtimeConfig.dryRun || !runtimeConfig.openaiApiKey,
  },
  };
}
