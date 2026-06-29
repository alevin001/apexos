import type { SituationPackage } from "@/types/conversation";

const TYPE_PATTERNS: { type: string; patterns: RegExp[] }[] = [
  { type: "leadership-conflict", patterns: [/\b(conflict|misalign|tension|disagree|clash)\b/i, /\b(leadership|executive team)\b/i] },
  { type: "difficult-conversation", patterns: [/\b(difficult conversation|hard conversation|tough talk|feedback)\b/i] },
  { type: "strategic-decision", patterns: [/\b(strategic|strategy|roadmap|priorit|investment|portfolio)\b/i] },
  { type: "meeting-preparation", patterns: [/\b(prepare for|prep for|meeting with|upcoming meeting|board meeting)\b/i] },
  { type: "meeting-analysis", patterns: [/\b(transcript|meeting notes|debrief|after the meeting)\b/i] },
  { type: "organizational-challenge", patterns: [/\b(organizational|culture|reorg|restructure|turnover|retention)\b/i] },
  { type: "relationship", patterns: [/\b(relationship|trust|rapport|stakeholder)\b/i] },
  { type: "executive-coaching", patterns: [/\b(coaching|develop|grow as|leadership development)\b/i] },
  { type: "decision-support", patterns: [/\b(decide|decision|choose between|option|trade.?off)\b/i] },
];

const URGENCY_HIGH = /\b(urgent|asap|today|tomorrow|immediate|critical|this week)\b/i;
const URGENCY_LOW = /\b(no rush|whenever|long.?term|eventually)\b/i;

const OBJECTIVE_PATTERNS = [
  /(?:i need to|i want to|i'm trying to|i am trying to|my goal is|help me)\s+(.{10,120}?)(?:\.|$)/i,
  /(?:figure out|decide|resolve|address|handle|navigate)\s+(.{10,120}?)(?:\.|$)/i,
];

const OUTCOME_PATTERNS = [
  /(?:desired outcome|outcome i want|success looks like|end goal)\s*[:\-]?\s*(.{10,200}?)(?:\.|$)/i,
  /(?:so that|in order to)\s+(.{10,120}?)(?:\.|$)/i,
];

const CONSTRAINT_PATTERN =
  /\b(budget|timeline|deadline|legal|compliance|confidential|cannot|must not|constraint)\b[^.]{0,80}/gi;

const RISK_PATTERN =
  /\b(risk|concern|worry|could backfire|downside|if we)\b[^.]{0,100}/gi;

const PEOPLE_PATTERNS = [
  /\b(?:with|from|between|involving)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  /\b(my\s+(?:direct report|team lead|CFO|COO|CTO|VP|manager))\b/gi,
];

function detectSituationType(text: string): string {
  for (const { type, patterns } of TYPE_PATTERNS) {
    if (patterns.every((p) => p.test(text)) || patterns.some((p) => p.test(text) && patterns.length === 1)) {
      if (patterns.length > 1 && !patterns.every((p) => p.test(text))) continue;
      return type;
    }
  }
  for (const { type, patterns } of TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return "general";
}

function extractObjective(text: string): string {
  for (const pattern of OBJECTIVE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  return firstSentence && firstSentence.length >= 15 ? firstSentence : text.slice(0, 200).trim();
}

function extractTitle(text: string, situationType: string): string {
  const objective = extractObjective(text);
  if (objective.length <= 60) return objective;
  const typeLabel = situationType.replace(/-/g, " ");
  return `${typeLabel.charAt(0).toUpperCase()}${typeLabel.slice(1)} — ${objective.slice(0, 40).trim()}…`;
}

function extractPeople(text: string): string[] {
  const people = new Set<string>();
  for (const pattern of PEOPLE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match[1]) people.add(match[1].trim());
    }
  }
  return [...people];
}

function extractOrganization(text: string): string | null {
  const match = text.match(/\b(?:at|for|within)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+(?:during|this|where|when)|[,.]|$)/);
  return match?.[1]?.trim() ?? null;
}

function extractDesiredOutcome(text: string): string | null {
  for (const pattern of OUTCOME_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractConstraints(text: string): string[] {
  const matches = text.match(CONSTRAINT_PATTERN);
  return matches ? [...new Set(matches.map((m) => m.trim()))].slice(0, 5) : [];
}

function extractRisks(text: string): string[] {
  const matches = text.match(RISK_PATTERN);
  return matches ? [...new Set(matches.map((m) => m.trim()))].slice(0, 5) : [];
}

function detectUrgency(text: string): SituationPackage["urgency"] {
  if (URGENCY_HIGH.test(text)) return "high";
  if (URGENCY_LOW.test(text)) return "low";
  if (/\b(soon|next week|this month)\b/i.test(text)) return "medium";
  return null;
}

function computeMissingFields(pkg: Omit<SituationPackage, "missing_fields">): string[] {
  const missing: string[] = [];
  if (!pkg.executive_objective || pkg.executive_objective.length < 10) missing.push("executive_objective");
  if (!pkg.situation_summary || pkg.situation_summary.length < 20) missing.push("situation_summary");
  if (!pkg.desired_outcome) missing.push("desired_outcome");
  if (pkg.people_involved.length === 0 && /\b(team|person|stakeholder|report|colleague)\b/i.test(pkg.source_text)) {
    missing.push("people_involved");
  }
  return missing;
}

export function extractSituationPackage(text: string, prior?: Partial<SituationPackage>): SituationPackage {
  const combined = prior?.source_text ? `${prior.source_text}\n\n${text}` : text;
  const situationType = prior?.situation_type ?? detectSituationType(combined);
  const executiveObjective = prior?.executive_objective ?? extractObjective(combined);
  const people = [...new Set([...(prior?.people_involved ?? []), ...extractPeople(combined)])];

  const pkg: Omit<SituationPackage, "missing_fields"> = {
    title: prior?.title ?? extractTitle(combined, situationType),
    situation_type: situationType,
    executive_objective: executiveObjective,
    situation_summary: prior?.situation_summary ?? combined.trim(),
    people_involved: people,
    organization: prior?.organization ?? extractOrganization(combined),
    desired_outcome: prior?.desired_outcome ?? extractDesiredOutcome(combined),
    constraints: [...new Set([...(prior?.constraints ?? []), ...extractConstraints(combined)])],
    urgency: prior?.urgency ?? detectUrgency(combined),
    known_risks: [...new Set([...(prior?.known_risks ?? []), ...extractRisks(combined)])],
    source_text: combined,
  };

  const missing_fields = computeMissingFields(pkg);
  return { ...pkg, missing_fields };
}

export function mergeSituationPackage(
  existing: SituationPackage,
  clarificationText: string,
  field?: string
): SituationPackage {
  if (field === "people_involved") {
    const added = extractPeople(clarificationText);
    return extractSituationPackage(existing.source_text, {
      ...existing,
      people_involved: [...new Set([...existing.people_involved, ...added, clarificationText.trim()])],
      missing_fields: [],
    });
  }
  if (field === "desired_outcome") {
    return extractSituationPackage(existing.source_text, {
      ...existing,
      desired_outcome: clarificationText.trim(),
    });
  }
  if (field === "executive_objective") {
    return extractSituationPackage(existing.source_text, {
      ...existing,
      executive_objective: clarificationText.trim(),
    });
  }
  return extractSituationPackage(`${existing.source_text}\n\n${clarificationText}`, existing);
}
