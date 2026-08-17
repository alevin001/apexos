import { detectMaterialBlockers } from "./detect.js";
import {
  extractDocxNative,
  extractPdfGoverned,
  extractPptxNative,
  extractXlsxNative,
  extractImageGoverned,
  extractEml,
  extractMsg,
} from "./extractors/index.js";
import { extractionSupport, guessMimeType } from "./mime.js";
import type { ExtractionResult } from "./types.js";
import { extname } from "node:path";

const EXTRACTOR_VERSION = "build19-vision-1.0";

export function extractorVersion(): string {
  return EXTRACTOR_VERSION;
}

/**
 * Extract text/units when safely possible. Never invent content.
 * Build 19 Checkpoint D: native-first PDF + governed vision for text-missing
 * pages and raster images; Checkpoint C Office natives unchanged.
 */
export async function extractText(input: {
  filename: string;
  bytes: Buffer;
  mimeType?: string;
  providedText?: string;
  /** Test/harness: set false to skip vision for PDF pages lacking native text */
  enableVision?: boolean;
}): Promise<ExtractionResult> {
  const mimeType = guessMimeType(input.filename, input.mimeType);
  const blockers = detectMaterialBlockers(input.filename, input.bytes);
  const ext = extname(input.filename).toLowerCase();

  if (blockers.encrypted) {
    return {
      status: "blocked_encrypted",
      method: "none",
      mimeType,
      representationKind: "native_text",
      limitation: blockers.detail ?? "extraction blocked—encrypted",
    };
  }

  if (blockers.corrupt && extractionSupport(input.filename) !== "extractable") {
    const support = extractionSupport(input.filename);
    return {
      status: "blocked_corrupt",
      method: "none",
      mimeType,
      representationKind:
        support === "email_message" ? "email_plain_text" : "native_text",
      limitation: blockers.detail ?? "unreadable/corrupt",
    };
  }

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
        representationKind: "provided_text",
        processVersion: EXTRACTOR_VERSION,
        limitation:
          "Text was supplied by the host/operator. It is derived content, not a substitute claim that the original binary was transferred.",
      };
    }
  }

  const support = extractionSupport(input.filename);

  if (support === "native_office") {
    if (ext === ".pdf") {
      return extractPdfGoverned(input.bytes, { enableVision: input.enableVision });
    }
    if (ext === ".docx") return extractDocxNative(input.bytes);
    if (ext === ".xlsx") return extractXlsxNative(input.bytes);
    if (ext === ".pptx") return extractPptxNative(input.bytes);
  }

  if (support === "vision_image") {
    return extractImageGoverned(input.bytes, mimeType, { filename: input.filename });
  }

  if (support === "email_message") {
    if (ext === ".eml") return extractEml(input.bytes);
    if (ext === ".msg") return extractMsg(input.bytes);
  }

  if (support === "legacy_office") {
    return {
      status: "preserve_only",
      method: "none",
      mimeType,
      representationKind: "native_text",
      limitation:
        "Legacy .doc/.xls/.ppt — preserve-only/deferred. MIME allowlisting is not extraction support.",
    };
  }

  if (support === "mailbox") {
    return {
      status: "deferred",
      method: "none",
      mimeType,
      representationKind: "native_text",
      limitation: "Mailbox container (.pst/.ost) is outside Build 19 extraction.",
    };
  }

  if (support === "unsupported") {
    return {
      status: "preserve_only",
      method: "none",
      mimeType,
      representationKind: "native_text",
      limitation: `Unsupported extraction type (${mimeType}). Original may be preserved; not retrieval-ready.`,
    };
  }

  if (support === "deferred") {
    return {
      status: "deferred",
      method: "none",
      mimeType,
      representationKind: "native_text",
      limitation: `Original can be stored; text extraction for ${mimeType} is deferred pending a later Build 19 checkpoint.`,
    };
  }

  try {
    const text = input.bytes.toString("utf8");
    if (!text.trim()) {
      return {
        status: "failed",
        method: "utf8",
        mimeType,
        representationKind: "native_text",
        processVersion: EXTRACTOR_VERSION,
        limitation: "File appears empty after UTF-8 decode.",
      };
    }
    if (text.includes("\u0000")) {
      return {
        status: "failed",
        method: "utf8",
        mimeType,
        representationKind: "native_text",
        processVersion: EXTRACTOR_VERSION,
        limitation: "File contains null bytes and is not safe UTF-8 text.",
      };
    }
    return {
      status: "extracted",
      method: "utf8",
      text,
      mimeType,
      representationKind: "native_text",
      processVersion: EXTRACTOR_VERSION,
    };
  } catch (err) {
    return {
      status: "failed",
      method: "utf8",
      mimeType,
      representationKind: "native_text",
      processVersion: EXTRACTOR_VERSION,
      limitation: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}
