import { getSupabase } from "./supabase.js";
import type { AuditRecordRef, PipelineStageResult } from "../types/pipeline.js";

export interface DurableTraceInput {
  requestId: string;
  conversationId: string | null;
  situationId: string | null;
  executiveSlug: string | null;
  tool: string;
  status: "running" | "completed" | "failed";
  stages: PipelineStageResult[];
  recordsCreated: AuditRecordRef[];
  recordsRetrieved: AuditRecordRef[];
  contextItems: string[];
  captureErrors: string[];
  metadata?: Record<string, unknown>;
}

/** Persist or upsert a durable runtime interaction trace in Supabase. */
export async function persistRuntimeTrace(input: DurableTraceInput): Promise<void> {
  const supabase = getSupabase();
  const payload = {
    request_id: input.requestId,
    conversation_id: input.conversationId,
    situation_id: input.situationId,
    executive_slug: input.executiveSlug,
    tool: input.tool,
    status: input.status,
    stages: input.stages,
    records_created: input.recordsCreated,
    records_retrieved: input.recordsRetrieved,
    context_items: input.contextItems,
    capture_errors: input.captureErrors,
    metadata: input.metadata ?? {},
    completed_at: input.status === "running" ? null : new Date().toISOString(),
  };

  const { error } = await supabase.from("runtime_interaction_traces").upsert(payload, {
    onConflict: "request_id",
  });

  if (error) {
    // Table may not exist until migration is applied — surface via metadata only.
    throw new Error(`runtime_interaction_traces upsert failed: ${error.message}`);
  }
}

export async function lookupDurableTrace(requestId: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("runtime_interaction_traces")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}
