import type { ContinuitySource } from "./conversation-state.js";
import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";

/** Machine-readable + ChatGPT-displayable ApexOS Basis (Build 17). */
export interface ApexosBasis {
  /** Brief plain-English status for the end of a normal answer. */
  status: string;
  persistenceConfirmed: boolean;
  retrievalConfirmed: boolean;
  traceConfirmed: boolean;
  groundedInSavedMemory: boolean;
  conversationId: string | null;
  continuitySource: ContinuitySource;
  recordsRetrievedCount: number;
  recordsCreatedCount: number;
  degradations: string[];
}

export interface BasisBuildInput {
  conversationId: string | null;
  continuitySource: ContinuitySource;
  persistenceStatus?: "persisted" | "failed" | "skipped";
  recordsCreated?: AuditRecordRef[];
  recordsRetrieved?: AuditRecordRef[];
  retrievalErrors?: string[];
  captureErrors?: string[];
  stages?: PipelineStageResult[];
  /** True when a durable or in-memory runtime_trace record was created/completed. */
  traceConfirmed?: boolean;
  runtimeAvailable?: boolean;
}

export function buildUnavailableBasis(
  continuitySource: ContinuitySource = "unavailable"
): ApexosBasis {
  return {
    status:
      "ApexOS runtime was not available; do not treat this as a database-grounded response.",
    persistenceConfirmed: false,
    retrievalConfirmed: false,
    traceConfirmed: false,
    groundedInSavedMemory: false,
    conversationId: null,
    continuitySource,
    recordsRetrievedCount: 0,
    recordsCreatedCount: 0,
    degradations: ["runtime_unavailable"],
  };
}

export function buildApexosBasis(input: BasisBuildInput): ApexosBasis {
  if (input.runtimeAvailable === false) {
    return buildUnavailableBasis(input.continuitySource);
  }

  const recordsCreated = input.recordsCreated ?? [];
  const recordsRetrieved = input.recordsRetrieved ?? [];
  const retrievalErrors = input.retrievalErrors ?? [];
  const captureErrors = input.captureErrors ?? [];
  const stages = input.stages ?? [];

  const persistenceConfirmed = input.persistenceStatus === "persisted";
  const continuityStage = stages.find((s) => s.stage === "continuity-retrieval");
  const memoryStage = stages.find((s) => s.stage === "memory-retrieval");
  const contextStage = stages.find((s) => s.stage === "context-retrieval");

  const retrievalAttempted =
    continuityStage?.status === "success" ||
    continuityStage?.status === "failed" ||
    memoryStage?.status === "success" ||
    memoryStage?.status === "failed" ||
    contextStage?.status === "success" ||
    contextStage?.status === "failed" ||
    recordsRetrieved.length > 0 ||
    retrievalErrors.length > 0;

  const retrievalFailed =
    continuityStage?.status === "failed" ||
    memoryStage?.status === "failed" ||
    contextStage?.status === "failed" ||
    retrievalErrors.length > 0;

  const retrievalConfirmed = retrievalAttempted && !retrievalFailed;
  const retrievedCount = recordsRetrieved.length;
  const groundedInSavedMemory = retrievalConfirmed && retrievedCount > 0;

  const traceStageOk = stages.some(
    (s) => s.stage === "interaction-capture" && s.status === "success"
  );
  const traceConfirmed =
    input.traceConfirmed === true ||
    (persistenceConfirmed &&
      traceStageOk &&
      !captureErrors.some((e) => e.startsWith("trace:")));

  const degradations: string[] = [];
  if (input.persistenceStatus === "failed") degradations.push("persistence_failed");
  if (input.persistenceStatus === "skipped") degradations.push("persistence_skipped");
  if (retrievalFailed) degradations.push("retrieval_failed");
  if (!traceConfirmed) degradations.push("trace_not_confirmed");
  if (captureErrors.length) degradations.push("capture_errors");

  let status: string;
  if (!persistenceConfirmed && input.persistenceStatus === "failed") {
    status =
      "ApexOS ran, but persistence was not confirmed. Do not treat this as a saved-memory update.";
  } else if (retrievalFailed) {
    status =
      "ApexOS retrieval was not confirmed. Response is based on your current message only.";
  } else if (groundedInSavedMemory) {
    status = `Retrieved saved ApexOS memory: ${retrievedCount} relevant records.`;
  } else if (
    persistenceConfirmed &&
    (input.continuitySource === "new" || recordsCreated.length > 0) &&
    retrievedCount === 0
  ) {
    status = "New situation captured and saved.";
  } else if (retrievalConfirmed && retrievedCount === 0) {
    status =
      "No relevant saved ApexOS records found. Response is based on your current message only.";
  } else if (persistenceConfirmed) {
    status = "New situation captured and saved.";
  } else {
    status =
      "No relevant saved ApexOS records found. Response is based on your current message only.";
  }

  if (degradations.includes("trace_not_confirmed") && persistenceConfirmed) {
    // Keep primary status; note missing trace in degradations only.
  }

  return {
    status,
    persistenceConfirmed,
    retrievalConfirmed,
    traceConfirmed,
    groundedInSavedMemory,
    conversationId: input.conversationId,
    continuitySource: input.continuitySource,
    recordsRetrievedCount: retrievedCount,
    recordsCreatedCount: recordsCreated.length,
    degradations,
  };
}

/** One-line suffix the model should append to executive-facing answers. */
export function formatBasisDisplayLine(basis: ApexosBasis): string {
  return `ApexOS Basis: ${basis.status}`;
}
