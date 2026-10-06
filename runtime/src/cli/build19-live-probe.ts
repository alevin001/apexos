/**
 * Build 19 live-provider diagnostic probe (sanitized).
 * No DB/Storage writes. No raw fixture dumps. No secrets.
 *
 *   node run.mjs cli/build19-live-probe.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeConfig } from "../config.js";
import { OpenAiVisionProvider } from "../knowledge/vision/provider.js";
import { OpenAiSourceCardProvider } from "../knowledge/source-cards/provider.js";
import { VISION_PROCESS_VERSION, VISION_PROMPT_VERSION } from "../knowledge/vision/versions.js";
import {
  SOURCE_CARD_PROCESS_VERSION,
  SOURCE_CARD_PROMPT_VERSION,
} from "../knowledge/source-cards/versions.js";
import { setProviderModeForTests, resetProviderCallCounters } from "../knowledge/provider-mode.js";
import { visionPromptVersion } from "../knowledge/vision/prompts.js";
import { sourceCardPromptVersion } from "../knowledge/source-cards/prompts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePng = resolve(
  __dirname,
  "../../../knowledge/import/seed-build19-d/image/diagram-with-labels.png"
);

function sanitizeOpenAiErrorBody(bodyText: string): {
  errorType?: string;
  errorCode?: string;
  errorMessageClass?: string;
  requestIdFromBody?: string;
} {
  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { type?: string; code?: string; message?: string };
      id?: string;
    };
    const msg = parsed.error?.message ?? "";
    let errorMessageClass = "unknown";
    if (/incorrect api key|invalid_api_key|authentication/i.test(msg)) {
      errorMessageClass = "authentication";
    } else if (/quota|billing|insufficient_quota|rate.?limit/i.test(msg)) {
      errorMessageClass = "quota_or_rate_limit";
    } else if (/model|does not exist|not found|access/i.test(msg)) {
      errorMessageClass = "model_access";
    } else if (/timeout|timed out/i.test(msg)) {
      errorMessageClass = "timeout";
    } else if (msg) {
      errorMessageClass = "other_message_present";
    }
    return {
      errorType: parsed.error?.type,
      errorCode: parsed.error?.code,
      errorMessageClass,
      requestIdFromBody: parsed.id,
    };
  } catch {
    return { errorMessageClass: "unparseable_body" };
  }
}

async function rawResponsesProbe(kind: "vision" | "source_card"): Promise<Record<string, unknown>> {
  const apiKeyPresent = Boolean(runtimeConfig.openaiApiKey);
  const model = runtimeConfig.openaiModel || "gpt-4o-mini";
  const t0 = Date.now();
  if (!apiKeyPresent) {
    return {
      probe: `raw_${kind}`,
      ok: false,
      errorClass: "missing_credentials",
      httpStatus: null,
      elapsedMs: Date.now() - t0,
      config: { openaiApiKeyPresent: false, modelPinned: model },
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${runtimeConfig.openaiApiKey}`,
    "Content-Type": "application/json",
  };

  let body: unknown;
  if (kind === "vision") {
    if (!existsSync(fixturePng)) {
      return { probe: "raw_vision", ok: false, errorClass: "missing_fixture" };
    }
    const bytes = readFileSync(fixturePng);
    const b64 = bytes.toString("base64");
    body = {
      model,
      instructions: "Transcribe visible text only. Do not invent.",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Locator: image page 1 (diagnostic probe)." },
            { type: "input_image", image_url: `data:image/png;base64,${b64}` },
          ],
        },
      ],
    };
  } else {
    body = {
      model,
      instructions: "Return a short JSON object with keys description, apparentPurpose, documentType.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Source type: text\nFormat: txt\nConfirmed extraction: Build19 synthetic TOKEN-PROBE-CARD operating note.",
            },
          ],
        },
      ],
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const bodyText = await response.text();
    const sanitized = sanitizeOpenAiErrorBody(bodyText);
    const requestIdHeader = response.headers.get("x-request-id") ?? undefined;
    return {
      probe: `raw_${kind}`,
      ok: response.ok,
      httpStatus: response.status,
      openaiErrorType: sanitized.errorType ?? null,
      openaiErrorCode: sanitized.errorCode ?? null,
      errorMessageClass: sanitized.errorMessageClass,
      requestId: requestIdHeader ?? sanitized.requestIdFromBody ?? null,
      modelPinned: model,
      elapsedMs: Date.now() - t0,
      responseBytes: bodyText.length,
      // Never log body text
    };
  } catch (err) {
    return {
      probe: `raw_${kind}`,
      ok: false,
      errorClass: err instanceof Error ? err.name : "unknown",
      errorMessageClass:
        err instanceof Error && /fetch|network|ENOTFOUND|ECONNREFUSED|abort/i.test(err.message)
          ? "network"
          : "exception",
      elapsedMs: Date.now() - t0,
    };
  }
}

async function adapterVisionProbe(): Promise<Record<string, unknown>> {
  setProviderModeForTests("live");
  resetProviderCallCounters("live");
  const t0 = Date.now();
  const provider = new OpenAiVisionProvider();
  if (!existsSync(fixturePng)) {
    return { probe: "adapter_vision", ok: false, errorClass: "missing_fixture" };
  }
  const result = await provider.analyze({
    kind: "transcription",
    imageBytes: readFileSync(fixturePng),
    mimeType: "image/png",
    locatorLabel: "diagnostic image",
  });
  return {
    probe: "adapter_vision",
    providerMode: "live",
    provider: result.provider,
    model: result.model,
    processVersion: result.processVersion ?? VISION_PROCESS_VERSION,
    promptVersion: result.promptVersion ?? visionPromptVersion(),
    ok: result.ok,
    error: result.error ?? null,
    limitationPresent: Boolean(result.limitation),
    textLength: result.text?.length ?? 0,
    responseIdPresent: Boolean(result.responseId),
    elapsedMs: Date.now() - t0,
    config: {
      openaiApiKeyPresent: Boolean(runtimeConfig.openaiApiKey),
      openaiModel: runtimeConfig.openaiModel || "gpt-4o-mini",
    },
  };
}

async function adapterSourceCardProbe(): Promise<Record<string, unknown>> {
  setProviderModeForTests("live");
  resetProviderCallCounters("live");
  const t0 = Date.now();
  const provider = new OpenAiSourceCardProvider();
  const result = await provider.generate({
    inputText: "Build19 synthetic TOKEN-PROBE-CARD operating note for governed source-card probe.",
    metadataNote: "diagnostic probe — synthetic only",
    sourceType: "internal-document",
    formatLabel: "txt",
  });
  return {
    probe: "adapter_source_card",
    providerMode: "live",
    provider: result.provider,
    model: result.model,
    processVersion: result.processVersion ?? SOURCE_CARD_PROCESS_VERSION,
    promptVersion: result.promptVersion ?? sourceCardPromptVersion(),
    ok: result.ok,
    error: result.error ?? null,
    limitationPresent: Boolean(result.limitation),
    outputPresent: Boolean(result.output),
    responseIdPresent: Boolean(result.responseId),
    elapsedMs: Date.now() - t0,
    config: {
      openaiApiKeyPresent: Boolean(runtimeConfig.openaiApiKey),
      openaiModel: runtimeConfig.openaiModel || "gpt-4o-mini",
    },
  };
}

async function main(): Promise<void> {
  console.log(
    JSON.stringify(
      {
        configBooleans: {
          openaiApiKeyPresent: Boolean(runtimeConfig.openaiApiKey),
          openaiApiKeyLength: runtimeConfig.openaiApiKey?.length ?? 0,
          openaiModelPinned: runtimeConfig.openaiModel || "gpt-4o-mini",
          fixturePngPresent: existsSync(fixturePng),
          visionProcessVersion: VISION_PROCESS_VERSION,
          visionPromptVersion: VISION_PROMPT_VERSION,
          sourceCardProcessVersion: SOURCE_CARD_PROCESS_VERSION,
          sourceCardPromptVersion: SOURCE_CARD_PROMPT_VERSION,
        },
      },
      null,
      2
    )
  );

  const rawVision = await rawResponsesProbe("vision");
  console.log(JSON.stringify(rawVision, null, 2));
  const rawCard = await rawResponsesProbe("source_card");
  console.log(JSON.stringify(rawCard, null, 2));
  const adapterVision = await adapterVisionProbe();
  console.log(JSON.stringify(adapterVision, null, 2));
  const adapterCard = await adapterSourceCardProbe();
  console.log(JSON.stringify(adapterCard, null, 2));

  setProviderModeForTests(null);
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      fatal: true,
      errorClass: err instanceof Error ? err.name : "unknown",
      messageClass: "probe_script_exception",
    })
  );
  process.exit(1);
});
