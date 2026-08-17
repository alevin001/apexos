import { createHash } from "node:crypto";
import type { DerivedExtractionDraft, EmailMetadata, ExtractionResult } from "../types.js";
import { SOURCE_CARD_INPUT_CHAR_LIMIT } from "./versions.js";

const ALLOWED_KINDS = new Set([
  "native_text",
  "deterministic_parser",
  "vision_transcription",
  "email_headers",
  "email_plain_text",
  "email_html_derived_text",
  "email_quoted",
  "provided_text",
]);

/** Never card input */
const FORBIDDEN_KINDS = new Set([
  "vision_visual_description",
  "source_card",
  "email_html", // raw HTML kept out; use html_derived_text
  "email_attachment_manifest", // metadata only via structured note
]);

export interface CardInputSegment {
  representationKind: string;
  method: string;
  processVersion: string;
  extractionExternalIdHint?: string;
  locatorLabels: string[];
  charCount: number;
  text: string;
}

export interface CardInputManifest {
  sourceType: string;
  formatLabel: string;
  coverageStatus: "full" | "partial";
  included: CardInputSegment[];
  omitted: Array<{ reason: string; detail: string }>;
  selectionLimitChars: number;
  truncated: boolean;
  attachmentMetadataNote?: string;
  emailMetadataNote?: string;
  pageCoverageNote?: string;
}

