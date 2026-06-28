import { TERMINAL_STATUSES } from "../shared/config.js";

export type IntegrityDecision =
  | { action: "insert" }
  | { action: "update"; appendLog: Record<string, unknown> }
  | { action: "skip"; reason: string }
  | { action: "supersede"; reason: string };

export function appendTransformationLog(
  existing: unknown,
  entry: Record<string, unknown>
): Record<string, unknown>[] {
  const log = Array.isArray(existing) ? [...existing] : [];
  log.push({
    date: new Date().toISOString().slice(0, 10),
    ...entry,
  });
  return log;
}

export function isTerminalStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return TERMINAL_STATUSES.has(status.toLowerCase());
}

export function decideIntegrityAction(
  existingStatus: string | undefined | null,
  incomingStatus: string | undefined | null,
  isReIngest: boolean
): IntegrityDecision {
  if (!isReIngest) {
    return { action: "insert" };
  }

  if (isTerminalStatus(existingStatus)) {
    if (existingStatus?.toLowerCase() === incomingStatus?.toLowerCase()) {
      return {
        action: "skip",
        reason: `Terminal status '${existingStatus}' — historical integrity preserved (LAD-011)`,
      };
    }
    return {
      action: "supersede",
      reason: `Terminal status '${existingStatus}' — requires supersession via new row`,
    };
  }

  return {
    action: "update",
    appendLog: {
      action: "ingested_from_repository",
      rationale: "Build 09 re-ingestion update to non-terminal artifact",
      actor: "ingestion-script",
    },
  };
}

export function assertNoSilentOverwrite(
  existingLog: unknown,
  newLog: Record<string, unknown>[]
): void {
  if (!Array.isArray(existingLog)) return;
  if (newLog.length < existingLog.length) {
    throw new Error("Historical integrity violation: transformation_log would shrink (LAD-011)");
  }
}
