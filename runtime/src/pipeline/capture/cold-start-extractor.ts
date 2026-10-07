/**
 * Build 16 — lightweight cold-start extraction from executive source text.
 * Heuristic and general; not hard-coded to specific people or phrases.
 * Distinguishes source statements from interpretive labels applied later.
 */

export type EpistemicType =
  | "source_evidence"
  | "observation"
  | "finding"
  | "hypothesis"
  | "alternative"
  | "recommendation"
  | "proposed_decision"
  | "decision"
  | "outcome";

export interface ExtractedPerson {
  displayName: string;
  slug: string;
}

export interface ExtractedFact {
  text: string;
  epistemicType: "source_evidence" | "observation";
}

export interface InterpretiveSegment {
  text: string;
  epistemicType:
    | "finding"
    | "hypothesis"
    | "alternative"
    | "recommendation"
    | "proposed_decision"
    | "decision"
    | "outcome";
}

export interface ColdStartExtraction {
  isMaterialSituation: boolean;
  situationType: string;
  title: string;
  summary: string;
  people: ExtractedPerson[];
  sourceFacts: ExtractedFact[];
}

const NAME_STOPWORDS = new Set([
  "the", "this", "that", "when", "what", "where", "which", "while", "with",
  "from", "into", "about", "after", "before", "during", "between", "among",
  "and", "but", "for", "our", "your", "their", "team", "leadership", "meeting",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "june", "july", "august", "september",
  "october", "november", "december", "apexos", "chatgpt",
]);

const SITUATION_SIGNALS: { type: string; patterns: RegExp[] }[] = [
  { type: "leadership-development", patterns: [/\b(leadership|executive team|direct reports?)\b/i, /\b(develop|development|coach|ownership|align)/i] },
  { type: "leadership-conflict", patterns: [/\b(conflict|misalign|tension|disagree|clash)\b/i] },
  { type: "team-alignment", patterns: [/\b(align|alignment|execution|accountab)/i, /\b(team|meeting|leadership)\b/i] },
  { type: "strategic-decision", patterns: [/\b(decide|decision|strategy|priorit)/i] },
  { type: "organizational-challenge", patterns: [/\b(organization|culture|reorg|retention)\b/i] },
  { type: "relationship", patterns: [/\b(relationship|trust|rapport|stakeholder)\b/i] },
];

const MATERIALITY =
  /\b(team|leadership|conflict|align|meeting|decision|coach|develop|owner|execution|report|situation|challenge|help me|i need|we need)\b/i;

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function extractPeople(text: string): ExtractedPerson[] {
  const found = new Map<string, ExtractedPerson>();

  const patterns = [
    /\b(?:with|from|between|involving|and)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/g,
    /\b([A-Z][a-z]{2,})\s+and\s+([A-Z][a-z]{2,})\b/g,
  ];

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      for (const group of match.slice(1)) {
        if (!group) continue;
        const displayName = group.trim();
        const first = displayName.split(/\s+/)[0]?.toLowerCase() ?? "";
        if (NAME_STOPWORDS.has(first)) continue;
        if (displayName.length < 3) continue;
        const slug = slugifyName(displayName);
        if (!slug || found.has(slug)) continue;
        found.set(slug, { displayName, slug });
      }
    }
  }

  return [...found.values()].slice(0, 8);
}

export function detectSituationType(text: string): string {
  for (const { type, patterns } of SITUATION_SIGNALS) {
    if (patterns.every((p) => p.test(text))) return type;
  }
  for (const { type, patterns } of SITUATION_SIGNALS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return "general";
}

export function isMaterialSituation(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) return false;
  if (MATERIALITY.test(trimmed)) return true;
  return extractPeople(trimmed).length >= 2;
}

