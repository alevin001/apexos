import { executePipeline, executePipelineDry } from "../../pipeline/orchestrator.js";
import { runtimeConfig } from "../../config.js";
import { getSupabase } from "../../shared/supabase.js";
import type { ExecutiveRequest } from "../../types/executive-request.js";
import type { RuntimeResponse } from "../../types/pipeline.js";
import type { ExecutiveContextPackage } from "../../types/context-package.js";
import { mcpConfig, MCP_VERSION } from "../config/mcp-config.js";
import { toStructuredError } from "../errors/mcp-errors.js";
import {
  startTrace,
  completeTrace,
  failTrace,
  getTrace,
  type RuntimeTraceRecord,
} from "./trace-store.js";

export interface ExecuteRuntimeResult {
  runtimeId: string;
  response: string;
  responseId?: string;
  situationSlug: string | null;
  conversationId: string | null;
  interactionId: string | null;
  contextPackageId: string | null;
  stages: RuntimeResponse["stages"];
  metadata: RuntimeResponse["metadata"];
  /** Build 17 — Context Package for Glass Box grounding. */
  contextPackage?: ExecutiveContextPackage | null;
}

export interface BuildContextResult {
  runtimeId: string;
  contextPackage: ExecutiveContextPackage;
  stages: RuntimeResponse["stages"];
}

export interface RuntimeHealthResult {
  status: "ok" | "degraded" | "unavailable";
  version: string;
  configuration: {
    env: string;
    executiveSlug: string;
    llmProvider: string;
    dryRun: boolean;
    runtimeMode: string;
    mcpVersion: string;
  };
  dependencies: {
    supabase: DependencyStatus;
    openai: DependencyStatus;
    runtimeEngine: DependencyStatus;
  };
}

interface DependencyStatus {
  status: "ok" | "degraded" | "unavailable";
  detail: string;
}

function log(level: string, message: string, data?: Record<string, unknown>): void {
  if (mcpConfig.logLevel === "silent") return;
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.error(`[apexos-mcp:${level}] ${message}${payload}`);
}

export async function invokeExecuteRuntime(
  request: ExecutiveRequest
): Promise<ExecuteRuntimeResult> {
  log("info", "execution started", { tool: "execute_runtime" });
  const provisionalId = `pending-${Date.now()}`;
  startTrace(provisionalId, "execute_runtime", {
    messagePreview: request.message.slice(0, 120),
    situationSlug: request.situationSlug ?? null,
    conversationId: request.conversationId ?? null,
    executiveSlug: request.executiveSlug ?? null,
  });

  try {
    const result =
      mcpConfig.runtimeMode === "http"
        ? await executeViaHttp(request)
        : await executePipeline(request);

    const runtimeId = result.requestId;
    // Re-key in-memory trace to the real request ID.
    const pending = getTrace(provisionalId);
    if (pending) {
      startTrace(runtimeId, "execute_runtime", {
        ...pending.metadata,
        startedAt: pending.startedAt,
      });
    }
    completeTrace(runtimeId, result.stages, {
      conversationId: result.conversationId,
      interactionId: result.interactionId,
      contextPackageId: result.contextPackageId,
      situationId: result.metadata.situationId,
      recordsCreated: result.metadata.recordsCreated,
      recordsRetrieved: result.metadata.recordsRetrieved,
      contextItems: result.metadata.contextItems,
      captureErrors: result.metadata.captureErrors,
      retrievalErrors: result.metadata.retrievalErrors,
      persistenceStatus: result.metadata.persistenceStatus,
    });

    log("info", "execution completed", {
      runtimeId,
      conversationId: result.conversationId,
      persistenceStatus: result.metadata.persistenceStatus,
      durationMs: result.stages.reduce((sum, s) => sum + s.durationMs, 0),
    });

    return {
      runtimeId,
      response: result.response,
      responseId: result.responseId,
      situationSlug: result.situationSlug,
      conversationId: result.conversationId,
      interactionId: result.interactionId,
      contextPackageId: result.contextPackageId,
      stages: result.stages,
      metadata: result.metadata,
      contextPackage: result.contextPackage ?? null,
    };
  } catch (err) {
    const structured = toStructuredError(err, null);
    failTrace(provisionalId, [], structured, {});
    log("error", "execution failed", { error: structured.message });
    throw err;
  }
}

