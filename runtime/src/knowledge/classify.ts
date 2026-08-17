import { basename, extname } from "node:path";
import { detectMaterialBlockers } from "./detect.js";
import { contentHash } from "./content-hash.js";
import {
  classifySourceType,
  defaultHandlingPath,
  extractionSupport,
  guessMimeType,
} from "./mime.js";
import type { HandlingPath, ImportManifestItem } from "./types.js";

export interface ClassifiedItem {
  relativePath: string;
  absolutePath?: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  contentHash: string;
  sourceType: string;
  handlingPath: HandlingPath;
  classificationReason: string;
  expectedLimitation?: string;
  extractionSupport: ReturnType<typeof extractionSupport>;
  encrypted: boolean;
  corrupt: boolean;
  excluded?: boolean;
  exclusionRule?: string;
  pathRejected?: boolean;
}

/**
 * Classify a file for governed import — path + why.
 * Does not write to ApexOS.
 */
export function classifyFile(input: {
  relativePath: string;
  absolutePath?: string;
  filename?: string;
  bytes: Buffer;
  mimeType?: string;
}): ClassifiedItem {
  const filename = input.filename ?? basename(input.relativePath);
  const mimeType = guessMimeType(filename, input.mimeType);
  const sourceType = classifySourceType(filename, mimeType);
  const hash = contentHash(input.bytes);
  const support = extractionSupport(filename);
  const blockers = detectMaterialBlockers(filename, input.bytes);

  let handlingPath = defaultHandlingPath(filename);
  let classificationReason = "";
  let expectedLimitation: string | undefined;

  if (blockers.encrypted) {
    handlingPath = "preserve_only_encrypted";
    classificationReason =
      "Encrypted content detected; preserve original privately; extraction blocked.";
    expectedLimitation = blockers.detail ?? "extraction blocked—encrypted";
  } else if (blockers.corrupt) {
    handlingPath = "preserve_only_corrupt";
    classificationReason =
      "File appears corrupt or unreadable; preserve original when safe; no invented extraction.";
    expectedLimitation = blockers.detail ?? "unreadable/corrupt";
  } else if (support === "legacy_office") {
    handlingPath = "preserve_only_legacy_office";
    classificationReason = `Legacy Office binary (${extname(filename)}) — preserve-only/deferred unless separately proven supported. MIME allowlist is not extraction support.`;
    expectedLimitation =
      "Legacy .doc/.xls/.ppt extraction not supported in Build 19 unless separately proven; original preserved.";
  } else if (support === "mailbox") {
    handlingPath = "deferred_mailbox_container";
    classificationReason =
      "Mailbox container (.pst/.ost) is outside Build 19; inventory and defer — do not treat as a single message.";
    expectedLimitation = "Deferred mailbox container — outside Build 19.";
  } else if (support === "extractable") {
    handlingPath = "extractable_native";
    classificationReason = "Native UTF-8 text format with Build 18 extraction support.";
  } else if (support === "native_office") {
    handlingPath = "extractable_native";
    classificationReason =
      extname(filename).toLowerCase() === ".pdf"
        ? "PDF native-first governed extraction (Build 19 Checkpoint D); vision only for text-missing pages."
        : `Native Office extractor path (${extname(filename)}) — Build 19 Checkpoint C.`;
  } else if (support === "vision_image") {
    handlingPath = "vision_assisted";
    classificationReason =
      "Raster image/diagram — governed vision-derived transcription and separate visual description (Checkpoint D).";
    expectedLimitation =
      "Vision derivatives are not the original; visual description is not an interpretation of meaning.";
  } else if (support === "email_message") {
    handlingPath = "email_message";
    classificationReason =
      extname(filename).toLowerCase() === ".msg"
        ? "Individual .msg message — controlled msgreader extraction; attachments as child sources (Checkpoint E)."
        : "Individual .eml message — deterministic RFC 822/MIME extraction; attachments as child sources (Checkpoint E).";
    expectedLimitation =
      "Email parsing creates no finding/authority; remote URLs are not fetched; attachment content is separate.";
  } else if (support === "deferred") {
    classificationReason =
      "Format recognized for future extraction; preserve original; extraction deferred in this checkpoint.";
    expectedLimitation = `Text extraction for ${mimeType} deferred pending Build 19 format extractors.`;
  } else {
    handlingPath = "preserve_only_unsupported";
    classificationReason =
      "Unsupported extension for extraction; preserve original privately when technically safe; not retrieval-ready.";
    expectedLimitation = `Unsupported extraction type (${mimeType}); original preserved when storage accepts it.`;
  }

  return {
    relativePath: input.relativePath.replace(/\\/g, "/"),
    absolutePath: input.absolutePath,
    filename,
    mimeType,
    byteSize: input.bytes.length,
    contentHash: hash,
    sourceType,
    handlingPath,
    classificationReason,
    expectedLimitation,
    extractionSupport: support,
    encrypted: blockers.encrypted,
    corrupt: blockers.corrupt,
  };
}

export function toManifestItem(
  classified: ClassifiedItem,
  duplicateStatus: ImportManifestItem["duplicateStatus"] = "new"
): ImportManifestItem {
  return {
    relativePath: classified.relativePath,
    filename: classified.filename,
    mimeType: classified.mimeType,
    byteSize: classified.byteSize,
    contentHash: classified.contentHash,
    handlingPath: classified.handlingPath,
    classificationReason: classified.classificationReason,
    duplicateStatus,
    expectedLimitation: classified.expectedLimitation,
  };
}
