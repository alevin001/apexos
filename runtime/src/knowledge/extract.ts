import { extractionSupport, guessMimeType } from "./mime.js";
import type { ExtractionResult } from "./types.js";

const EXTRACTOR_VERSION = "build18-1.0";

export function extractorVersion(): string {
  return EXTRACTOR_VERSION;
}

/**
 * Extract text when safely possible. Never invent content for unsupported formats.
 * Images/PDF/Office are stored as originals with deferred extraction.
 */
export function extractText(input: {
  filename: string;
  bytes: Buffer;
  mimeType?: string;
  providedText?: string;
}): ExtractionResult {
  const mimeType = guessMimeType(input.filename, input.mimeType);

  // Operator/ChatGPT-provided text is recorded as a derived extraction path,
  // distinct from the original binary when both exist.
  if (input.providedText && input.providedText.trim().length > 0) {
    const support = extractionSupport(input.filename);
    if (support === "extractable" && input.bytes.length > 0) {
      // Prefer bytes for extractable text formats when present.
    } else {
      return {
        status: "extracted",
        method: "provided_text",
        text: input.providedText,
        mimeType: "text/plain",
        limitation:
          "Text was supplied by the host/operator. It is derived content, not a substitute claim that the original binary was transferred.",
      };
    }
  }

  const support = extractionSupport(input.filename);

  if (support === "unsupported") {
    return {
      status: "unsupported",
      method: "none",
      mimeType,
      limitation: `File type is not supported for Build 18 extraction (${mimeType}).`,
    };
  }

  if (support === "deferred") {
    return {
      status: "deferred",
      method: "none",
      mimeType,
      limitation: `Original can be stored; text extraction for ${mimeType} is deferred in Build 18.`,
    };
  }

  try {
    const text = input.bytes.toString("utf8");
    if (!text.trim()) {
      return {
        status: "failed",
        method: "utf8",
        mimeType,
        limitation: "File appears empty after UTF-8 decode.",
      };
    }
    // Reject obvious binary masquerading as text
    if (text.includes("\u0000")) {
      return {
        status: "failed",
        method: "utf8",
        mimeType,
        limitation: "File contains null bytes and is not safe UTF-8 text.",
      };
    }
    return {
      status: "extracted",
      method: "utf8",
      text,
      mimeType,
    };
  } catch (err) {
    return {
      status: "failed",
      method: "utf8",
      mimeType,
      limitation: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}
