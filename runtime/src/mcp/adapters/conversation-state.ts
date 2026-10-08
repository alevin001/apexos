/**
 * Build 17 — confirmed MCP/session/tool-state continuity.
 * Active situation/conversation reuse is session-scoped (or explicit continue).
 * Cross-chat durable reuse must not become the active situation.
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

/** Executive asked to start a fresh situation (ignore prior conversation binding). */
export function isNewSituationRequest(message: string | null | undefined): boolean {
  const m = (message ?? "").trim().toLowerCase();
  if (!m) return false;
  return (
    /\bcapture\s+this\s+as\s+a\s+new\b/i.test(m) ||
    /\bnew\s+executive\s+situation\b/i.test(m) ||
    /\b(?:start|create|begin|open)\s+(?:a\s+)?new\s+situation\b/i.test(m) ||
    /\bfresh\s+(?:executive\s+)?situation\b/i.test(m) ||
    /\bnew\s+apexos\s+(?:conversation|situation|chat)\b/i.test(m) ||
    /\bdo\s+not\s+(?:reuse|continue)\s+(?:the\s+)?(?:prior|previous|old)\b/i.test(m)
  );
}

/** Executive explicitly asked to continue a prior ApexOS situation/conversation. */
export function isContinueSituationRequest(message: string | null | undefined): boolean {
  const m = (message ?? "").trim().toLowerCase();
  if (!m) return false;
  if (isNewSituationRequest(m)) return false;
  return (
    /\bcontinue\s+(?:the\s+)?(?:prior|previous|same|that|this)\s+(?:situation|conversation|thread|work)\b/i.test(
      m
    ) ||
    /\bpick\s+up\s+(?:where|the\s+prior)\b/i.test(m) ||
    /\bresume\s+(?:the\s+)?(?:prior|previous|same)\b/i.test(m) ||
    /\bsame\s+situation\s+as\s+before\b/i.test(m)
  );
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
 * Preferred continuity order (fresh-chat isolation):
 * 1. Explicit new-situation request → always new (ignore host conversationId / durable)
 * 2. Confirmed MCP session / process tool state
 * 3. Host-replayed conversationId (ChatGPT often uses a fresh MCP session per turn)
 * 4. Explicit continue without host ID → constrained durable active conversation
 * 5. Otherwise new (prior durable may still be retrieved as evidence — not as active situation)
 */
export async function resolveContinuity(opts: {
  explicitConversationId?: string | null;
  sessionKey: string;
  executiveSlug?: string | null;
  message?: string | null;
}): Promise<{
  conversationId: string | undefined;
  continuitySource: ContinuitySource;
  lastRuntimeId: string | null;
  disclosure: string | null;
  forceNewSituation: boolean;
}> {
  const wantsNew = isNewSituationRequest(opts.message);
  const wantsContinue = isContinueSituationRequest(opts.message);
  const session = sessions.get(opts.sessionKey);
  const explicit = opts.explicitConversationId?.trim() || undefined;

  if (wantsNew) {
    return {
      conversationId: undefined,
      continuitySource: "new",
      lastRuntimeId: null,
      forceNewSituation: true,
      disclosure:
        "New executive situation requested — prior ApexOS conversation/situation will not be reused as the active context.",
    };
  }

  // Same MCP session may continue its bound conversation.
  if (session?.conversationId) {
    // If host also sent an ID, prefer the session-bound one unless it matches.
    if (explicit && explicit !== session.conversationId) {
      // Stale host ID from another chat — keep session isolation.
      return {
        conversationId: session.conversationId,
        continuitySource: "session",
        lastRuntimeId: session.lastRuntimeId ?? null,
        forceNewSituation: false,
        disclosure: null,
      };
    }
    return {
      conversationId: session.conversationId,
      continuitySource: "session",
      lastRuntimeId: session.lastRuntimeId ?? null,
      forceNewSituation: false,
      disclosure: null,
    };
  }

  // ChatGPT often opens a fresh MCP session per tools/call but replays the
  // ApexOS conversationId from prior tool results in the same chat. Honor it
  // unless an explicit new-situation request already forced a clean start above.
  if (explicit) {
    return {
      conversationId: explicit,
      continuitySource: "explicit",
      lastRuntimeId: null,
      forceNewSituation: false,
      disclosure: null,
    };
  }

  // Explicit continue without a host ID → constrained durable lookup.
  if (wantsContinue) {
    try {
      const durable = await lookupDurableActiveConversation(opts.executiveSlug);
      if (durable?.conversationId) {
        return {
          conversationId: durable.conversationId,
          continuitySource: "durable_fallback",
          lastRuntimeId: durable.lastRuntimeId,
          forceNewSituation: false,
          disclosure:
            "Continuing the most recent active ApexOS conversation because you asked to resume prior work.",
        };
      }
    } catch {
      // Durable lookup failure must not invent continuity.
    }
  }

  // Do not auto-bind durable_fallback or trust a host-replayed conversationId
  // from another chat when this MCP session has no prior state.
  return {
    conversationId: undefined,
    continuitySource: "new",
    lastRuntimeId: null,
    forceNewSituation: false,
    disclosure:
      "No prior ApexOS conversation was confirmed for this chat/session; a new conversation will be created when persistence succeeds.",
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

/** Drop session binding (used when forcing a new situation mid-process). */
export function clearSessionConversation(sessionKey: string): void {
  sessions.delete(sessionKey);
}

export function getConversationState(
  sessionKey: string
): ConversationSessionState | undefined {
  return sessions.get(sessionKey);
}

export function clearConversationStateForTests(): void {
  sessions.clear();
}
