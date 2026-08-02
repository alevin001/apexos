import type { ContinuitySource } from "./conversation-state.js";
import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";

/** Machine-readable + ChatGPT-displayable ApexOS Basis (Build 17). */
export interface ApexosBasis {
  /** Brief plain-English status for the first display line. */
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
  /** Optional continuity disclosure when no prior conversation was reused. */
  continuityDisclosure?: string | null;
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
  continuityDisclosure?: string | null;
  /** Glass Box request path — runtime was not re-invoked for a full answer. */
  glassBoxOnly?: boolean;
}

export const GLASS_BOX_REMINDER =
  'Glass Box: Available. Say “Show the Glass Box” to see the retrieved records, evidence, reasoning stages, and trace.';

export const GLASS_BOX_UNAVAILABLE =
  "Glass Box: Not available for this response — no confirmed Context Package or runtime trace.";

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

  if (input.glassBoxOnly) {
    status = traceConfirmed
      ? "Runtime trace confirmed for this Glass Box request. Showing only trace-supported stages."
      : "Glass Box requested, but no confirmed runtime trace or Context Package was available.";
  } else if (!persistenceConfirmed && input.persistenceStatus === "failed") {
    status =
      "Runtime invoked, but persistence was not confirmed. Do not treat this as durably saved.";
  } else if (retrievalFailed) {
    status =
      "Runtime invoked, but retrieval was not confirmed. Response is based on your current message only.";
  } else if (groundedInSavedMemory && persistenceConfirmed && traceConfirmed) {
    status = `Runtime invoked successfully. Retrieved ${retrievedCount} saved ApexOS records and created a trace.`;
  } else if (groundedInSavedMemory && persistenceConfirmed) {
    status = `Runtime invoked successfully. Retrieved ${retrievedCount} saved ApexOS records; trace creation was not confirmed.`;
  } else if (groundedInSavedMemory) {
    status = `Runtime invoked successfully. Retrieved ${retrievedCount} saved ApexOS records.`;
  } else if (
    persistenceConfirmed &&
    (input.continuitySource === "new" || recordsCreated.length > 0) &&
    retrievedCount === 0
  ) {
    status = traceConfirmed
      ? "Runtime invoked successfully. New situation captured and saved; no prior saved records were retrieved."
      : "Runtime invoked successfully. New situation captured and saved; no prior saved records were retrieved. Trace creation was not confirmed.";
  } else if (retrievalConfirmed && retrievedCount === 0 && persistenceConfirmed) {
    status = traceConfirmed
      ? "Runtime invoked successfully. No relevant saved ApexOS records were retrieved; response is based on your current message. Trace created."
      : "Runtime invoked successfully. No relevant saved ApexOS records were retrieved; response is based on your current message.";
  } else if (persistenceConfirmed) {
    status = "Runtime invoked successfully. Capture persisted; no prior saved records were retrieved.";
  } else {
    status =
      "Runtime invoked, but durable capture was not confirmed. Do not treat this as database-grounded memory.";
  }

  if (
    input.continuitySource === "new" &&
    input.continuityDisclosure &&
    !status.includes("No prior ApexOS conversation")
  ) {
    // Disclosure stays on basis object; display block can append when needed.
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
    continuityDisclosure: input.continuityDisclosure ?? null,
  };
}

/** Legacy one-line helper. */
export function formatBasisDisplayLine(basis: ApexosBasis): string {
  return `ApexOS Basis: ${basis.status}`;
}

/**
 * Two-line normal interface status block for ChatGPT to place after the answer.
 * Line 1 = ApexOS Basis (confirmed facts only).
 * Line 2 = Glass Box reminder (or unavailability).
 */
export function formatInterfaceStatusBlock(
  basis: ApexosBasis,
  opts: { glassBoxAvailable: boolean } = { glassBoxAvailable: true }
): string {
  const lines = [`ApexOS Basis: ${basis.status}`];
  if (
    basis.continuitySource === "new" &&
    basis.continuityDisclosure &&
    !basis.status.toLowerCase().includes("no prior apexos conversation")
  ) {
    lines[0] = `${lines[0]} ${basis.continuityDisclosure}`;
  }
  lines.push(opts.glassBoxAvailable ? GLASS_BOX_REMINDER : GLASS_BOX_UNAVAILABLE);
  return lines.join("\n");
}
