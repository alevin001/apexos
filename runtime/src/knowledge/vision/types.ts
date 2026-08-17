export { VISION_PROCESS_VERSION, VISION_PROMPT_VERSION } from "./versions.js";

export type {
  PageCoverageEntry,
  DerivedExtractionDraft,
} from "../types.js";

export interface VisionProviderRequest {
  kind: "transcription" | "visual_description";
  imageBytes: Buffer;
  mimeType: string;
  locatorLabel: string;
  /** Extra instruction context (never treated as authority) */
  contextNote?: string;
}

export interface VisionProviderResult {
  ok: boolean;
  text?: string;
  provider: string;
  model: string;
  processVersion: string;
  promptVersion: string;
  responseId?: string;
  timestamp: string;
  limitation?: string;
  error?: string;
  /** Normalized structured output for audit — not conversational memory */
  normalized?: {
    kind: "transcription" | "visual_description";
    locatorLabel: string;
    text: string;
    unreadableRegionsNoted?: boolean;
    inventedContentAvoided: true;
  };
}

export interface VisionExtractionProvider {
  readonly name: string;
  analyze(request: VisionProviderRequest): Promise<VisionProviderResult>;
}
