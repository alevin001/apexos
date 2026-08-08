import { getSupabase } from "../shared/supabase.js";
import { relevanceScore } from "../pipeline/capture/cold-start-extractor.js";
import type { RetrievedKnowledgeUnit } from "./types.js";

const MAX_UNITS = 6;
const MIN_SCORE = 0.15;
const PRIMARY_BAND = 0.9;
const KEEP_SUBORDINATE_BAND = 0.35;

/** Extension-only tokens create false ties across every .txt/.md source. */
const LOW_VALUE_EXTENSION_TOKENS = new Set([
  "txt",
  "md",
  "pdf",
  "doc",
  "docx",
  "csv",
  "json",
  "vtt",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

export type RankedKnowledgeUnit = RetrievedKnowledgeUnit & {
  rankRole: "primary" | "subordinate";
};

/**
 * Retrieve relevant knowledge units. Relevance ≠ authority.
 * Filename and distinctive content matches outrank weak generic/extension overlaps.
 */
export async function retrieveKnowledgeUnits(
  query: string,
  opts?: { limit?: number }
): Promise<RankedKnowledgeUnit[]> {
  const limit = opts?.limit ?? MAX_UNITS;
  const supabase = getSupabase();

  const { data: sources, error: sourceErr } = await supabase
    .from("knowledge_sources")
    .select(
      "id, external_id, title, original_filename, source_type, authority_classification, extraction_status, retrieval_ready, status"
    )
    .eq("retrieval_ready", true)
    .in("status", ["active", "draft"])
    .limit(80);

  if (sourceErr || !sources?.length) return [];

  const sourceIds = sources.map((s) => s.id);
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const { data: units, error: unitErr } = await supabase
    .from("knowledge_retrieval_units")
    .select(
      "id, external_id, knowledge_source_id, content, content_preview, unit_index, epistemic_type, status"
    )
    .in("knowledge_source_id", sourceIds)
    .eq("status", "active")
    .limit(200);

  if (unitErr || !units?.length) return [];

  const scored = units
    .map((unit) => {
      const source = sourceById.get(unit.knowledge_source_id);
      if (!source) return null;
      const originalFilename =
        (source.original_filename as string | null | undefined) ?? undefined;
      const displayTitle = originalFilename || (source.title as string);
      const haystack = [
        source.title,
        originalFilename,
        unit.content_preview ?? "",
        unit.content,
      ]
        .filter(Boolean)
        .join(" ");

      const base = relevanceScore(query, haystack);
      const fileBoost = filenameBoost(query, source.title as string, originalFilename);
      const contentBoost = contentPhraseBoost(query, unit.content);
      const distinctive = distinctiveBoost(query, haystack);
      // Extension-only overlap must not dominate when a real filename/content match exists elsewhere.
      const score = Math.min(
        1,
        Math.max(base + fileBoost + contentBoost + distinctive - extensionOnlyPenalty(query, haystack, fileBoost), 0)
      );

      if (score < MIN_SCORE && fileBoost <= 0 && contentBoost <= 0 && distinctive <= 0) {
        return null;
      }

      const result: RetrievedKnowledgeUnit = {
        id: unit.id,
        externalId: unit.external_id,
        sourceId: source.id,
        sourceExternalId: source.external_id,
        sourceTitle: displayTitle,
        sourceType: source.source_type,
        authorityClassification: source.authority_classification,
        extractionStatus: source.extraction_status,
        content: unit.content,
        contentPreview: unit.content_preview ?? unit.content.slice(0, 240),
        whyRetrieved: "",
        transformationNote:
          "Excerpt is from extracted/chunked text derived from the original source — not the original file itself.",
        score,
        epistemicType: "source_evidence",
      };
      return result;
    })
    .filter((x): x is RetrievedKnowledgeUnit => Boolean(x))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const topScore = scored[0].score;
  const ranked: RankedKnowledgeUnit[] = [];

  for (const unit of scored) {
    if (ranked.length >= limit) break;
    const rankRole: "primary" | "subordinate" =
      unit.score >= topScore * PRIMARY_BAND ? "primary" : "subordinate";
    if (rankRole === "subordinate" && unit.score < topScore * KEEP_SUBORDINATE_BAND) {
      continue;
    }
    ranked.push({
      ...unit,
      rankRole,
      whyRetrieved:
        rankRole === "primary"
          ? `Matched query terms against source “${unit.sourceTitle}” (relevance score ${unit.score.toFixed(2)}). Primary match for this query. Relevance is not authority.`
          : `Matched query terms against source “${unit.sourceTitle}” (relevance score ${unit.score.toFixed(2)}). Subordinate match — lower relevance than the primary source; do not let it distort the answer. Relevance is not authority.`,
    });
  }

  return ranked;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strong boost when the query names this source file (basename or full filename). */
export function filenameBoost(
  query: string,
  title: string,
  originalFilename?: string | null
): number {
  const q = query.toLowerCase();
  const candidates = [originalFilename, title].filter((v): v is string => Boolean(v));
  let boost = 0;

  for (const raw of candidates) {
    const name = raw.toLowerCase().trim();
    if (!name) continue;
    const basename = name.replace(/\.[a-z0-9]+$/i, "");

    if (name.includes(".") && q.includes(name)) {
      boost = Math.max(boost, 0.75);
    }
    if (basename.length >= 2) {
      const fullWithCommonExt = [`${basename}.txt`, `${basename}.md`, name];
      for (const form of fullWithCommonExt) {
        if (q.includes(form.toLowerCase())) boost = Math.max(boost, 0.75);
      }
      if (new RegExp(`\\b${escapeRegExp(basename)}\\.(txt|md|pdf|docx?)\\b`, "i").test(query)) {
        boost = Math.max(boost, 0.75);
      }
      if (new RegExp(`\\b${escapeRegExp(basename)}\\b`, "i").test(query) && basename.length >= 3) {
        boost = Math.max(boost, 0.45);
      }
    }
  }
  return Math.min(0.8, boost);
}

/** Boost when the query includes distinctive content from the unit (e.g. HELLO). */
export function contentPhraseBoost(query: string, content: string): number {
  const q = query.toLowerCase();
  const text = content.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
  if (!text) return 0;

  // Short sources: whole content (minus punctuation) as a phrase
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length >= 3 && compact.length <= 40 && q.includes(compact)) {
    return 0.7;
  }

  const tokens = compact.split(/\s+/).filter((t) => t.length >= 3 && !LOW_VALUE_EXTENSION_TOKENS.has(t));
  let hits = 0;
  for (const t of tokens) {
    if (new RegExp(`\\b${escapeRegExp(t)}\\b`, "i").test(query)) hits += 1;
  }
  if (hits === 0) return 0;
  if (tokens.length <= 3 && hits === tokens.length) return 0.65;
  return Math.min(0.5, hits * 0.25);
}

function distinctiveBoost(query: string, candidate: string): number {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  let boost = 0;
  const distinctive = q.match(/[a-z0-9][a-z0-9-]{10,}/g) ?? [];
  for (const token of distinctive) {
    if (c.includes(token)) boost += 0.45;
  }
  return Math.min(0.7, boost);
}

/**
 * When the query only overlaps a file extension (e.g. ".txt") and there is no
 * filename/content boost, lightly penalize so extension ties do not bury the real source.
 */
function extensionOnlyPenalty(query: string, haystack: string, fileBoost: number): number {
  if (fileBoost > 0) return 0;
  const qTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  const meaningful = qTokens.filter((t) => !LOW_VALUE_EXTENSION_TOKENS.has(t));
  const extHits = qTokens.filter(
    (t) => LOW_VALUE_EXTENSION_TOKENS.has(t) && haystack.toLowerCase().includes(t)
  );
  if (extHits.length > 0 && meaningful.every((t) => !haystack.toLowerCase().includes(t))) {
    return 0.15;
  }
  return 0;
}