function extractTitle(text: string, situationType: string): string {
  const first = text.split(/[.!?]/)[0]?.trim() ?? text.trim();
  if (first.length > 12 && first.length <= 80) return first;
  const label = situationType.replace(/-/g, " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} — ${first.slice(0, 48).trim()}`;
}

/** Split executive source into attributed fact lines (not model interpretation). */
export function extractSourceFacts(text: string): ExtractedFact[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  const facts: ExtractedFact[] = [];
  for (const sentence of sentences.slice(0, 12)) {
    facts.push({
      text: sentence,
      epistemicType: "source_evidence",
    });
  }

  if (!facts.length && text.trim().length >= 20) {
    facts.push({ text: text.trim().slice(0, 500), epistemicType: "source_evidence" });
  }

  return facts;
}

const CONFIRMED_DECISION =
  /\b(I(?:'| ha)?ve decided|I decided|my decision is|we(?:'| ha)?ve decided|we decided|I(?:'| a)m choosing|I choose to)\b/i;

const PROPOSED_OR_LEANING =
  /\b(lean(?:ing)? toward|inclined to|thinking about|considering|decision to (?:make|take)|the decision (?:to make|ahead)|proposed decision|pending decision)\b/i;

const FINDING_OR_INTERPRETATION =
  /\b(finding|interpretation|pattern|indicates|shows that|key issue|core problem|real issue|what matters|the tension|misalignment|in short|the gap)\b/i;

const ALTERNATIVE_OR_OPTION =
  /\b(option|alternative|trade-?off|tradeoff|path(?:way)?|instead|versus| vs\.? |one approach|another approach|either|or else)\b/i;

/**
 * Label interpretive segments from an ApexOS response (or executive message).
 * These are NOT source evidence — stored separately with low confidence.
 * "Leaning toward" / decision-to-make → proposed_decision (never confirmed decision).
 */
export function extractInterpretiveSegments(responseText: string): InterpretiveSegment[] {
  const sentences = responseText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•\d.)]+\s+/, ""))
    .filter((s) => s.length >= 18);

  const segments: InterpretiveSegment[] = [];
  const pushUnique = (text: string, epistemicType: InterpretiveSegment["epistemicType"]) => {
    if (segments.some((s) => s.epistemicType === epistemicType && s.text === text)) return;
    segments.push({ text, epistemicType });
  };

  for (const sentence of sentences.slice(0, 28)) {
    if (
      /\b(outcome to track|success looks like|watch for|follow[- ]up indicator|track whether|measure whether)\b/i.test(
        sentence
      )
    ) {
      pushUnique(sentence, "outcome");
    } else if (CONFIRMED_DECISION.test(sentence)) {
      pushUnique(sentence, "decision");
    } else if (PROPOSED_OR_LEANING.test(sentence)) {
      pushUnique(sentence, "proposed_decision");
    } else if (
      /\b(recommend|recommends|recommendation|suggest|suggested|suggestion|should|next step|proposed action|I advise|key conversation|focus on|say first)\b/i.test(
        sentence
      )
    ) {
      pushUnique(sentence, "recommendation");
    } else if (ALTERNATIVE_OR_OPTION.test(sentence) || /^option\s*[a-d]\b/i.test(sentence)) {
      pushUnique(sentence, "alternative");
    } else if (FINDING_OR_INTERPRETATION.test(sentence)) {
      pushUnique(sentence, "finding");
    } else if (/\b(may|might|could|appears|likely|hypothesis|assume|possible|uncertain)\b/i.test(sentence)) {
      pushUnique(sentence, "hypothesis");
    }
  }

  // Numbered / lettered option blocks without the word "option"
  const optionBlocks = responseText.match(/(?:^|\n)\s*(?:[-*•]|\d+[.)]|[A-D][.)])\s+([^\n]{18,220})/gi) ?? [];
  if (optionBlocks.length >= 2) {
    for (const raw of optionBlocks.slice(0, 4)) {
      const text = raw.replace(/^(?:^|\n)\s*(?:[-*•]|\d+[.)]|[A-D][.)])\s+/i, "").trim();
      if (text) pushUnique(text, "alternative");
    }
  }

  // Proposed decision can co-occur with recommendation wording.
  for (const sentence of sentences.slice(0, 28)) {
    if (PROPOSED_OR_LEANING.test(sentence) && !CONFIRMED_DECISION.test(sentence)) {
      pushUnique(sentence, "proposed_decision");
    }
  }

  const recommendation =
    segments.find((s) => s.epistemicType === "recommendation") ??
    segments.find((s) => s.epistemicType === "proposed_decision");
  if (recommendation && !segments.some((s) => s.epistemicType === "outcome")) {
    pushUnique(
      `Outcome to track (pending): whether the recommended or proposed action is taken and whether aligned execution improves — derived from displayed recommendation/proposal, not observed evidence. ${recommendation.text.slice(0, 280)}`,
      "outcome"
    );
  }

  return segments.slice(0, 16);
}

/** Extract proposed/pending leanings from the executive message (never confirmed decisions). */
export function extractExecutiveProposals(message: string): InterpretiveSegment[] {
  return extractInterpretiveSegments(message).filter(
    (s) => s.epistemicType === "proposed_decision" || s.epistemicType === "recommendation"
  );
}

export function extractColdStart(message: string): ColdStartExtraction {
  const text = message.trim();
  const situationType = detectSituationType(text);
  const people = extractPeople(text);
  const material = isMaterialSituation(text);

  return {
    isMaterialSituation: material,
    situationType,
    title: extractTitle(text, situationType),
    summary: text.slice(0, 1200),
    people,
    sourceFacts: extractSourceFacts(text),
  };
}

/** Relevance: simple token overlap; returns score 0–1. */
export function relevanceScore(query: string, candidate: string): number {
  const qTokens = tokenize(query);
  const cTokens = tokenize(candidate);
  if (!qTokens.size || !cTokens.size) return 0;
  let hit = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) hit += 1;
  }
  return hit / qTokens.size;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t))
  );
}
