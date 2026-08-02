/**
 * Build 17 follow-up — natural "Show the Glass Box" detection and resolution.
 */

import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";
import {
  lookupDurableTraceByRuntimeId,
  lookupLatestDurableTraceForExecutive,
  type DurableTraceMatch,
} from "./durable-continuity.js";
import { getConversationState } from "./conversation-state.js";
import { getTrace } from "./trace-store.js";
import { buildGlassBox, type GlassBoxSummary } from "./glass-box.js";

export function isGlassBoxRequest(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;
  if (m === "glass box" || m === "show the glass box") return true;
  if (/\bshow\b[\s\S]{0,40}\bglass\s*box\b/.test(m)) return true;
  if (/\bglass\s*box\b/.test(m) && /\b(show|open|expand|display|reveal|for this)\b/.test(m)) {
    return true;
  }
  return false;
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
