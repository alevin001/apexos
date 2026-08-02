/**
 * Build 17 follow-up — constrained durable continuity fallback.
 * Used only when explicit conversationId and MCP session/process state are absent.
 * Never invents continuity across executives or stale history.
 */

import { getSupabase } from "../../shared/supabase.js";
import { resolveExecutiveSlug } from "../../shared/executive-identity.js";
import { runtimeConfig } from "../../config.js";

/** Plausible natural-follow-up window for the active conversation. */
export const DURABLE_CONTINUITY_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface DurableContinuityMatch {
  conversationId: string;
  lastRuntimeId: string | null;
  executiveSlug: string;
  updatedAt: string;
}

export interface DurableTraceMatch {
  runtimeId: string;
  conversationId: string | null;
  executiveSlug: string | null;
  status: string;
  stages: unknown;
  recordsCreated: unknown;
  recordsRetrieved: unknown;
  contextItems: unknown;
  captureErrors: unknown;
  metadata: Record<string, unknown>;
}

/**
 * Find the single most recent active ApexOS conversation for the configured
 * executive that also has a completed runtime trace inside the recency window.
 * Returns null when confidence is insufficient.
 */
export async function lookupDurableActiveConversation(
  executiveSlug?: string | null,
  nowMs: number = Date.now()
): Promise<DurableContinuityMatch | null> {
  const slug = resolveExecutiveSlug(executiveSlug ?? runtimeConfig.executiveSlug);
  const supabase = getSupabase();
  const cutoff = new Date(nowMs - DURABLE_CONTINUITY_MAX_AGE_MS).toISOString();

  const { data: executive, error: execErr } = await supabase
    .from("executives")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (execErr || !executive?.id) return null;

  const { data: conv, error: convErr } = await supabase
    .from("executive_conversations")
    .select("id, updated_at, status, executive_id")
    .eq("executive_id", executive.id)
    .eq("status", "active")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (convErr || !conv?.id) return null;
  if (conv.executive_id !== executive.id) return null;

  const { data: trace, error: traceErr } = await supabase
    .from("runtime_interaction_traces")
    .select("request_id, started_at, status")
    .eq("conversation_id", conv.id)
    .eq("status", "completed")
    .gte("started_at", cutoff)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (traceErr || !trace?.request_id) return null;

  return {
    conversationId: String(conv.id),
    lastRuntimeId: String(trace.request_id),
    executiveSlug: slug,
    updatedAt: String(conv.updated_at),
  };
}

/** Latest completed durable trace for an executive (Glass Box on demand). */
export async function lookupLatestDurableTraceForExecutive(
  executiveSlug?: string | null,
  nowMs: number = Date.now()
): Promise<DurableTraceMatch | null> {
  const slug = resolveExecutiveSlug(executiveSlug ?? runtimeConfig.executiveSlug);
  const supabase = getSupabase();
  const cutoff = new Date(nowMs - DURABLE_CONTINUITY_MAX_AGE_MS).toISOString();

  const { data: trace, error } = await supabase
    .from("runtime_interaction_traces")
    .select(
      "request_id, conversation_id, executive_slug, status, stages, records_created, records_retrieved, context_items, capture_errors, metadata, started_at"
    )
    .eq("executive_slug", slug)
    .eq("status", "completed")
    .gte("started_at", cutoff)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !trace?.request_id) return null;

  return {
    runtimeId: String(trace.request_id),
    conversationId: trace.conversation_id ? String(trace.conversation_id) : null,
    executiveSlug: trace.executive_slug ? String(trace.executive_slug) : slug,
    status: String(trace.status),
    stages: trace.stages,
    recordsCreated: trace.records_created,
    recordsRetrieved: trace.records_retrieved,
    contextItems: trace.context_items,
    captureErrors: trace.capture_errors,
    metadata:
      typeof trace.metadata === "object" && trace.metadata
        ? (trace.metadata as Record<string, unknown>)
        : {},
  };
}

export async function lookupDurableTraceByRuntimeId(
  runtimeId: string
): Promise<DurableTraceMatch | null> {
  const supabase = getSupabase();
  const { data: trace, error } = await supabase
    .from("runtime_interaction_traces")
    .select(
      "request_id, conversation_id, executive_slug, status, stages, records_created, records_retrieved, context_items, capture_errors, metadata"
    )
    .eq("request_id", runtimeId)
    .maybeSingle();

  if (error || !trace?.request_id) return null;

  return {
    runtimeId: String(trace.request_id),
    conversationId: trace.conversation_id ? String(trace.conversation_id) : null,
    executiveSlug: trace.executive_slug ? String(trace.executive_slug) : null,
    status: String(trace.status),
    stages: trace.stages,
    recordsCreated: trace.records_created,
    recordsRetrieved: trace.records_retrieved,
    contextItems: trace.context_items,
    captureErrors: trace.capture_errors,
    metadata:
      typeof trace.metadata === "object" && trace.metadata
        ? (trace.metadata as Record<string, unknown>)
        : {},
  };
}
