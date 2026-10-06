/**
 * Shared gate for Build 19 controlled live OpenAI acceptance tests.
 * - Ordinary `npm test`: tests are skipped (provider-free).
 * - `npm run test:live` (APEXOS_LIVE_ACCEPTANCE=1): tests run and must fail clearly
 *   if credentials are missing or the provider fails — never mock or silent-pass.
 */
import assert from "node:assert/strict";
import { runtimeConfig } from "../config.js";

export const LIVE_ACCEPTANCE_ENV = "APEXOS_LIVE_ACCEPTANCE";

export function liveAcceptanceRequested(): boolean {
  return process.env[LIVE_ACCEPTANCE_ENV] === "1";
}

/** Node:test skip option when live acceptance was not intentionally requested. */
export function skipUnlessLiveAcceptance(): false | string {
  if (liveAcceptanceRequested()) return false;
  return `Live acceptance — run via npm run test:live (${LIVE_ACCEPTANCE_ENV}=1)`;
}

/** Fail (do not skip) when an intentional live run lacks credentials. */
export function assertLiveCredentialsConfigured(checkpoint: string): void {
  assert.ok(
    Boolean(runtimeConfig.openaiApiKey),
    `OPENAI_API_KEY required for ${checkpoint} live acceptance — refuse to skip/mock/silent-pass`
  );
}

export function sanitizeLiveFailure(input: {
  checkpoint: string;
  providerMode: string;
  stage: string;
  ok: boolean;
  model?: string;
  processVersion?: string;
  promptVersion?: string;
  error?: string | null;
  limitation?: string | null;
  httpStatus?: number | null;
  openaiErrorCode?: string | null;
  openaiErrorType?: string | null;
  requestId?: string | null;
  elapsedMs?: number;
  retryCount?: number;
  visionCalls?: number;
  sourceCardCalls?: number;
  sourceCardStageReached?: boolean;
}): string {
  return JSON.stringify(
    {
      ...input,
      config: {
        openaiApiKeyPresent: Boolean(runtimeConfig.openaiApiKey),
        openaiModelPinned: runtimeConfig.openaiModel || "gpt-4o-mini",
        liveAcceptanceRequested: liveAcceptanceRequested(),
      },
    },
    null,
    2
  );
}
