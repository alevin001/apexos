import { RuntimeError } from "../../shared/errors.js";

export type ErrorCategory =
  | "validation"
  | "runtime"
  | "governance"
  | "llm"
  | "trace"
  | "internal";

export interface StructuredMcpError {
  runtimeId: string | null;
  errorCategory: ErrorCategory;
  message: string;
  recoverable: boolean;
}

export function toStructuredError(
  err: unknown,
  runtimeId: string | null = null
): StructuredMcpError {
  if (err instanceof RuntimeError) {
    const category: ErrorCategory =
      err.code === "GOVERNANCE_VALIDATION_FAILED"
        ? "governance"
        : err.code === "LLM_PROVIDER_ERROR"
          ? "llm"
          : "runtime";

    return {
      runtimeId,
      errorCategory: category,
      message: err.message,
      recoverable: category !== "governance",
    };
  }

  if (err instanceof Error) {
    return {
      runtimeId,
      errorCategory: "internal",
      message: err.message,
      recoverable: false,
    };
  }

  return {
    runtimeId,
    errorCategory: "internal",
    message: "An unexpected error occurred",
    recoverable: false,
  };
}

export function formatToolError(structured: StructuredMcpError): string {
  return JSON.stringify(structured, null, 2);
}
