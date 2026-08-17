import { runtimeConfig } from "../../config.js";
import {
  allowMockProviders,
  recordVisionProviderCall,
  resolveProviderMode,
} from "../provider-mode.js";
import {
  transcriptionInstructions,
  visualDescriptionInstructions,
  visionPromptVersion,
} from "./prompts.js";
import {
  type VisionExtractionProvider,
  type VisionProviderRequest,
  type VisionProviderResult,
} from "./types.js";
import { VISION_PROCESS_VERSION } from "./versions.js";

/**
 * Explicit ingestion-stage OpenAI vision provider.
 * Not conversational ChatGPT memory. Secrets via env only.
 */
export class OpenAiVisionProvider implements VisionExtractionProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts?: { apiKey?: string; model?: string; baseUrl?: string; timeoutMs?: number }) {
    this.apiKey = opts?.apiKey ?? runtimeConfig.openaiApiKey;
    this.model = opts?.model ?? runtimeConfig.openaiModel ?? "gpt-4o-mini";
    this.baseUrl = opts?.baseUrl ?? "https://api.openai.com/v1";
    this.timeoutMs = opts?.timeoutMs ?? 60_000;
  }

  async analyze(request: VisionProviderRequest): Promise<VisionProviderResult> {
    recordVisionProviderCall();
    const timestamp = new Date().toISOString();
    if (!this.apiKey) {
      return {
        ok: false,
        provider: this.name,
        model: this.model,
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: visionPromptVersion(),
        timestamp,
        error: "OPENAI_API_KEY not configured",
        limitation: "Vision provider unavailable — original preserved; vision extraction blocked.",
      };
    }

    const instructions =
      request.kind === "transcription"
        ? transcriptionInstructions()
        : visualDescriptionInstructions();
    const b64 = request.imageBytes.toString("base64");
    const dataUrl = `data:${request.mimeType};base64,${b64}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          instructions,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Locator: ${request.locatorLabel}.${
                    request.contextNote ? ` Context: ${request.contextNote}` : ""
                  }`,
                },
                { type: "input_image", image_url: dataUrl },
              ],
            },
          ],
        }),
      });

      const bodyText = await response.text();
      if (!response.ok) {
        return {
          ok: false,
          provider: this.name,
          model: this.model,
          processVersion: VISION_PROCESS_VERSION,
          promptVersion: visionPromptVersion(),
          timestamp,
          error: `OpenAI vision HTTP ${response.status}`,
          limitation: `Vision provider error (${response.status}). Original preserved; vision extraction blocked/failed.`,
        };
      }

      const data = JSON.parse(bodyText) as {
        id?: string;
        model?: string;
        output_text?: string;
        output?: Array<{
          type: string;
          content?: Array<{ type: string; text?: string }>;
        }>;
      };
      const text = extractOutputText(data).trim();
      if (!text) {
        return {
          ok: false,
          provider: this.name,
          model: data.model ?? this.model,
          processVersion: VISION_PROCESS_VERSION,
          promptVersion: visionPromptVersion(),
          responseId: data.id,
          timestamp,
          error: "Empty vision output",
          limitation: "Vision returned no usable text. Original preserved; coverage unavailable.",
        };
      }

      const unreadable = /\[unreadable\]/i.test(text);
      return {
        ok: true,
        text,
        provider: this.name,
        model: data.model ?? this.model,
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: visionPromptVersion(),
        responseId: data.id,
        timestamp,
        limitation: unreadable
          ? "Vision noted unreadable regions; content was not invented."
          : undefined,
        normalized: {
          kind: request.kind,
          locatorLabel: request.locatorLabel,
          text,
          unreadableRegionsNoted: unreadable,
          inventedContentAvoided: true,
        },
      };
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        provider: this.name,
        model: this.model,
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: visionPromptVersion(),
        timestamp,
        error: err instanceof Error ? err.message : String(err),
        limitation: aborted
          ? "Vision provider timed out. Original preserved; vision extraction blocked."
          : `Vision provider failure. Original preserved; vision extraction blocked. (${
              err instanceof Error ? err.message : String(err)
            })`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Deterministic mock for orchestration tests — not live capability proof. */
