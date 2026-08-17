import { SOURCE_CARD_PROMPT_VERSION } from "./versions.js";

export function sourceCardPromptVersion(): string {
  return SOURCE_CARD_PROMPT_VERSION;
}

export function sourceCardInstructions(): string {
  return [
    `ApexOS governed source-card generation (${SOURCE_CARD_PROMPT_VERSION}).`,
    "You create a NEUTRAL derived catalog card only.",
    "Rules:",
    "- Describe what the source appears to contain — not what is true, important, authoritative, or advisable.",
    "- Use language like “the document describes” / “the email states” for claims in the source.",
    "- Do NOT produce findings, interpretations, recommendations, decisions, patterns, learning, confidence, risk, authority, or priority.",
    "- Do NOT invent facts beyond the provided extraction text and metadata.",
    "- Tags/cues are catalog/retrieval signals only — never authority or sentiment scores.",
    "- If grounded content is insufficient, set withheld=true and summary exactly:",
    "  source card withheld—insufficient grounded extraction",
    "Return JSON only with keys:",
    "withheld (boolean), catalogSummary (string, 1-2 sentences), documentType (string),",
    "apparentPurpose (string or empty), retrievalCues (string array), materialLimitations (string).",
  ].join("\n");
}
