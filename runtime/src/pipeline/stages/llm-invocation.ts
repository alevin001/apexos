import { runtimeConfig } from "../../config.js";
import { LLMProviderError } from "../../shared/errors.js";
import { createLLMProvider } from "../../providers/llm/index.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * LLM Invocation — delegates reasoning to the configured LLM provider.
 * The runtime supplies the Executive Context Package; the LLM performs reasoning.
 */
export async function llmInvocationStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();

  if (!ctx.contextPackage) {
    throw new LLMProviderError("Context package required before LLM invocation", "none");
  }

  const provider = createLLMProvider();

  const response = await provider.complete({
    instructions: ctx.contextPackage.llmInstructions,
    input: ctx.request.message,
    previousResponseId: ctx.request.previousResponseId ?? undefined,
  });

  ctx.llmResponse = response;
  ctx.stages.push({
    stage: "llm-invocation",
    status: "success",
    durationMs: Date.now() - start,
    detail: `${response.provider}/${response.model}${runtimeConfig.dryRun ? " (dry-run)" : ""}`,
  });

  return ctx;
}
