/**
 * Build 17 follow-up — natural "Show the Glass Box" detection and resolution.
 * Glass Box-only routing is for standalone view requests. Mixed executive work
 * (situation / reason / recommend / capture) must take execute_runtime even when
 * the message also mentions Glass Box.
 */

import { isMaterialSituation } from "../../pipeline/capture/cold-start-extractor.js";
import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";
import {
  lookupDurableTraceByRuntimeId,
  lookupLatestDurableTraceForExecutive,
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

/** Signals that the executive wants ApexOS to do substantive work, not only view. */
const EXECUTIVE_WORK =
  /\b(help me|i need|we need|prepare|meeting|leadership|conflict|decide|decision|recommend|suggest|capture|reason|retrieve|analyze|what should|how (?:do|should|can) i|drew|jesse|team|execution|align(?:ment)?|conversation|situation|coach|develop|trade-?off|option|outcome|next step|follow-?up)\b/i;

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
    .replace(/[^\w\s'-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSubstantiveExecutiveWork(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (isMaterialSituation(t)) return true;
  if (EXECUTIVE_WORK.test(t)) return true;
  // Any non-fluff remainder beyond a short courtesy phrase is treated as work.
  if (t.length >= 40) return true;
  return false;
}

/**
 * True only for a standalone request to view the Glass Box.
 * Mixed messages that also ask for executive work return false → execute_runtime.
 */
export function isGlassBoxRequest(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  const m = trimmed.toLowerCase();
  if (!hasGlassBoxViewPhrase(m)) return false;

  const remainder = stripGlassBoxPhrases(trimmed);
  if (!remainder) return true;
  if (GLASS_BOX_FLUFF.test(remainder.toLowerCase())) return true;

  // Executive situation / capture / reason / recommend → full runtime.
  if (hasSubstantiveExecutiveWork(remainder) || hasSubstantiveExecutiveWork(trimmed)) {
    return false;
  }

  // Prefer execute_runtime when anything non-fluff remains (fail toward work).
  return false;
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

/**
 * Resolve Glass Box for a natural request using confirmed session/process
 * lastRuntimeId, then durable completed traces — never chat prose.
 */
export async function resolveGlassBoxRequest(opts: {
  sessionKey: string;
  executiveSlug?: string | null;
  runtimeIdHint?: string | null;
}): Promise<{
  glassBox: GlassBoxSummary | null;
  runtimeId: string | null;
  conversationId: string | null;
  source: "session_runtime" | "durable_trace" | "none";
  reason: string | null;
}> {
  const hint = opts.runtimeIdHint?.trim();
  if (hint) {
    const inMemory = getTrace(hint);
    if (inMemory && inMemory.status === "completed") {
      const glassBox = buildGlassBox({
        runtimeId: inMemory.runtimeId,
        conversationId:
          typeof inMemory.metadata.conversationId === "string"
            ? inMemory.metadata.conversationId
            : null,
        contextPackageId:
          typeof inMemory.metadata.contextPackageId === "string"
            ? inMemory.metadata.contextPackageId
            : null,
        contextPackage: null,
        recordsCreated: asAuditRefs(inMemory.metadata.recordsCreated),
        recordsRetrieved: asAuditRefs(inMemory.metadata.recordsRetrieved),
        stages: inMemory.stages,
      });
      return {
        glassBox,
        runtimeId: inMemory.runtimeId,
        conversationId:
          typeof inMemory.metadata.conversationId === "string"
            ? inMemory.metadata.conversationId
            : null,
        source: "session_runtime",
        reason: null,
      };
    }
    const durable = await lookupDurableTraceByRuntimeId(hint);
    if (durable) {
      return {
        glassBox: glassBoxFromDurableTrace(durable),
        runtimeId: durable.runtimeId,
        conversationId: durable.conversationId,
        source: "durable_trace",
        reason: null,
      };
    }
  }

  const session = getConversationState(opts.sessionKey);
  if (session?.lastRuntimeId) {
    const inMemory = getTrace(session.lastRuntimeId);
    if (inMemory && inMemory.status === "completed") {
      const glassBox = buildGlassBox({
        runtimeId: inMemory.runtimeId,
        conversationId: session.conversationId,
        contextPackageId:
          typeof inMemory.metadata.contextPackageId === "string"
            ? inMemory.metadata.contextPackageId
            : null,
        contextPackage: null,
        recordsCreated: asAuditRefs(inMemory.metadata.recordsCreated),
        recordsRetrieved: asAuditRefs(inMemory.metadata.recordsRetrieved),
        stages: inMemory.stages,
      });
      return {
        glassBox,
        runtimeId: inMemory.runtimeId,
        conversationId: session.conversationId,
        source: "session_runtime",
        reason: null,
      };
    }
    const durableBySession = await lookupDurableTraceByRuntimeId(session.lastRuntimeId);
    if (durableBySession) {
      return {
        glassBox: glassBoxFromDurableTrace(durableBySession),
        runtimeId: durableBySession.runtimeId,
        conversationId: durableBySession.conversationId ?? session.conversationId,
        source: "durable_trace",
        reason: null,
      };
    }
  }

  const latest = await lookupLatestDurableTraceForExecutive(opts.executiveSlug);
  if (latest) {
    return {
      glassBox: glassBoxFromDurableTrace(latest),
      runtimeId: latest.runtimeId,
      conversationId: latest.conversationId,
      source: "durable_trace",
      reason: null,
    };
  }

  return {
    glassBox: null,
    runtimeId: null,
    conversationId: null,
    source: "none",
    reason:
      "No confirmed runtime trace or Context Package was available for a Glass Box. Nothing was reconstructed from chat prose.",
  };
}
