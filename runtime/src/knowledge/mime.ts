import { extname } from "node:path";
import type { HandlingPath } from "./types.js";

const EXT_MIME: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".vtt": "text/vtt",
  ".csv": "text/csv",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".eml": "message/rfc822",
  ".msg": "application/vnd.ms-outlook",
  ".pst": "application/vnd.ms-outlook-pst",
  ".ost": "application/vnd.ms-outlook-ost",
};

/** MIME types accepted into knowledge-source-material storage (including preserve-only). */
export const STORABLE_MIME_TYPES = new Set([
  ...Object.values(EXT_MIME),
  "application/octet-stream",
]);

/** UTF-8 text formats (Build 18). */
export const EXTRACTABLE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".vtt",
  ".csv",
  ".json",
]);

/** Build 19 Checkpoint C — native structured extractors. */
export const NATIVE_OFFICE_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".pptx"]);

/** Raster images/diagrams — Build 19 Checkpoint D governed vision path. */
export const VISION_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/** Individual email messages — Build 19 Checkpoint E. */
export const EMAIL_MESSAGE_EXTENSIONS = new Set([".eml", ".msg"]);

/**
 * Formats still deferred or awaiting later checkpoints.
 * Does NOT include legacy .doc/.xls/.ppt — those are preserve-only.
 * Images use vision_assisted; .eml/.msg use email_message.
 */
export const DEFERRED_EXTRACTION_EXTENSIONS = new Set<string>([]);

/** Legacy Office binary formats — preserve-only / deferred extraction; not "supported". */
export const LEGACY_OFFICE_EXTENSIONS = new Set([".doc", ".xls", ".ppt"]);

/** Mailbox containers — explicitly outside Build 19 extraction. */
export const MAILBOX_CONTAINER_EXTENSIONS = new Set([".pst", ".ost"]);

export function guessMimeType(filename: string, provided?: string): string {
  if (provided && provided !== "application/octet-stream") return provided;
  const ext = extname(filename).toLowerCase();
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export function classifySourceType(filename: string, mimeType: string): string {
  const ext = extname(filename).toLowerCase();
  if (ext === ".vtt" || mimeType === "text/vtt") return "transcript";
  if (ext === ".pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === ".md" || ext === ".markdown" || mimeType === "text/markdown") return "internal-document";
  if (ext === ".docx" || ext === ".doc") return "internal-document";
  if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") return "spreadsheet";
  if (ext === ".pptx" || ext === ".ppt") return "presentation";
  if (ext === ".eml" || ext === ".msg" || mimeType === "message/rfc822") return "email";
  if (ext === ".pst" || ext === ".ost") return "mailbox-container";
  if (mimeType.startsWith("image/")) return "image";
  if (ext === ".json") return "internal-document";
  if (ext === ".txt") return "internal-document";
  return "unknown";
}

export function isStorable(mimeType: string): boolean {
  return STORABLE_MIME_TYPES.has(mimeType);
}

export function extractionSupport(
  filename: string
):
  | "extractable"
  | "native_office"
  | "vision_image"
  | "email_message"
  | "deferred"
  | "legacy_office"
  | "mailbox"
  | "unsupported" {
  const ext = extname(filename).toLowerCase();
  if (EXTRACTABLE_EXTENSIONS.has(ext)) return "extractable";
  if (NATIVE_OFFICE_EXTENSIONS.has(ext)) return "native_office";
  if (VISION_IMAGE_EXTENSIONS.has(ext)) return "vision_image";
  if (EMAIL_MESSAGE_EXTENSIONS.has(ext)) return "email_message";
  if (LEGACY_OFFICE_EXTENSIONS.has(ext)) return "legacy_office";
  if (MAILBOX_CONTAINER_EXTENSIONS.has(ext)) return "mailbox";
  if (DEFERRED_EXTRACTION_EXTENSIONS.has(ext)) return "deferred";
  return "unsupported";
}

export function defaultHandlingPath(filename: string): HandlingPath {
  const support = extractionSupport(filename);
  switch (support) {
    case "extractable":
    case "native_office":
      return "extractable_native";
    case "vision_image":
      return "vision_assisted";
    case "email_message":
      return "email_message";
    case "legacy_office":
      return "preserve_only_legacy_office";
    case "mailbox":
      return "deferred_mailbox_container";
    case "deferred":
      return "deferred_extraction";
    default:
      return "preserve_only_unsupported";
  }
}
