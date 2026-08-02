/**
 * Build 17.3 — request-lifecycle correlation for ChatGPT → ApexOS proof.
 * Opaque requestId + structured logs; no sensitive message bodies.
 */

import { randomUUID } from "node:crypto";
import { mcpConfig } from "../config/mcp-config.js";
import type { ContinuitySource } from "./conversation-state.js";

export type LifecycleEventName =
  | "request_received"
  | "runtime_starting"
  | "continuity_resolved"
  | "runtime_completed"
  | "response_assembled"
  | "mcp_response_sent"
  | "request_failed";

export interface LifecycleEvent {
  event: LifecycleEventName;
  at: string;
  data?: Record<string, unknown>;
}

export interface InvocationDiagnostic {
  status: "invoked" | "failed";
  requestId: string;
  runtimeId: string | null;
  responseReturned: boolean;
  tool: string;
}

export interface LifecycleDiagnostic {
  events: LifecycleEventName[];
  continuitySource: ContinuitySource | null;
  captureConfirmed: boolean | null;
  retrievalConfirmed: boolean | null;
  persistenceConfirmed: boolean | null;
  traceConfirmed: boolean | null;
  basisIncluded: boolean;
  glassBoxReminderIncluded: boolean;
  failedStage: string | null;
  errorSummary: string | null;
  responseBytes: number | null;
}

export interface RequestLifecycleSummary {
  requestId: string;
  tool: string;
  startedAt: string;
  completedAt: string | null;
  outcome: "in_progress" | "completed" | "failed";
  events: LifecycleEvent[];
  continuitySource: ContinuitySource | null;
  runtimeId: string | null;
  conversationIdPresent: boolean;
  messageLength: number;
  sessionKeyKind: "mcp_session" | "stdio_process";
  captureConfirmed: boolean | null;
  retrievalConfirmed: boolean | null;
  persistenceConfirmed: boolean | null;
  traceConfirmed: boolean | null;
  basisIncluded: boolean;
  glassBoxReminderIncluded: boolean;
  responseReturned: boolean;
  responseBytes: number | null;
  failedStage: string | null;
  errorSummary: string | null;
}

const RECENT_MAX = 50;
const recent = new Map<string, RequestLifecycleSummary>();
const recentOrder: string[] = [];

function emitLog(requestId: string, event: LifecycleEventName, data?: Record<string, unknown>): void {
  if (mcpConfig.logLevel === "silent") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    component: "apexos-mcp-lifecycle",
    requestId,
    event,
    ...(data ?? {}),
  });
  console.error(line);
}

function remember(summary: RequestLifecycleSummary): void {
  if (!recent.has(summary.requestId)) {
    recentOrder.push(summary.requestId);
  }
  recent.set(summary.requestId, summary);
  while (recentOrder.length > RECENT_MAX) {
    const old = recentOrder.shift();
    if (old) recent.delete(old);
  }
}

export function createLifecycleRequestId(): string {
  return randomUUID();
}

export function getRecentLifecycles(limit = 20): RequestLifecycleSummary[] {
  const n = Math.max(1, Math.min(limit, RECENT_MAX));
  return recentOrder
    .slice(-n)
    .reverse()
    .map((id) => recent.get(id)!)
    .filter(Boolean);
}

export function getLifecycleByRequestId(requestId: string): RequestLifecycleSummary | undefined {
  return recent.get(requestId);
}

export function clearLifecyclesForTests(): void {
  recent.clear();
  recentOrder.length = 0;
}

/** Correlate one apexos_conversation MCP request end-to-end. */
export class RequestLifecycle {
  readonly requestId: string;
  readonly tool: string;
  private readonly startedAt: string;
  private readonly events: LifecycleEvent[] = [];
  private continuitySource: ContinuitySource | null = null;
  private runtimeId: string | null = null;
  private conversationIdPresent = false;
  private messageLength = 0;
  private sessionKeyKind: "mcp_session" | "stdio_process" = "stdio_process";
  private captureConfirmed: boolean | null = null;
  private retrievalConfirmed: boolean | null = null;
  private persistenceConfirmed: boolean | null = null;
  private traceConfirmed: boolean | null = null;
  private basisIncluded = false;
  private glassBoxReminderIncluded = false;
  private responseReturned = false;
  private responseBytes: number | null = null;
  private failedStage: string | null = null;
  private errorSummary: string | null = null;
  private outcome: RequestLifecycleSummary["outcome"] = "in_progress";
  private completedAt: string | null = null;
  private currentStage = "request_received";

  constructor(tool: string, requestId: string = createLifecycleRequestId()) {
    this.tool = tool;
    this.requestId = requestId;
    this.startedAt = new Date().toISOString();
  }

  private push(event: LifecycleEventName, data?: Record<string, unknown>): void {
    const entry: LifecycleEvent = {
      event,
      at: new Date().toISOString(),
      data,
    };
    this.events.push(entry);
    emitLog(this.requestId, event, data);
    this.persist();
  }

