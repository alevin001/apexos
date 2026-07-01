import { runtimeConfig } from "../../config.js";
import type { LLMProvider } from "../../types/llm.js";
import { OpenAIProvider } from "./openai-provider.js";
import { StubLLMProvider } from "./stub-provider.js";

export function createLLMProvider(): LLMProvider {
  if (runtimeConfig.dryRun || !runtimeConfig.openaiApiKey) {
    return new StubLLMProvider();
  }

  switch (runtimeConfig.llmProvider) {
    case "openai":
      return new OpenAIProvider(runtimeConfig.openaiApiKey, runtimeConfig.openaiModel);
    default:
      return new StubLLMProvider();
  }
}

export { OpenAIProvider } from "./openai-provider.js";
export { StubLLMProvider } from "./stub-provider.js";
