import { extname } from "node:path";

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
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** MIME types accepted into knowledge-source-material storage. */
export const STORABLE_MIME_TYPES = new Set(Object.values(EXT_MIME));

/** Extensions with Build 18 text extraction support. */
export const EXTRACTABLE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".vtt",
  ".csv",
  ".json",
]);

/** Store original; text extraction deferred to a later build. */
export const DEFERRED_EXTRACTION_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

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
  if (mimeType.startsWith("image/")) return "image";
  if (ext === ".json") return "internal-document";
  if (ext === ".txt") return "internal-document";
  return "unknown";
}

export function isStorable(mimeType: string): boolean {
  return STORABLE_MIME_TYPES.has(mimeType);
}

export function extractionSupport(filename: string): "extractable" | "deferred" | "unsupported" {
  const ext = extname(filename).toLowerCase();
  if (EXTRACTABLE_EXTENSIONS.has(ext)) return "extractable";
  if (DEFERRED_EXTRACTION_EXTENSIONS.has(ext)) return "deferred";
  return "unsupported";
}