  private persist(): void {
    remember({
      requestId: this.requestId,
      tool: this.tool,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      outcome: this.outcome,
      events: [...this.events],
      continuitySource: this.continuitySource,
      runtimeId: this.runtimeId,
      conversationIdPresent: this.conversationIdPresent,
      messageLength: this.messageLength,
      sessionKeyKind: this.sessionKeyKind,
      captureConfirmed: this.captureConfirmed,
      retrievalConfirmed: this.retrievalConfirmed,
      persistenceConfirmed: this.persistenceConfirmed,
      traceConfirmed: this.traceConfirmed,
      basisIncluded: this.basisIncluded,
      glassBoxReminderIncluded: this.glassBoxReminderIncluded,
      responseReturned: this.responseReturned,
      responseBytes: this.responseBytes,
      failedStage: this.failedStage,
      errorSummary: this.errorSummary,
    });
  }

  requestReceived(opts: {
    messageLength: number;
    sessionKeyKind: "mcp_session" | "stdio_process";
    glassBoxRequest: boolean;
  }): void {
    this.currentStage = "request_received";
    this.messageLength = opts.messageLength;
    this.sessionKeyKind = opts.sessionKeyKind;
    this.push("request_received", {
      tool: this.tool,
      messageLength: opts.messageLength,
      sessionKeyKind: opts.sessionKeyKind,
      glassBoxRequest: opts.glassBoxRequest,
    });
  }

  continuityResolved(source: ContinuitySource): void {
    this.currentStage = "continuity_resolved";
    this.continuitySource = source;
    this.push("continuity_resolved", { continuitySource: source });
  }

  runtimeStarting(): void {
    this.currentStage = "runtime_starting";
    this.push("runtime_starting", {});
  }

  runtimeCompleted(opts: {
    runtimeId: string | null;
    conversationId: string | null;
    captureConfirmed: boolean;
    retrievalConfirmed: boolean;
    persistenceConfirmed: boolean;
    traceConfirmed: boolean;
  }): void {
    this.currentStage = "runtime_completed";
    this.runtimeId = opts.runtimeId;
    this.conversationIdPresent = Boolean(opts.conversationId);
    this.captureConfirmed = opts.captureConfirmed;
    this.retrievalConfirmed = opts.retrievalConfirmed;
    this.persistenceConfirmed = opts.persistenceConfirmed;
    this.traceConfirmed = opts.traceConfirmed;
    this.push("runtime_completed", {
      runtimeId: opts.runtimeId,
      conversationIdPresent: this.conversationIdPresent,
      captureConfirmed: opts.captureConfirmed,
      retrievalConfirmed: opts.retrievalConfirmed,
      persistenceConfirmed: opts.persistenceConfirmed,
      traceConfirmed: opts.traceConfirmed,
    });
  }

  responseAssembled(opts: {
    basisIncluded: boolean;
    glassBoxReminderIncluded: boolean;
  }): void {
    this.currentStage = "response_assembled";
    this.basisIncluded = opts.basisIncluded;
    this.glassBoxReminderIncluded = opts.glassBoxReminderIncluded;
    this.push("response_assembled", {
      basisIncluded: opts.basisIncluded,
      glassBoxReminderIncluded: opts.glassBoxReminderIncluded,
    });
  }

  mcpResponseSent(opts: {
    success: boolean;
    responseBytes: number;
    contentType: string;
  }): void {
    this.currentStage = "mcp_response_sent";
    // True whenever a tool result payload is returned to the MCP layer
    // (including failed/degraded envelopes). Distinguishes server return vs ChatGPT ignore.
    this.responseReturned = true;
    this.responseBytes = opts.responseBytes;
    if (this.outcome === "failed") {
      // keep failed
    } else {
      this.outcome = opts.success ? "completed" : "failed";
    }
    this.completedAt = new Date().toISOString();
    this.push("mcp_response_sent", {
      success: opts.success,
      responseReturned: true,
      responseBytes: opts.responseBytes,
      contentType: opts.contentType,
      outcome: this.outcome,
    });
  }

  requestFailed(stage: string | undefined, err: unknown): void {
    this.currentStage = stage ?? this.currentStage;
    this.failedStage = this.currentStage;
    this.errorSummary = safeErrorSummary(err);
    this.outcome = "failed";
    this.completedAt = new Date().toISOString();
    this.push("request_failed", {
      failedStage: this.failedStage,
      errorSummary: this.errorSummary,
    });
  }

  buildInvocation(status: "invoked" | "failed"): InvocationDiagnostic {
    return {
      status,
      requestId: this.requestId,
      runtimeId: this.runtimeId,
      responseReturned: this.responseReturned,
      tool: this.tool,
    };
  }

  buildLifecycleDiagnostic(): LifecycleDiagnostic {
    return {
      events: this.events.map((e) => e.event),
      continuitySource: this.continuitySource,
      captureConfirmed: this.captureConfirmed,
      retrievalConfirmed: this.retrievalConfirmed,
      persistenceConfirmed: this.persistenceConfirmed,
      traceConfirmed: this.traceConfirmed,
      basisIncluded: this.basisIncluded,
      glassBoxReminderIncluded: this.glassBoxReminderIncluded,
      failedStage: this.failedStage,
      errorSummary: this.errorSummary,
      responseBytes: this.responseBytes,
    };
  }

  getCurrentStage(): string {
    return this.currentStage;
  }
}

function safeErrorSummary(err: unknown): string {
  if (err instanceof Error) {
    return err.message.slice(0, 300);
  }
  if (typeof err === "string") return err.slice(0, 300);
  return "unknown_error";
}
