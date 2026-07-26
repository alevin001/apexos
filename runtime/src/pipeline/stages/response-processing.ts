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
  const conversationId = ctx.interactionId ?? ctx.request.conversationId;
  const captureFailed = ctx.stages.some(
    (s) => s.stage === "interaction-capture" && s.status === "failed"
  );

  return {
    requestId: ctx.request.requestId,
    response: ctx.llmResponse?.text ?? "",
    responseId: ctx.llmResponse?.responseId,
    situationSlug: ctx.situation?.slug ?? ctx.captureAudit?.situationSlug ?? null,
    // Build 16 handoff fix: return the effective/created conversation UUID.
    conversationId,
    interactionId: ctx.interactionId,
    contextPackageId: ctx.evidence?.assembledContextPackage?.externalId ?? null,
    stages: ctx.stages,
    metadata: {
      model: ctx.llmResponse?.model ?? "none",
      provider: ctx.llmResponse?.provider ?? "none",
      dryRun: runtimeConfig.dryRun || !runtimeConfig.openaiApiKey,
      persistenceStatus: captureFailed ? "failed" : conversationId ? "persisted" : "skipped",
      situationId: ctx.situation?.id ?? ctx.captureAudit?.situationId ?? null,
      recordsCreated: ctx.captureAudit?.created ?? [],
      recordsRetrieved: ctx.retrievalAudit?.retrieved ?? [],
      contextItems: ctx.contextPackage?.contextItemsSupplied ?? [],
      captureErrors: ctx.captureAudit?.errors ?? [],
      retrievalErrors: ctx.retrievalAudit?.errors ?? [],
    },
  };
}
