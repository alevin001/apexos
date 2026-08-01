/**
 * Build 17 — confirmed MCP/session/tool-state continuity only.
 * Never invents continuity across unconfirmed boundaries.
 */

export type ContinuitySource = "explicit" | "session" | "new" | "unavailable";

export interface ConversationSessionState {
  conversationId: string;
  lastRuntimeId: string;
  updatedAt: string;
}

/** Process-scoped key for stdio transports that do not expose mcp-session-id. */
export const STDIO_SESSION_KEY = "stdio:process";

const sessions = new Map<string, ConversationSessionState>();

/**
 * Resolve a continuity key from actual MCP session state when present.
 * Falls back to process-scoped stdio tool state for long-lived local connectors.
 */
export function resolveSessionKey(sessionId?: string | null): string {
  if (sessionId && sessionId.trim()) {
    return `mcp:${sessionId.trim()}`;
  }
  return STDIO_SESSION_KEY;
}

export function resolveConversationId(opts: {
  explicitConversationId?: string | null;
  sessionKey: string;
}): {
  conversationId: string | undefined;
  continuitySource: ContinuitySource;
  reusedFromSession: boolean;
} {
  const explicit = opts.explicitConversationId?.trim();
  if (explicit) {
    return {
      conversationId: explicit,
      continuitySource: "explicit",
      reusedFromSession: false,
    };
  }

  const state = sessions.get(opts.sessionKey);
  if (state?.conversationId) {
    return {
      conversationId: state.conversationId,
      continuitySource: "session",
      reusedFromSession: true,
    };
  }

  return {
    conversationId: undefined,
    continuitySource: "new",
    reusedFromSession: false,
  };
}

/** Remember conversation only after a successful runtime handoff with a real UUID. */
export function rememberConversation(
  sessionKey: string,
  conversationId: string,
  runtimeId: string
): void {
  if (!sessionKey || !conversationId) return;
  sessions.set(sessionKey, {
    conversationId,
    lastRuntimeId: runtimeId,
    updatedAt: new Date().toISOString(),
  });
}

export function getConversationState(
  sessionKey: string
): ConversationSessionState | undefined {
  return sessions.get(sessionKey);
}

export function clearConversationStateForTests(): void {
  sessions.clear();
}
