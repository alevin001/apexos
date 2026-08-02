/**
 * Build 17 — confirmed MCP/session/tool-state continuity, plus ordered resolution
 * that may consult constrained durable fallback (see durable-continuity.ts).
 */

import { lookupDurableActiveConversation } from "./durable-continuity.js";

export type ContinuitySource =
  | "explicit"
  | "session"
  | "durable_fallback"
  | "new"
  | "unavailable";

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
  lastRuntimeId: string | null;
} {
  const explicit = opts.explicitConversationId?.trim();
  if (explicit) {
    return {
      conversationId: explicit,
      continuitySource: "explicit",
      reusedFromSession: false,
      lastRuntimeId: null,
    };
  }

  const state = sessions.get(opts.sessionKey);
  if (state?.conversationId) {
    return {
      conversationId: state.conversationId,
      continuitySource: "session",
      reusedFromSession: true,
      lastRuntimeId: state.lastRuntimeId ?? null,
    };
  }

  return {
    conversationId: undefined,
    continuitySource: "new",
    reusedFromSession: false,
    lastRuntimeId: null,
  };
}

/**
 * Preferred continuity order:
 * 1. explicit conversationId
 * 2. confirmed MCP session / process tool state
 * 3. constrained durable active conversation for the same executive
 * 4. new conversation (no prior continuity confirmed)
 */
export async function resolveContinuity(opts: {
  explicitConversationId?: string | null;
  sessionKey: string;
  executiveSlug?: string | null;
}): Promise<{
  conversationId: string | undefined;
  continuitySource: ContinuitySource;
  lastRuntimeId: string | null;
  disclosure: string | null;
}> {
  const local = resolveConversationId({
    explicitConversationId: opts.explicitConversationId,
    sessionKey: opts.sessionKey,
  });

  if (local.continuitySource === "explicit" || local.continuitySource === "session") {
    return {
      conversationId: local.conversationId,
      continuitySource: local.continuitySource,
      lastRuntimeId: local.lastRuntimeId,
      disclosure: null,
    };
  }

  try {
    const durable = await lookupDurableActiveConversation(opts.executiveSlug);
    if (durable?.conversationId) {
      return {
        conversationId: durable.conversationId,
        continuitySource: "durable_fallback",
        lastRuntimeId: durable.lastRuntimeId,
        disclosure: null,
      };
    }
  } catch {
    // Durable lookup failure must not invent continuity.
  }

  return {
    conversationId: undefined,
    continuitySource: "new",
    lastRuntimeId: null,
    disclosure:
      "No prior ApexOS conversation was confirmed or reused; a new conversation will be created when persistence succeeds.",
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
