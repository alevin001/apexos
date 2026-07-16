import { getSupabase } from "../../shared/supabase.js";
import type { PipelineStageResult } from "../../types/pipeline.js";
import { mcpConfig } from "../config/mcp-config.js";
import type { StructuredMcpError } from "../errors/mcp-errors.js";

export type TraceStatus = "running" | "completed" | "failed";

export interface RuntimeTraceRecord {
  runtimeId: string;
  tool: string;
  startedAt: string;
  completedAt?: string;
  status: TraceStatus;
  stages: PipelineStageResult[];
  metadata: Record<string, unknown>;
  error?: StructuredMcpError;
}

const traces = new Map<string, RuntimeTraceRecord>();

export function startTrace(
  runtimeId: string,
  tool: string,
  metadata: Record<string, unknown> = {}
): RuntimeTraceRecord {
  const record: RuntimeTraceRecord = {
    runtimeId,
    tool,
    startedAt: new Date().toISOString(),
    status: "running",
    stages: [],
    metadata,
  };
  traces.set(runtimeId, record);
  pruneOldTraces();
  return record;
}

export function completeTrace(
  runtimeId: string,
  stages: PipelineStageResult[],
  metadata: Record<string, unknown> = {}
): RuntimeTraceRecord | undefined {
  const record = traces.get(runtimeId);
  if (!record) return undefined;

  record.status = "completed";
  record.completedAt = new Date().toISOString();
  record.stages = stages;
  record.metadata = { ...record.metadata, ...metadata };
  return record;
}

export function failTrace(
  runtimeId: string,
  stages: PipelineStageResult[],
  error: StructuredMcpError,
  metadata: Record<string, unknown> = {}
): RuntimeTraceRecord | undefined {
  const record = traces.get(runtimeId);
  if (!record) return undefined;

  record.status = "failed";
  record.completedAt = new Date().toISOString();
  record.stages = stages;
  record.error = error;
  record.metadata = { ...record.metadata, ...metadata };
  return record;
}

export function getTrace(runtimeId: string): RuntimeTraceRecord | undefined {
  return traces.get(runtimeId);
}

export async function lookupTrace(runtimeId: string): Promise<RuntimeTraceRecord | null> {
  const inMemory = traces.get(runtimeId);
  if (inMemory) return inMemory;

  return lookupTraceFromSupabase(runtimeId);
}

async function lookupTraceFromSupabase(runtimeId: string): Promise<RuntimeTraceRecord | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("metadata, created_at")
      .filter("metadata->>requestId", "eq", runtimeId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) return null;

    const meta = data[0].metadata as Record<string, unknown> | null;
    if (!meta) return null;

    const stages = (meta.stages as PipelineStageResult[] | undefined) ?? [];

    return {
      runtimeId,
      tool: "execute_runtime",
      startedAt: data[0].created_at ?? new Date().toISOString(),
      completedAt: data[0].created_at ?? undefined,
      status: "completed",
      stages,
      metadata: {
        contextPackageId: meta.contextPackageId ?? null,
        model: meta.model ?? null,
        provider: meta.provider ?? null,
        source: "supabase",
      },
    };
  } catch {
    return null;
  }
}

function pruneOldTraces(): void {
  const cutoff = Date.now() - mcpConfig.traceRetentionMs;
  for (const [id, record] of traces) {
    const ts = Date.parse(record.startedAt);
    if (ts < cutoff) traces.delete(id);
  }
}
