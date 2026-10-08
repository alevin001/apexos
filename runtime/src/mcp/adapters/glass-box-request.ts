/**
 * Build 17 follow-up — natural "Show the Glass Box" detection and resolution.
 * Glass Box-only routing is for standalone view requests. Mixed executive work
 * (situation / reason / recommend / capture) must take execute_runtime even when
 * the message also mentions Glass Box.
 *
 * Standalone Glass Box is always read-only: never create conversation/situation/runtime.
 * ChatGPT may open a fresh MCP session per turn — resolve via session state or the
 * host-bound ApexOS conversationId from the active chat.
 */

import { isMaterialSituation } from "../../pipeline/capture/cold-start-extractor.js";
import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";
import {
  lookupDurableTraceByRuntimeId,
  lookupLatestDurableTraceForConversation,
  type DurableTraceMatch,
} from "./durable-continuity.js";
import { getConversationState } from "./conversation-state.js";
import { getTrace } from "./trace-store.js";
import { buildGlassBox, type GlassBoxSummary } from "./glass-box.js";

export type ExecutiveToolRoute = "glass_box_only" | "execute_runtime";

const GLASS_BOX_VIEW =
  /\b(?:please\s+|pls\s+)?(?:show|open|expand|display|reveal)\b[\s\S]{0,40}\bglass\s*box\b(?:\s+for\s+this(?:\s+response)?)?/i;

const GLASS_BOX_BARE = /^(?:please\s+|pls\s+)?(?:the\s+)?glass\s*box(?:\s+please|\s+pls)?$/i;

const GLASS_BOX_FLUFF =
  /^(?:please|pls|thanks|thank you|now|again|for this(?: response)?|the)(?:\s+(?:please|pls|thanks|thank you|now|again|for this(?: response)?|the))*$/i;

/**
 * Imperatives that mean the executive wants new ApexOS work, not only a view.
 * Names/topics alone (Drew, conflict) must not force execute_runtime when the
 * host wraps a standalone Glass Box request with prior-chat context.
 */
const COMPETING_EXECUTIVE_WORK =
  /\b(?:capture\s+this\s+as\s+a\s+new|new\s+executive\s+situation|help\s+me\s+(?:prepare|decide|reason)|i\s+need\s+to\s+prepare|we\s+need\s+to\s+prepare|what\s+should\s+i\s+say|how\s+(?:do|should|can)\s+i|help\s+me\s+decide|analyze|retrieve\s+(?:prior|saved)|coach\s+me)\b/i;

function hasGlassBoxViewPhrase(m: string): boolean {
  if (GLASS_BOX_BARE.test(m)) return true;
  if (m === "glass box" || m === "show the glass box") return true;
  if (GLASS_BOX_VIEW.test(m)) return true;
  if (/\bglass\s*box\b/.test(m) && /\b(show|open|expand|display|reveal|for this)\b/.test(m)) {
    return true;
  }
  return false;
}

function stripGlassBoxPhrases(message: string): string {
  return message
    .replace(GLASS_BOX_VIEW, " ")
    .replace(/\bglass\s*box\b(?:\s+for\s+this(?:\s+response)?)?/gi, " ")
    .replace(/@apexos\b/gi, " ")
    .replace(/\bapexos\b/gi, " ")
    .replace(/[^\w\s'-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True only for a standalone request to view the Glass Box.
 * Mixed messages that also ask for new executive work return false → execute_runtime.
 */
export function isGlassBoxRequest(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  const m = trimmed.toLowerCase();
  if (!hasGlassBoxViewPhrase(m)) return false;

  const remainder = stripGlassBoxPhrases(trimmed);
  if (!remainder) return true;
  if (GLASS_BOX_FLUFF.test(remainder.toLowerCase())) return true;

  // Competing work imperative (prepare / decide / what should I say / capture new)
  // → full runtime even if Glass Box is also mentioned.
  if (COMPETING_EXECUTIVE_WORK.test(remainder) || COMPETING_EXECUTIVE_WORK.test(trimmed)) {
    return false;
  }
  if (isMaterialSituation(remainder) && COMPETING_EXECUTIVE_WORK.test(trimmed)) {
    return false;
  }

  // Clear Glass Box view phrase without a competing work imperative.
  // Residual prior-turn names/context (Drew, conflict, recommendation…) are
  // common ChatGPT wrappers and must not demote a standalone view request.
  return true;
}

/** Routing helper for tools + tests. */
export function routeExecutiveToolMessage(message: string): ExecutiveToolRoute {
  return isGlassBoxRequest(message) ? "glass_box_only" : "execute_runtime";
}

function asAuditRefs(value: unknown): AuditRecordRef[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is AuditRecordRef =>
      typeof r === "object" &&
      r !== null &&
      typeof (r as AuditRecordRef).table === "string" &&
      typeof (r as AuditRecordRef).id === "string"
  );
}

function asStages(value: unknown): PipelineStageResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is PipelineStageResult =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as PipelineStageResult).stage === "string"
  );
}

