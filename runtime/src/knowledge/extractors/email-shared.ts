import type { RetrievalUnitDraft, SourceLocator } from "../types.js";

export const EML_PROCESS_VERSION = "build19-email-eml-1.0";
export const MSG_PROCESS_VERSION = "build19-email-msg-1.0";

const QUOTE_MARKERS = [
  /^On .+wrote:\s*$/im,
  /^From:\s.+$/im,
  /^-{2,}Original Message-{2,}/im,
  /^>{1,}\s?/m,
];

/** Heuristic quote split — always retain full body separately. */
export function splitQuotedCorrespondence(body: string): {
  main: string;
  quoted: string | null;
  heuristic: boolean;
} {
  const text = body.replace(/\r\n/g, "\n");
  let cut = -1;
  for (const re of QUOTE_MARKERS) {
    const m = re.exec(text);
    if (m?.index != null && (cut < 0 || m.index < cut)) cut = m.index;
  }
  if (cut <= 0) return { main: text.trim(), quoted: null, heuristic: false };
  const main = text.slice(0, cut).trim();
  const quoted = text.slice(cut).trim();
  if (!quoted) return { main: text.trim(), quoted: null, heuristic: false };
  return { main, quoted, heuristic: true };
}

/** Deterministic HTML → text (no network, no script execution). */
export function htmlToTextDeterministic(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function extractHttpUrls(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return [...new Set(found.map((u) => u.replace(/[.,;]+$/, "")))];
}

export function chunkBlocks(text: string, max = 1200): string[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paras.length && text.trim()) return [text.trim()];
  const blocks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > max && buf) {
      blocks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) blocks.push(buf);
  return blocks;
}

export function unitsFromBlocks(
  blocks: string[],
  locatorBase: Omit<SourceLocator, "label"> & { labelPrefix: string }
): RetrievalUnitDraft[] {
  return blocks.map((content, i) => {
    const blockNum = i + 1;
    const label = `${locatorBase.labelPrefix}, block ${blockNum}`;
    return {
      unitIndex: i,
      content,
      contentPreview: content.slice(0, 240),
      locator: {
        kind: locatorBase.kind,
        label,
        section: locatorBase.section,
        partPath: locatorBase.partPath,
        blockIndex: blockNum,
      },
    };
  });
}

export function safeFilename(name: string | undefined, fallback: string): string {
  const raw = (name || fallback).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim();
  return raw.slice(0, 180) || fallback;
}