export async function invokeBuildContext(
  request: ExecutiveRequest
): Promise<BuildContextResult> {
  log("info", "context build started", { tool: "build_context" });

  try {
    if (mcpConfig.runtimeMode === "http") {
      const data = await buildContextViaHttp(request);
      const runtimeId = data.requestId;
      startTrace(runtimeId, "build_context", {
        message: request.message,
        situationSlug: request.situationSlug ?? null,
      });
      completeTrace(runtimeId, data.stages);
      return {
        runtimeId,
        contextPackage: data.contextPackage,
        stages: data.stages,
      };
    }

    const ctx = await executePipelineDry(request);
    if (!ctx.contextPackage) {
      throw new Error("Context package was not assembled");
    }

    const runtimeId = ctx.request.requestId;
    startTrace(runtimeId, "build_context", {
      message: request.message,
      situationSlug: request.situationSlug ?? null,
    });
    completeTrace(runtimeId, ctx.stages, {
      contextPackageId: ctx.evidence?.assembledContextPackage?.externalId ?? null,
    });

    log("info", "context build completed", { runtimeId });

    return {
      runtimeId,
      contextPackage: ctx.contextPackage,
      stages: ctx.stages,
    };
  } catch (err) {
    const structured = toStructuredError(err, null);
    log("error", "context build failed", { error: structured.message });
    throw err;
  }
}

export async function invokeRuntimeHealth(): Promise<RuntimeHealthResult> {
  const [supabase, openai] = await Promise.all([
    checkSupabase(),
    Promise.resolve(checkOpenai()),
  ]);

  const runtimeEngine: DependencyStatus = { status: "ok", detail: "Orchestrator available" };

  const statuses = [supabase.status, openai.status, runtimeEngine.status];
  const overall: RuntimeHealthResult["status"] = statuses.every((s) => s === "ok")
    ? "ok"
    : statuses.some((s) => s === "unavailable")
      ? "unavailable"
      : "degraded";

  return {
    status: overall,
    version: MCP_VERSION,
    configuration: {
      env: runtimeConfig.env,
      executiveSlug: runtimeConfig.executiveSlug,
      llmProvider: runtimeConfig.llmProvider,
      dryRun: runtimeConfig.dryRun || !runtimeConfig.openaiApiKey,
      runtimeMode: mcpConfig.runtimeMode,
      mcpVersion: MCP_VERSION,
    },
    dependencies: {
      supabase,
      openai,
      runtimeEngine,
    },
  };
}

export async function invokeRuntimeTrace(runtimeId: string): Promise<RuntimeTraceRecord | null> {
  const { lookupTrace } = await import("./trace-store.js");
  return lookupTrace(runtimeId);
}

async function executeViaHttp(request: ExecutiveRequest): Promise<RuntimeResponse> {
  const url = `${mcpConfig.runtimeEndpoint}/runtime/execute`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<RuntimeResponse>;
}

async function buildContextViaHttp(request: ExecutiveRequest): Promise<{
  requestId: string;
  contextPackage: ExecutiveContextPackage;
  stages: RuntimeResponse["stages"];
}> {
  const url = `${mcpConfig.runtimeEndpoint}/runtime/context-package`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<{
    requestId: string;
    contextPackage: ExecutiveContextPackage;
    stages: RuntimeResponse["stages"];
  }>;
}

async function checkSupabase(): Promise<DependencyStatus> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("executives").select("id").limit(1);
    if (error) {
      return { status: "degraded", detail: error.message };
    }
    return { status: "ok", detail: "Connected" };
  } catch (err) {
    return {
      status: "unavailable",
      detail: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

function checkOpenai(): DependencyStatus {
  if (runtimeConfig.dryRun || !runtimeConfig.openaiApiKey) {
    return { status: "degraded", detail: "Dry-run mode — stub LLM provider active" };
  }
  return { status: "ok", detail: `Provider: ${runtimeConfig.llmProvider}` };
}
