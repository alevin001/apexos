/**
 * Build 19 Checkpoint G — deliberate fault injection for recovery proofs.
 * Active only when explicitly armed for designated test runs.
 */

export type FaultPoint =
  | "after_original_storage"
  | "after_source_row_before_extraction_complete"
  | "after_attachment_child_before_links"
  | "before_retrieval_units"
  | "before_source_card";

export class InjectedFaultError extends Error {
  readonly faultPoint: FaultPoint;
  constructor(faultPoint: FaultPoint) {
    super(`Injected fault at ${faultPoint} — recovery test interruption`);
    this.name = "InjectedFaultError";
    this.faultPoint = faultPoint;
  }
}

let armed: FaultPoint | null = null;
let tripsRemaining = 0;

/** Arm a one-shot (or N-shot) fault. Cleared after trip or clearFaultInjection(). */
export function armFaultInjection(point: FaultPoint, trips = 1): void {
  armed = point;
  tripsRemaining = trips;
}

export function clearFaultInjection(): void {
  armed = null;
  tripsRemaining = 0;
}

export function getArmedFault(): FaultPoint | null {
  return armed;
}

export function maybeInjectFault(point: FaultPoint): void {
  if (armed !== point || tripsRemaining <= 0) return;
  tripsRemaining -= 1;
  if (tripsRemaining <= 0) armed = null;
  throw new InjectedFaultError(point);
}
