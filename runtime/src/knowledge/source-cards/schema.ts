import { SOURCE_CARD_WITHHELD } from "./versions.js";

export interface SourceCardProviderOutput {
  withheld: boolean;
  catalogSummary: string;
  documentType: string;
  apparentPurpose: string;
  retrievalCues: string[];
  materialLimitations: string;
}

const FORBIDDEN =
  /\b(recommend|should|must act|authority|authoritative|proven|therefore ApexOS|confidence|risk rating|priority:\s*high|learning update|decision:)\b/i;

/**
 * Validate structured source-card output before it becomes searchable.
 */
export function validateSourceCardOutput(
  raw: unknown
): { ok: true; value: SourceCardProviderOutput } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "not_object" };
  }
  const o = raw as Record<string, unknown>;
  const withheld = Boolean(o.withheld);
  const catalogSummary = String(o.catalogSummary ?? o.summary ?? "").trim();
  const documentType = String(o.documentType ?? "").trim();
  const apparentPurpose = String(o.apparentPurpose ?? "").trim();
  const materialLimitations = String(o.materialLimitations ?? "").trim();
  const cuesRaw = o.retrievalCues ?? o.tags ?? [];
  const retrievalCues = Array.isArray(cuesRaw)
    ? cuesRaw.map((c) => String(c).trim()).filter(Boolean).slice(0, 12)
    : [];

  if (withheld || catalogSummary === SOURCE_CARD_WITHHELD) {
    return {
      ok: true,
      value: {
        withheld: true,
        catalogSummary: SOURCE_CARD_WITHHELD,
        documentType: documentType || "unknown",
        apparentPurpose: "",
        retrievalCues: [],
        materialLimitations:
          materialLimitations || "Insufficient grounded extraction for a neutral catalog card.",
      },
    };
  }

  if (!catalogSummary || catalogSummary.length < 12) {
    return { ok: false, reason: "summary_too_short" };
  }
  if (catalogSummary.length > 600) {
    return { ok: false, reason: "summary_too_long" };
  }
  if (!documentType) {
    return { ok: false, reason: "missing_document_type" };
  }
  if (FORBIDDEN.test(catalogSummary) || FORBIDDEN.test(apparentPurpose)) {
    return { ok: false, reason: "forbidden_language" };
  }
  for (const c of retrievalCues) {
    if (FORBIDDEN.test(c) || /^(high|critical|authoritative)$/i.test(c)) {
      return { ok: false, reason: "forbidden_cue" };
    }
  }

  return {
    ok: true,
    value: {
      withheld: false,
      catalogSummary,
      documentType,
      apparentPurpose,
      retrievalCues,
      materialLimitations:
        materialLimitations ||
        "Derived catalog card — not evidence; not a finding; relevance is not authority.",
    },
  };
}

export function parseProviderJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // try to extract first {...}
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(body.slice(start, end + 1));
    }
    throw new Error("Source-card provider output was not valid JSON");
  }
}
