import { runtimeConfig } from "../../config.js";
import { LLMProviderError } from "../../shared/errors.js";
import type { LLMProvider, LLMRequest, LLMResponse } from "../../types/llm.js";

interface OpenAIResponsesPayload {
  model: string;
  instructions: string;
  input: string;
  previous_response_id?: string;
}

interface OpenAIResponsesResult {
  id: string;
  model: string;
  output_text?: string;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * OpenAI Responses API provider.
 * Uses POST /v1/responses — the unified API for stateful, multi-turn interactions.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model: string, baseUrl = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const payload: OpenAIResponsesPayload = {
      model: this.model,
      instructions: request.instructions,
      input: request.input,
    };

    if (request.previousResponseId) {
      payload.previous_response_id = request.previousResponseId;
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new LLMProviderError(
        `OpenAI API error (${response.status}): ${errorBody}`,
        this.name
      );
    }

    const data = (await response.json()) as OpenAIResponsesResult;
    const text = extractOutputText(data);

    return {
      text,
      responseId: data.id,
      model: data.model,
      provider: this.name,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
          }
        : undefined,
    };
  }
}

function extractOutputText(data: OpenAIResponsesResult): string {
  if (data.output_text) return data.output_text;

  if (data.output) {
    const parts: string[] = [];
    for (const item of data.output) {
      if (item.type === "message" && item.content) {
        for (const block of item.content) {
          if (block.type === "output_text" && block.text) {
            parts.push(block.text);
          }
        }
      }
    }
    if (parts.length) return parts.join("\n");
  }

  return "";
}
