import type { LLMProvider, LLMRequest, LLMResponse } from "../../types/llm.js";

/**
 * Stub provider for local development and testing without an API key.
 * Returns a structured summary of the context package instead of calling an LLM.
 */
export class StubLLMProvider implements LLMProvider {
  readonly name = "stub";

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const instructionPreview = request.instructions.slice(0, 200);
    return {
      text: [
        "[ApexOS Runtime — Dry Run Mode]",
        "",
        "The runtime assembled your Executive Context Package and would invoke the LLM here.",
        "",
        `Executive input: ${request.input}`,
        "",
        "Context package preview:",
        instructionPreview + "...",
        "",
        "Configure OPENAI_API_KEY and set APEXOS_RUNTIME_DRY_RUN=false to enable live LLM responses.",
      ].join("\n"),
      responseId: `stub-${Date.now()}`,
      model: "stub",
      provider: "stub",
    };
  }
}
