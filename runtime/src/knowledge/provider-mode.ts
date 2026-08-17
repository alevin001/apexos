/**
 * Build 19 Checkpoint G — provider mode fail-closed policy.
 * Mock derivatives must never silently enter production / real-library runs.
 */

export type ProviderMode = "live" | "test_mock" | "disabled";

export interface ProviderCallCounters {
  visionCalls: number;
  sourceCardCalls: number;
  mode: ProviderMode;
}

const counters: ProviderCallCounters = {
  visionCalls: 0,
  sourceCardCalls: 0,
  mode: "live",
};

let activeMode: ProviderMode | null = null;

/** Explicit test/production override. Cleared in test afterEach. */
export function setProviderModeForTests(mode: ProviderMode | null): void {
  activeMode = mode;
  if (mode) counters.mode = mode;
}

export function resetProviderCallCounters(mode?: ProviderMode): void {
  counters.visionCalls = 0;
  counters.sourceCardCalls = 0;
  if (mode) counters.mode = mode;
}

export function recordVisionProviderCall(): void {
  counters.visionCalls += 1;
}

export function recordSourceCardProviderCall(): void {
  counters.sourceCardCalls += 1;
}

export function getProviderCallCounters(): ProviderCallCounters {
  return { ...counters };
}

/**
 * Resolve provider mode.
 * - Explicit override / APEXOS_PROVIDER_MODE wins
 * - test_mock only when APEXOS_ALLOW_TEST_MOCK=1 (or mode set for tests)
 * - Default: live (fail-closed — no silent mock)
 */
export function resolveProviderMode(explicit?: ProviderMode): ProviderMode {
  if (activeMode) return activeMode;
  if (explicit) return explicit;
  const env = (process.env.APEXOS_PROVIDER_MODE || "").toLowerCase();
  if (env === "live" || env === "test_mock" || env === "disabled") {
    if (env === "test_mock" && process.env.APEXOS_ALLOW_TEST_MOCK !== "1") {
      throw new Error(
        "Provider mode test_mock refused: set APEXOS_ALLOW_TEST_MOCK=1 for explicitly designated test runs only."
      );
    }
    return env;
  }
  // Legacy flag: live source cards only — still live mode overall
  if (process.env.APEXOS_LIVE_SOURCE_CARDS === "1") return "live";
  return "live";
}

export function assertProviderModeAllowed(mode: ProviderMode): void {
  if (mode === "test_mock" && process.env.APEXOS_ALLOW_TEST_MOCK !== "1" && !activeMode) {
    throw new Error(
      "test_mock provider mode is not allowed outside explicitly designated test runs (APEXOS_ALLOW_TEST_MOCK=1)."
    );
  }
}

/** Whether mock vision/source-card providers may be installed for this mode. */
export function allowMockProviders(mode: ProviderMode): boolean {
  return mode === "test_mock";
}
