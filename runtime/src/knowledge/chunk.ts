import type { RetrievalUnitDraft } from "./types.js";

const DEFAULT_TARGET_CHARS = 1400;
const DEFAULT_MAX_UNITS = 200;

/**
 * Split extracted text into retrieval units.
 * Units are derived — never represented as the original source.
 */
export function chunkExtractedText(
  text: string,
  opts?: { targetChars?: number; maxUnits?: number }
): RetrievalUnitDraft[] {
  const target = opts?.targetChars ?? DEFAULT_TARGET_CHARS;
  const maxUnits = opts?.maxUnits ?? DEFAULT_MAX_UNITS;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const units: RetrievalUnitDraft[] = [];
  let buffer = "";

  const flush = () => {
    const content = buffer.trim();
    if (!content) return;
    units.push({
      unitIndex: units.length,
      content,
      contentPreview: content.slice(0, 240),
    });
    buffer = "";
  };

  for (const para of paragraphs) {
    if (units.length >= maxUnits) break;
    if (!buffer) {
      buffer = para;
      continue;
    }
    if (buffer.length + 2 + para.length <= target) {
      buffer = `${buffer}\n\n${para}`;
    } else {
      flush();
      if (units.length >= maxUnits) break;
      // Oversized single paragraph — hard-split
      if (para.length > target * 1.5) {
        for (const piece of hardSplit(para, target)) {
          if (units.length >= maxUnits) break;
          units.push({
            unitIndex: units.length,
            content: piece,
            contentPreview: piece.slice(0, 240),
          });
        }
        buffer = "";
      } else {
        buffer = para;
      }
    }
  }
  if (units.length < maxUnits) flush();

  if (units.length === 0) {
    units.push({
      unitIndex: 0,
      content: normalized.slice(0, target),
      contentPreview: normalized.slice(0, 240),
    });
  }

  return units;
}

function hardSplit(text: string, target: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += target) {
    parts.push(text.slice(i, i + target));
  }
  return parts;
}
