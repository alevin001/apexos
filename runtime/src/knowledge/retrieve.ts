import { getSupabase } from "../shared/supabase.js";
import { relevanceScore } from "../pipeline/capture/cold-start-extractor.js";
import { resolveParentEmailsForChild } from "./attachment-lineage.js";
import { authorityDisplayFor } from "./receipt.js";
import type { AuthorityClassification, RetrievedKnowledgeUnit, SourceLocator } from "./types.js";

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
 * Source cards may nominate candidates only; final results are always underlying units.
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
      "id, external_id, title, original_filename, source_type, authority_classification, extraction_status, retrieval_ready, status, handling_path, content_hash"
    )
    .eq("retrieval_ready", true)
    .in("status", ["active", "draft"])
    .limit(80);

  if (sourceErr || !sources?.length) return [];

  const sourceIds = sources.map((s) => s.id);
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  /** Card nomination: catalog match → source id (never returned as evidence alone) */
  const cardNomination = new Map<
    string,
    { cardExternalId: string; why: string; score: number }
  >();
  const { data: cards } = await supabase
    .from("knowledge_source_cards")
    .select(
      "id, external_id, knowledge_source_id, catalog_summary, description, retrieval_cues, searchable, status, content_hash_of_original"
    )
    .eq("searchable", true)
    .in("knowledge_source_id", sourceIds)
    .limit(80);
  for (const card of cards ?? []) {
    const hay = [
      card.catalog_summary,
      card.description,
      ...(Array.isArray(card.retrieval_cues) ? card.retrieval_cues : []),
    ]
      .filter(Boolean)
      .join(" ");
    const score = relevanceScore(query, hay) + contentPhraseBoost(query, hay);
    if (score < 0.2) continue;
    const sid = card.knowledge_source_id as string;
    const prev = cardNomination.get(sid);
    if (!prev || score > prev.score) {
      cardNomination.set(sid, {
        cardExternalId: card.external_id as string,
        why: `Source card ${card.external_id} matched catalog/retrieval cues (score ${score.toFixed(2)}); role=candidate recall only.`,
        score,
      });
    }
  }

  /** Canonical junction: child → parent email external ids (many-to-many) */
  const parentsByChildId = new Map<string, string[]>();
  for (const s of sources) {
    if (s.handling_path === "email_attachment_child") {
      const parents = await resolveParentEmailsForChild(s.id as string);
      if (parents.length) {
        parentsByChildId.set(
          s.id as string,
          parents.map((p) => p.parentExternalId)
        );
      }
    }
  }

  const { data: units, error: unitErr } = await supabase
    .from("knowledge_retrieval_units")
    .select(
      "id, external_id, knowledge_source_id, content, content_preview, unit_index, epistemic_type, status, locator, extraction_method, material_limitation"
    )
    .in("knowledge_source_id", sourceIds)
    .eq("status", "active")
    .limit(200);

  // Card-only nomination with no units must not surface as evidence
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
      const nomination = cardNomination.get(source.id as string);
      const cardBoost = nomination ? Math.min(0.35, nomination.score * 0.5) : 0;
      // Extension-only overlap must not dominate when a real filename/content match exists elsewhere.
      const score = Math.min(
        1,
        Math.max(
          base + fileBoost + contentBoost + distinctive + cardBoost - extensionOnlyPenalty(query, haystack, fileBoost),
          0
        )
      );

      // Allow card-nominated sources through with a lower unit-score floor when units exist
      if (
        score < MIN_SCORE &&
        fileBoost <= 0 &&
        contentBoost <= 0 &&
        distinctive <= 0 &&
        !nomination
      ) {
        return null;
      }
      if (nomination && score < 0.05 && contentBoost <= 0 && fileBoost <= 0) {
        // Nominated but no suitable underlying unit support — drop (do not return card as evidence)
        return null;
      }

      const authorityClassification = source.authority_classification as AuthorityClassification;
      const locator = (unit.locator as SourceLocator | null) ?? undefined;
      const method = (unit.extraction_method as string | null) ?? undefined;
      const isVision =
        Boolean(method?.includes("vision")) ||
        unit.content.startsWith("[vision-derived") ||
        locator?.section === "vision_transcription";
      const parentEmailExternalIds = parentsByChildId.get(source.id as string) ?? [];
      const isAttachmentChild =
        parentEmailExternalIds.length > 0 || source.handling_path === "email_attachment_child";
      const isEmail =
        source.source_type === "email" ||
        String(method ?? "").includes("eml") ||
        String(method ?? "").includes("msg");
      let transformationNote =
        "Excerpt is from extracted/chunked text derived from the original source — not the original file itself. Source cards are not citations.";
      if (isVision) {
        transformationNote =
          "Excerpt is a vision-derived transcription linked to the original source locator — not the original file, not independent verification of meaning, and not a finding. Source cards are not citations.";
      } else if (isAttachmentChild) {
        const parentList =
          parentEmailExternalIds.length > 0
            ? parentEmailExternalIds.join(", ")
            : "unknown (no junction links)";
        transformationNote = `Excerpt is from attachment child source “${displayTitle}” (filename is metadata only, not authority), linked via knowledge_source_attachment_links to parent email(s): ${parentList} — not unqualified parent-email text. Source cards are not citations.`;
      } else if (isEmail) {
        transformationNote =
          "Excerpt is from deterministic email parsing (plain/HTML-derived/quoted/metadata as labeled by locator) — not a finding; sender/subject confer no authority. Source cards are not citations.";
      }
      const result: RetrievedKnowledgeUnit = {
        id: unit.id,
        externalId: unit.external_id,
        sourceId: source.id,
        sourceExternalId: source.external_id,
        sourceTitle: displayTitle,
        sourceType: source.source_type,
        authorityClassification,
        authorityDisplay: authorityDisplayFor(authorityClassification ?? "unverified"),
        extractionStatus: source.extraction_status,
        content: unit.content,
        contentPreview: unit.content_preview ?? unit.content.slice(0, 240),
        whyRetrieved: "",
        transformationNote,
        score,
        epistemicType: "source_evidence",
        locator,
        extractionMethod: method,
        materialLimitation: (unit.material_limitation as string | null) ?? undefined,
        sourceCardInformed: Boolean(nomination),
        sourceCardId: nomination?.cardExternalId,
        sourceCardRole: nomination ? "candidate recall only" : undefined,
        sourceCardWhyNominated: nomination?.why,
        parentEmailExternalIds:
          parentEmailExternalIds.length > 0 ? parentEmailExternalIds : undefined,
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
    const locatorLabel = unit.locator?.label;
    const methodNote = unit.extractionMethod
      ? ` Extraction method: ${unit.extractionMethod}.`
      : "";
    const locatorNote = locatorLabel ? ` Locator: ${locatorLabel}.` : "";
    const limitNote = unit.materialLimitation
      ? ` Limitation: ${unit.materialLimitation}.`
      : "";
    const cardInformed = Boolean(unit.sourceCardInformed && unit.sourceCardId);
    const cardNote = cardInformed
      ? ` Source card informed: yes. Source-card ID: ${unit.sourceCardId}. Source-card role: candidate recall only. ${unit.sourceCardWhyNominated ?? ""} Underlying unit selected for citation (card text is not evidence).`
      : " Source card informed: no.";
    ranked.push({
      ...unit,
      rankRole,
      sourceCardInformed: cardInformed,
      whyRetrieved:
        rankRole === "primary"
          ? `Matched query terms against source “${unit.sourceTitle}” (relevance score ${unit.score.toFixed(2)}). Primary match for this query. Relevance is not authority.${locatorNote}${methodNote}${limitNote}${cardNote}`
          : `Matched query terms against source “${unit.sourceTitle}” (relevance score ${unit.score.toFixed(2)}). Subordinate match — lower relevance than the primary source; do not let it distort the answer. Relevance is not authority.${locatorNote}${methodNote}${limitNote}${cardNote}`,
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
