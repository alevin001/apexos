import { VISION_PROMPT_VERSION } from "./versions.js";

export function visionPromptVersion(): string {
  return VISION_PROMPT_VERSION;
}

export function transcriptionInstructions(): string {
  return [
    `ApexOS governed vision transcription (${VISION_PROMPT_VERSION}).`,
    "Task: Transcribe ONLY visible text in the image.",
    "Rules:",
    "- Do not invent, guess, or complete missing words.",
    "- If a region is unreadable/obscured, write [unreadable] for that region.",
    "- Do not interpret meaning, intent, or conclusions.",
    "- Output plain text only (no markdown headings).",
    "- This output is a derived representation, not ApexOS findings or authority.",
  ].join("\n");
}

export function visualDescriptionInstructions(): string {
  return [
    `ApexOS governed vision visual description (${VISION_PROMPT_VERSION}).`,
    "Task: Describe ONLY objectively visible elements and arrangement (placement of text/lines/arrows that are literally visible).",
    "Rules:",
    "- Do NOT infer meaning, relationships, purpose, flow, hierarchy, or intent.",
    "- Do NOT invent shapes, boxes, or layout details that are not clearly visible.",
    "- Do NOT say that an arrow 'indicates' or 'connects meaning' — only that an arrow mark is visible if it is.",
    "- If you cannot produce a grounded description of visible arrangement, reply exactly:",
    "  visual description withheld—insufficient grounded detail",
    "- Keep to 1–3 short factual sentences, or the withhold line.",
    "- This derivative is never a finding and must not be used as source-card input unless separately approved.",
  ].join("\n");
}
