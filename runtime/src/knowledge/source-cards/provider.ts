import { runtimeConfig } from "../../config.js";
import {
  allowMockProviders,
  recordSourceCardProviderCall,
  resolveProviderMode,
} from "../provider-mode.js";
import { parseProviderJson, validateSourceCardOutput, type SourceCardProviderOutput } from "./schema.js";
import { sourceCardInstructions, sourceCardPromptVersion } from "./prompts.js";
import { SOURCE_CARD_PROCESS_VERSION } from "./versions.js";

export interface SourceCardProviderRequest {
  inputText: string;
  metadataNote: string;
  sourceType: string;
  formatLabel: string;
}

export interface SourceCardProviderResult {
  ok: boolean;
  output?: SourceCardProviderOutput;
  provider: string;
  model: string;
  processVersion: string;
  promptVersion: string;
  responseId?: string;
  timestamp: string;
  error?: string;
  limitation?: string;
}

export interface SourceCardProvider {
  readonly name: string;
  generate(request: SourceCardProviderRequest): Promise<SourceCardProviderResult>;
}

export class OpenAiSourceCardProvider implements SourceCardProvider {
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

  async generate(request: SourceCardProviderRequest): Promise<SourceCardProviderResult> {
    recordSourceCardProviderCall();
    const timestamp = new Date().toISOString();
    if (!this.apiKey) {
      return {
        ok: false,
        provider: this.name,
        model: this.model,
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        timestamp,
        error: "OPENAI_API_KEY not configured",
        limitation:
          "Source-card provider unavailable — honest unavailable/failed status; underlying retrieval readiness unchanged.",
      };
    }

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
          instructions: sourceCardInstructions(),
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    `Source type: ${request.sourceType}`,
                    `Format: ${request.formatLabel}`,
                    `Metadata: ${request.metadataNote}`,
                    "Confirmed extraction text (derived representations only — not original bytes):",
                    request.inputText,
                  ].join("\n"),
                },
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
          processVersion: SOURCE_CARD_PROCESS_VERSION,
          promptVersion: sourceCardPromptVersion(),
          timestamp,
          error: `OpenAI source-card HTTP ${response.status}`,
          limitation: `Source card generation failed (${response.status}). Underlying retrieval readiness is unchanged.`,
        };
      }
      const data = JSON.parse(bodyText) as {
        id?: string;
        model?: string;
        output_text?: string;
        output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
      };
      const text = extractOutputText(data).trim();
      if (!text) {
        return {
          ok: false,
          provider: this.name,
          model: data.model ?? this.model,
          processVersion: SOURCE_CARD_PROCESS_VERSION,
          promptVersion: sourceCardPromptVersion(),
          responseId: data.id,
          timestamp,
          error: "Empty source-card output",
          limitation: "Source card generation failed; underlying retrieval readiness is unchanged.",
        };
      }
      let parsed: unknown;
      try {
        parsed = parseProviderJson(text);
      } catch (err) {
        return {
          ok: false,
          provider: this.name,
          model: data.model ?? this.model,
          processVersion: SOURCE_CARD_PROCESS_VERSION,
          promptVersion: sourceCardPromptVersion(),
          responseId: data.id,
          timestamp,
          error: err instanceof Error ? err.message : String(err),
          limitation: "Source-card schema validation failed; underlying retrieval readiness is unchanged.",
        };
      }
      const validated = validateSourceCardOutput(parsed);
      if (!validated.ok) {
        return {
          ok: false,
          provider: this.name,
          model: data.model ?? this.model,
          processVersion: SOURCE_CARD_PROCESS_VERSION,
          promptVersion: sourceCardPromptVersion(),
          responseId: data.id,
          timestamp,
          error: `validation:${validated.reason}`,
          limitation: "Source-card schema validation failed; underlying retrieval readiness is unchanged.",
        };
      }
      return {
        ok: true,
        output: validated.value,
        provider: this.name,
        model: data.model ?? this.model,
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        responseId: data.id,
        timestamp,
      };
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        provider: this.name,
        model: this.model,
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        timestamp,
        error: err instanceof Error ? err.message : String(err),
        limitation: aborted
          ? "Source-card provider timed out; underlying retrieval readiness is unchanged."
          : "Source card generation failed; underlying retrieval readiness is unchanged.",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class MockSourceCardProvider implements SourceCardProvider {
  readonly name = "mock-source-card";
  constructor(
    private readonly behavior: "ok" | "fail" | "timeout" | "withheld" | "invalid" = "ok",
    private readonly scripted?: Partial<SourceCardProviderOutput>
  ) {}

  async generate(request: SourceCardProviderRequest): Promise<SourceCardProviderResult> {
    recordSourceCardProviderCall();
    const timestamp = new Date().toISOString();
    if (this.behavior === "fail") {
      return {
        ok: false,
        provider: this.name,
        model: "mock",
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        timestamp,
        error: "mock failure",
        limitation: "Source card generation failed; underlying retrieval readiness is unchanged.",
      };
    }
    if (this.behavior === "timeout") {
      return {
        ok: false,
        provider: this.name,
        model: "mock",
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        timestamp,
        error: "timeout",
        limitation: "Source-card provider timed out; underlying retrieval readiness is unchanged.",
      };
    }
    if (this.behavior === "invalid") {
      return {
        ok: false,
        provider: this.name,
        model: "mock",
        processVersion: SOURCE_CARD_PROCESS_VERSION,
        promptVersion: sourceCardPromptVersion(),
        timestamp,
        error: "validation:forbidden_language",
        limitation: "Source-card schema validation failed; underlying retrieval readiness is unchanged.",
      };
    }
    const output: SourceCardProviderOutput =
      this.behavior === "withheld"
        ? {
            withheld: true,
            catalogSummary: "source card withheld—insufficient grounded extraction",
            documentType: request.formatLabel,
            apparentPurpose: "",
            retrievalCues: [],
            materialLimitations: "Insufficient grounded extraction.",
          }
        : {
            withheld: false,
            catalogSummary:
              this.scripted?.catalogSummary ??
              `The ${request.formatLabel} source describes controlled synthetic content for ApexOS catalog testing.`,
            documentType: this.scripted?.documentType ?? request.sourceType,
            apparentPurpose:
              this.scripted?.apparentPurpose ??
              "Appears to be a synthetic fixture for governed ingestion tests.",
            retrievalCues: this.scripted?.retrievalCues ?? [
              "synthetic",
              "build19",
              "catalog",
              request.formatLabel,
            ],
            materialLimitations:
              this.scripted?.materialLimitations ??
              "Derived catalog card from confirmed extraction only — not evidence.",
          };
    return {
      ok: true,
      output,
      provider: this.name,
      model: "mock",
      processVersion: SOURCE_CARD_PROCESS_VERSION,
      promptVersion: sourceCardPromptVersion(),
      responseId: `mock-card-${Date.now()}`,
      timestamp,
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

let activeProvider: SourceCardProvider | null = null;

export function setSourceCardProviderForTests(provider: SourceCardProvider | null): void {
  activeProvider = provider;
}

/** Disabled cards — unavailable status; never fabricate catalog text. */
export class DisabledSourceCardProvider implements SourceCardProvider {
  readonly name = "disabled-source-card";
  async generate(): Promise<SourceCardProviderResult> {
    recordSourceCardProviderCall();
    return {
      ok: false,
      provider: this.name,
      model: "none",
      processVersion: SOURCE_CARD_PROCESS_VERSION,
      promptVersion: sourceCardPromptVersion(),
      timestamp: new Date().toISOString(),
      error: "source_card_disabled",
      limitation:
        "Source-card provider mode is disabled — card unavailable; underlying retrieval readiness unchanged.",
    };
  }
}

export function getSourceCardProvider(): SourceCardProvider {
  const mode = resolveProviderMode();
  // Explicit test harness override is a designated test run — never auto-install mocks otherwise.
  if (activeProvider) return activeProvider;
  if (mode === "disabled") return new DisabledSourceCardProvider();
  if (mode === "test_mock") {
    if (!allowMockProviders(mode)) {
      throw new Error(
        "Mock source-card provider refused: test_mock mode requires APEXOS_ALLOW_TEST_MOCK=1 or setProviderModeForTests."
      );
    }
    return new MockSourceCardProvider("ok");
  }
  // live — never silent mock when credential/flag absent
  return new OpenAiSourceCardProvider();
}
