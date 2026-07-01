export class RuntimeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly stage?: string
  ) {
    super(message);
    this.name = "RuntimeError";
  }
}

export class GovernanceValidationError extends RuntimeError {
  constructor(message: string, public readonly violations: string[]) {
    super(message, "GOVERNANCE_VALIDATION_FAILED", "governance-validation");
    this.name = "GovernanceValidationError";
  }
}

export class LLMProviderError extends RuntimeError {
  constructor(message: string, public readonly provider: string) {
    super(message, "LLM_PROVIDER_ERROR", "llm-invocation");
    this.name = "LLMProviderError";
  }
}