export class MockVisionProvider implements VisionExtractionProvider {
  readonly name = "mock-vision";
  constructor(
    private readonly behavior: "ok" | "fail" | "timeout" | "partial" = "ok",
    private readonly scriptedText?: string
  ) {}

  async analyze(request: VisionProviderRequest): Promise<VisionProviderResult> {
    recordVisionProviderCall();
    const timestamp = new Date().toISOString();
    if (this.behavior === "fail") {
      return {
        ok: false,
        provider: this.name,
        model: "mock",
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: visionPromptVersion(),
        timestamp,
        error: "mock failure",
        limitation: "Vision provider failure. Original preserved; vision extraction blocked.",
      };
    }
    if (this.behavior === "timeout") {
      return {
        ok: false,
        provider: this.name,
        model: "mock",
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: visionPromptVersion(),
        timestamp,
        error: "timeout",
        limitation: "Vision provider timed out. Original preserved; vision extraction blocked.",
      };
    }
    const text =
      this.scriptedText ??
      (request.kind === "transcription"
        ? this.behavior === "partial"
          ? `Visible edge text [unreadable] (${request.locatorLabel})`
          : `MOCK TRANSCRIPTION for ${request.locatorLabel}`
        : `Visible text lines arranged vertically for ${request.locatorLabel}. No other graphical elements asserted.`);
    return {
      ok: true,
      text,
      provider: this.name,
      model: "mock",
      processVersion: VISION_PROCESS_VERSION,
      promptVersion: visionPromptVersion(),
      responseId: `mock-${Date.now()}`,
      timestamp,
      limitation:
        this.behavior === "partial"
          ? "Vision noted unreadable regions; content was not invented."
          : undefined,
      normalized: {
        kind: request.kind,
        locatorLabel: request.locatorLabel,
        text,
        unreadableRegionsNoted: this.behavior === "partial",
        inventedContentAvoided: true,
      },
    };
  }
}

function extractOutputText(data: {
  output_text?: string;
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
}): string {
  if (data.output_text) return data.output_text;
  if (!data.output) return "";
  const parts: string[] = [];
  for (const item of data.output) {
    if (item.type === "message" && item.content) {
      for (const block of item.content) {
        if (block.type === "output_text" && block.text) parts.push(block.text);
      }
    }
  }
  return parts.join("\n");
}

let activeProvider: VisionExtractionProvider | null = null;

/** Test/harness override — only honored when provider mode is test_mock (or explicit test set). */
export function setVisionProviderForTests(provider: VisionExtractionProvider | null): void {
  activeProvider = provider;
}

/** Disabled vision — preserves original; honest blocked coverage. */
export class DisabledVisionProvider implements VisionExtractionProvider {
  readonly name = "disabled-vision";
  async analyze(): Promise<VisionProviderResult> {
    recordVisionProviderCall();
    return {
      ok: false,
      provider: this.name,
      model: "none",
      processVersion: VISION_PROCESS_VERSION,
      promptVersion: visionPromptVersion(),
      timestamp: new Date().toISOString(),
      error: "vision_disabled",
      limitation:
        "Vision provider mode is disabled — original preserved; vision coverage unavailable/blocked. No fabricated text.",
    };
  }
}

export function getVisionProvider(): VisionExtractionProvider {
  const mode = resolveProviderMode();
  // Explicit test harness override is a designated test run — never auto-install mocks otherwise.
  if (activeProvider) return activeProvider;
  if (mode === "disabled") return new DisabledVisionProvider();
  if (mode === "test_mock") {
    if (!allowMockProviders(mode)) {
      throw new Error(
        "Mock vision provider refused: test_mock mode requires APEXOS_ALLOW_TEST_MOCK=1 or setProviderModeForTests."
      );
    }
    return new MockVisionProvider("ok");
  }
  // live — never silent mock when credential/flag absent
  return new OpenAiVisionProvider();
}
