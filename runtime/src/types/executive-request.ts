/** Incoming executive interaction from ChatGPT or other interface adapters. */
export interface ExecutiveRequest {
  message: string;
  executiveSlug?: string;
  situationSlug?: string;
  conversationId?: string;
  previousResponseId?: string;
  metadata?: Record<string, unknown>;
}

/** Validated and normalized request after runtime entry. */
export interface ValidatedRequest {
  requestId: string;
  message: string;
  executiveSlug: string;
  situationSlug: string | null;
  conversationId: string | null;
  previousResponseId: string | null;
  receivedAt: string;
  metadata: Record<string, unknown>;
}
