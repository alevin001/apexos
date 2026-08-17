/** Withheld when a visual description is not objectively grounded. */
export const VISUAL_DESCRIPTION_WITHHELD =
  "visual description withheld—insufficient grounded detail";

const SPECULATIVE =
  /\b(indicating|indicates|suggests?|implies?|means?|meaning|represents?|symbolizes?|therefore|because|purpose|intent|relationship|connected to|flow of|from .+ to .+ indicating)\b/i;

const UNSUPPORTED_STRUCTURE =
  /\b(two labeled boxes|box a|box b|boxes?:|flowchart|diagram shows that|hierarchy)\b/i;

/**
 * Accept only short, non-interpretive visual descriptions.
 * Reject embellished / relational / unsupported layout claims.
 */
export function groundVisualDescription(
  text: string,
  opts?: { transcriptionText?: string }
): { ok: true; text: string } | { ok: false; text: typeof VISUAL_DESCRIPTION_WITHHELD; reason: string } {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "empty" };
  }
  if (trimmed.length > 600) {
    return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "too_long" };
  }
  if (SPECULATIVE.test(trimmed) || UNSUPPORTED_STRUCTURE.test(trimmed)) {
    return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "speculative_or_unsupported" };
  }

  // If transcription is available, reject claims of shapes not evidenced by visible text content
  // unless the description stays within generic placement vocabulary.
  const genericOnly =
    /^(the image|visible|text|lines?|labels?|words?|left|right|top|bottom|center|vertical|horizontal|arrangement|elements?|arrow|arrows|whitespace|background|foreground)/i;
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 4) {
    return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "too_many_sentences" };
  }

  if (opts?.transcriptionText) {
    const trans = opts.transcriptionText.toLowerCase();
    const mentionsBox = /\bbox(es)?\b/i.test(trimmed);
    if (mentionsBox && !/\bbox\b/i.test(trans)) {
      return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "unsupported_box_claim" };
    }
  }

  // Prefer descriptions that start grounded; otherwise require no speculative markers (already checked)
  if (!genericOnly.test(trimmed) && /[.]/.test(trimmed) === false && trimmed.split(" ").length > 40) {
    return { ok: false, text: VISUAL_DESCRIPTION_WITHHELD, reason: "ungrounded_dense" };
  }

  return { ok: true, text: trimmed };
}