export function glassBoxFromDurableTrace(trace: DurableTraceMatch): GlassBoxSummary {
  return buildGlassBox({
    runtimeId: trace.runtimeId,
    conversationId: trace.conversationId,
    contextPackageId:
      typeof trace.metadata.contextPackageId === "string"
        ? trace.metadata.contextPackageId
        : null,
    contextPackage: null,
    recordsCreated: asAuditRefs(trace.recordsCreated),
    recordsRetrieved: asAuditRefs(trace.recordsRetrieved),
    stages: asStages(trace.stages),
  });
}

function glassBoxFromInMemoryTrace(
  runtimeId: string,
  conversationId: string | null,
  inMemory: NonNullable<ReturnType<typeof getTrace>>
): GlassBoxSummary {
  return buildGlassBox({
    runtimeId,
    conversationId:
      conversationId ??
      (typeof inMemory.metadata.conversationId === "string"
        ? inMemory.metadata.conversationId
        : null),
    contextPackageId:
      typeof inMemory.metadata.contextPackageId === "string"
        ? inMemory.metadata.contextPackageId
        : null,
    contextPackage: null,
    recordsCreated: asAuditRefs(inMemory.metadata.recordsCreated),
    recordsRetrieved: asAuditRefs(inMemory.metadata.recordsRetrieved),
    stages: inMemory.stages,
  });
}

async function resolveByRuntimeId(
  runtimeId: string,
  conversationIdFallback: string | null
): Promise<{
  glassBox: GlassBoxSummary;
  runtimeId: string;
  conversationId: string | null;
  source: "session_runtime" | "durable_trace";
} | null> {
  const inMemory = getTrace(runtimeId);
  if (inMemory && inMemory.status === "completed") {
    return {
      glassBox: glassBoxFromInMemoryTrace(runtimeId, conversationIdFallback, inMemory),
      runtimeId: inMemory.runtimeId,
      conversationId:
        conversationIdFallback ??
        (typeof inMemory.metadata.conversationId === "string"
          ? inMemory.metadata.conversationId
          : null),
      source: "session_runtime",
    };
  }
  const durable = await lookupDurableTraceByRuntimeId(runtimeId);
  if (durable) {
    return {
      glassBox: glassBoxFromDurableTrace(durable),
      runtimeId: durable.runtimeId,
      conversationId: durable.conversationId ?? conversationIdFallback,
      source: "durable_trace",
    };
  }
  return null;
}

/**
 * Resolve Glass Box for a natural request using confirmed session/process
 * lastRuntimeId or the host-bound conversation's latest completed trace.
 * Never reconstructs from chat prose. Never creates records.
 * Does not fall back to an unrelated executive-wide "latest" trace.
 */
export async function resolveGlassBoxRequest(opts: {
  sessionKey: string;
  executiveSlug?: string | null;
  runtimeIdHint?: string | null;
  conversationId?: string | null;
}): Promise<{
  glassBox: GlassBoxSummary | null;
  runtimeId: string | null;
  conversationId: string | null;
  source: "session_runtime" | "durable_trace" | "none";
  reason: string | null;
}> {
  const session = getConversationState(opts.sessionKey);
  const boundConversationId =
    session?.conversationId?.trim() || opts.conversationId?.trim() || null;

  const hint = opts.runtimeIdHint?.trim() || session?.lastRuntimeId?.trim() || null;
  if (hint) {
    const byHint = await resolveByRuntimeId(hint, boundConversationId);
    if (byHint) {
      return { ...byHint, reason: null };
    }
  }

  if (boundConversationId) {
    const byConv = await lookupLatestDurableTraceForConversation(boundConversationId);
    if (byConv) {
      return {
        glassBox: glassBoxFromDurableTrace(byConv),
        runtimeId: byConv.runtimeId,
        conversationId: byConv.conversationId ?? boundConversationId,
        source: "durable_trace",
        reason: null,
      };
    }
  }

  // Fail closed — do not invent a Glass Box from another conversation/situation.
  return {
    glassBox: null,
    runtimeId: null,
    conversationId: boundConversationId,
    source: "none",
    reason:
      "No confirmed runtime trace is bound to this chat/session or conversation. Glass Box is read-only and will not create a replacement conversation.",
  };
}