export function buildSourceCardInput(input: {
  sourceType: string;
  filename: string;
  extraction: ExtractionResult;
  isAttachmentChild?: boolean;
  attachmentCount?: number;
}): {
  usable: boolean;
  unavailableReason?: string;
  manifest: CardInputManifest;
  providerText: string;
  metadataNote: string;
  manifestHash: string;
} {
  const formatLabel = input.filename.includes(".")
    ? input.filename.split(".").pop()!.toLowerCase()
    : input.sourceType;

  const omitted: CardInputManifest["omitted"] = [];
  const included: CardInputSegment[] = [];

  if (
    ["blocked_corrupt", "blocked_encrypted", "preserve_only", "unsupported", "deferred", "failed"].includes(
      input.extraction.status
    ) &&
    !(input.extraction.derivatives?.length || input.extraction.units?.length)
  ) {
    return {
      usable: false,
      unavailableReason: "source card unavailable—no usable extraction.",
      manifest: {
        sourceType: input.sourceType,
        formatLabel,
        coverageStatus: "partial",
        included: [],
        omitted: [
          {
            reason: "no_usable_extraction",
            detail: input.extraction.limitation ?? input.extraction.status,
          },
        ],
        selectionLimitChars: SOURCE_CARD_INPUT_CHAR_LIMIT,
        truncated: false,
      },
      providerText: "",
      metadataNote: "",
      manifestHash: hashManifest({ formatLabel, included: [], omitted }),
    };
  }

  const drafts: DerivedExtractionDraft[] =
    input.extraction.derivatives && input.extraction.derivatives.length > 0
      ? input.extraction.derivatives
      : input.extraction.text
        ? [
            {
              representationKind: input.extraction.representationKind ?? "native_text",
              method: input.extraction.method,
              processVersion: input.extraction.processVersion ?? "unknown",
              text: input.extraction.text,
              units: input.extraction.units ?? [],
              createRetrievalUnits: true,
              attemptVersion: 1,
              limitation: input.extraction.limitation,
            },
          ]
        : [];

  for (const d of drafts) {
    const kind = d.representationKind;
    if (FORBIDDEN_KINDS.has(kind) || kind === "vision_visual_description") {
      omitted.push({
        reason: "forbidden_representation",
        detail: `${kind} excluded from source-card input`,
      });
      continue;
    }
    if (kind === "email_attachment_manifest") {
      // Metadata only via attachmentMetadataNote — never body input
      continue;
    }
    if (!ALLOWED_KINDS.has(kind)) {
      omitted.push({
        reason: "unsupported_representation",
        detail: kind,
      });
      continue;
    }
    if (!d.text?.trim() && !d.units?.length) continue;

    const text =
      d.text?.trim() ||
      d.units.map((u) => u.content).join("\n\n");
    included.push({
      representationKind: d.representationKind,
      method: d.method,
      processVersion: d.processVersion,
      locatorLabels: d.units.map((u) => u.locator?.label).filter((x): x is string => Boolean(x)),
      charCount: text.length,
      text,
    });
  }

  // Attachment metadata for parent email cards (not content)
  let attachmentMetadataNote: string | undefined;
  if (!input.isAttachmentChild && (input.attachmentCount ?? input.extraction.attachments?.length)) {
    const n = input.attachmentCount ?? input.extraction.attachments!.length;
    const names = (input.extraction.attachments ?? [])
      .map((a) => `${a.filename} (${a.mimeType})`)
      .join("; ");
    attachmentMetadataNote = `Attachment metadata only (not contents): count=${n}` + (names ? `; ${names}` : "");
    omitted.push({
      reason: "attachment_content_excluded",
      detail: "Parent email card must not summarize attachment contents.",
    });
  }

  // Attachment child must not include parent body — only its own extraction (already true)
  if (input.isAttachmentChild) {
    omitted.push({
      reason: "parent_email_body_excluded",
      detail: "Attachment child card does not use parent email body content.",
    });
  }

  let emailMetadataNote: string | undefined;
  const em: EmailMetadata | undefined = input.extraction.emailMetadata;
  if (em) {
    emailMetadataNote = [
      `format=${em.format}`,
      em.subject ? `subject=${em.subject}` : null,
      em.from ? `from=${em.from}` : em.unavailableFields?.includes("sender") ? "from=unavailable" : null,
      em.to?.length ? `to=${em.to.join(",")}` : null,
      em.unavailableFields?.length
        ? `unavailable_fields=${em.unavailableFields.join(",")}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
  }

  let pageCoverageNote: string | undefined;
  if (input.extraction.pageCoverage?.length) {
    pageCoverageNote = input.extraction.pageCoverage
      .map((p) => `page ${p.page}:${p.status}`)
      .join(", ");
    if (!input.extraction.pageCoverageComplete) {
      omitted.push({
        reason: "incomplete_page_coverage",
        detail: "Not all pages have confirmed extraction coverage.",
      });
    }
  }

  if (!included.length) {
    return {
      usable: false,
      unavailableReason: "source card unavailable—no usable extraction.",
      manifest: {
        sourceType: input.sourceType,
        formatLabel,
        coverageStatus: "partial",
        included: [],
        omitted,
        selectionLimitChars: SOURCE_CARD_INPUT_CHAR_LIMIT,
        truncated: false,
        attachmentMetadataNote,
        emailMetadataNote,
        pageCoverageNote,
      },
      providerText: "",
      metadataNote: [attachmentMetadataNote, emailMetadataNote, pageCoverageNote]
        .filter(Boolean)
        .join(" | "),
      manifestHash: hashManifest({ formatLabel, included: [], omitted }),
    };
  }

  // Assemble provider text with labeled segments — never unmarked merge of native+vision
  const parts: string[] = [];
  let used = 0;
  let truncated = false;
  const includedAfterLimit: CardInputSegment[] = [];
  for (const seg of included) {
    const header = `[${seg.representationKind} | method=${seg.method} | locators=${
      seg.locatorLabels.join("; ") || "n/a"
    }]`;
    const budget = SOURCE_CARD_INPUT_CHAR_LIMIT - used - header.length - 2;
    if (budget <= 80) {
      truncated = true;
      omitted.push({
        reason: "input_char_limit",
        detail: `Omitted remaining segment ${seg.representationKind} due to ${SOURCE_CARD_INPUT_CHAR_LIMIT}-char bound (no silent truncation of included text).`,
      });
      continue;
    }
    const slice = seg.text.length > budget ? seg.text.slice(0, budget) : seg.text;
    if (slice.length < seg.text.length) {
      truncated = true;
      omitted.push({
        reason: "segment_bounded",
        detail: `${seg.representationKind} limited to ${slice.length} of ${seg.text.length} chars; card is partial-coverage.`,
      });
    }
    parts.push(`${header}\n${slice}`);
    used += header.length + slice.length + 2;
    includedAfterLimit.push({
      ...seg,
      text: slice,
      charCount: slice.length,
    });
  }

  const coverageStatus: "full" | "partial" =
    truncated ||
    omitted.some((o) =>
      ["incomplete_page_coverage", "segment_bounded", "input_char_limit", "attachment_content_excluded"].includes(
        o.reason
      )
    ) ||
    input.extraction.pageCoverageComplete === false
      ? "partial"
      : "full";

  const manifest: CardInputManifest = {
    sourceType: input.sourceType,
    formatLabel,
    coverageStatus,
    included: includedAfterLimit.map(({ text: _t, ...rest }) => ({ ...rest, text: "" })), // persist without full text dup
    omitted,
    selectionLimitChars: SOURCE_CARD_INPUT_CHAR_LIMIT,
    truncated,
    attachmentMetadataNote,
    emailMetadataNote,
    pageCoverageNote,
  };

  // Hash includes actual text lengths + kinds for idempotence
  const manifestHash = hashManifest({
    formatLabel,
    coverageStatus,
    segments: includedAfterLimit.map((s) => ({
      kind: s.representationKind,
      method: s.method,
      processVersion: s.processVersion,
      locators: s.locatorLabels,
      textHash: createHash("sha256").update(s.text).digest("hex"),
    })),
    omitted,
    attachmentMetadataNote,
    emailMetadataNote,
    limit: SOURCE_CARD_INPUT_CHAR_LIMIT,
  });

  return {
    usable: true,
    manifest: {
      ...manifest,
      included: includedAfterLimit,
    },
    providerText: parts.join("\n\n"),
    metadataNote: [attachmentMetadataNote, emailMetadataNote, pageCoverageNote]
      .filter(Boolean)
      .join(" | "),
    manifestHash,
  };
}

function hashManifest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
