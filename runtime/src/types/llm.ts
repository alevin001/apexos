/** Provider-agnostic LLM request. */
export interface LLMRequest {
  instructions: string;
  input: string;
  previousResponseId?: string;
}

/** Provider-agnostic LLM response. */
export interface LLMResponse {
  text: string;
  responseId?: string;
  model: string;
  provider: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/** LLM provider abstraction — decouples runtime from any single foundation model. */
export interface LLMProvider {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}
