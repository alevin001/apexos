import type { ExecutiveContextPackage, ContinuityItem } from "../../types/context-package.js";
import type { AuditRecordRef, PipelineStageResult } from "../../types/pipeline.js";

export type GlassBoxStageStatus = "captured" | "not_captured";

export interface GlassBoxRecordRef {
  id?: string;
  table?: string;
  type?: string;
  title?: string;
  summary?: string;
  epistemicType?: string;
  /** Build 18/19 — executive-readable source fields (avoid raw IDs in narrative) */
  sourceTitle?: string;
  sourceType?: string;
  sourceIdentity?: string;
  authorityStatus?: string;
  whyRetrieved?: string;
  transformationNote?: string;
  limitation?: string;
  locator?: string;
  extractionMethod?: string;
  sourceCardInformed?: boolean;
  sourceCardId?: string;
  sourceCardRole?: string;
}

export interface GlassBoxStage {
  stage:
    | "current_executive_message"
    | "retrieved_durable_records"
    | "source_evidence"
    | "findings_interpretations"
    | "hypotheses_assumptions"
    | "alternatives"
    | "recommendation"
    | "executive_decision"
    | "outcome_learning";
  status: GlassBoxStageStatus;
  count: number;
  recordTypes: string[];
  ids: string[];
  summary: string;
  records: GlassBoxRecordRef[];
}

/** Concise structured Glass Box — only from Context Package + runtime audit/trace data. */
export interface GlassBoxSummary {
  runtimeId: string;
  conversationId: string | null;
  contextPackageId: string | null;
  source: "context_package_and_runtime_trace";
  auditableChain: string;
  stages: GlassBoxStage[];
}

export interface GlassBoxBuildInput {
  runtimeId: string;
  conversationId: string | null;
  contextPackageId: string | null;
  contextPackage: ExecutiveContextPackage | null | undefined;
  recordsCreated?: AuditRecordRef[];
  recordsRetrieved?: AuditRecordRef[];
  stages?: PipelineStageResult[];
  /** True when Context Package assembly succeeded with usable structure. */
  contextPackageMalformed?: boolean;
}

const AUDITABLE_CHAIN =
  "Situation → retrieved context → source evidence → interpretation → assumptions → alternatives → recommendation → decision → outcome/learning";

function mapContinuity(items: ContinuityItem[] | undefined): GlassBoxRecordRef[] {
  return (items ?? []).map((item) => {
    const knowledge = item.table === "knowledge_retrieval_units";
    const authorityMatch = item.summary.match(/Authority:\s*([^.]+)\./i);
    const whyMatch = item.summary.match(/Matched query terms[\s\S]*?(?=\sExcerpt is from|$)/i);
    const transformMatch = item.summary.match(/Excerpt is from[\s\S]*$/i);
    const locatorMatch = item.summary.match(/Locator:\s*([^.]+)\./i);
    const methodMatch = item.summary.match(/Extraction method:\s*([^.]+)\./i);
    const cardMatch = item.summary.match(/Source card informed:\s*(yes|no)/i);
    const cardIdMatch = item.summary.match(/Source-card ID:\s*([^\s.]+)/i);
    return {
      id: item.id,
      table: item.table,
      type: item.type,
      title: item.title,
      summary: item.summary.slice(0, 400),
      epistemicType: item.epistemicType,
      ...(knowledge
        ? {
            sourceTitle: item.title,
            sourceType: item.type,
            sourceIdentity: item.sourceExternalId,
            authorityStatus:
              item.authorityDisplay ??
              authorityMatch?.[1]?.trim() ??
              "evidence/reference—authority unasserted",
            whyRetrieved: item.whyRetrieved ?? whyMatch?.[0]?.trim(),
            transformationNote: item.transformationNote ?? transformMatch?.[0]?.trim(),
            limitation: item.materialLimitation,
            locator: item.locatorLabel ?? locatorMatch?.[1]?.trim(),
            extractionMethod: item.extractionMethod ?? methodMatch?.[1]?.trim(),
            sourceCardInformed:
              item.sourceCardInformed ??
              (cardMatch ? cardMatch[1].toLowerCase() === "yes" : undefined),
            sourceCardId: item.sourceCardId ?? cardIdMatch?.[1]?.trim(),
            sourceCardRole: item.sourceCardRole,
          }
        : {}),
    };
  });
}

function refsFromAudit(refs: AuditRecordRef[] | undefined, types?: string[]): GlassBoxRecordRef[] {
  const list = refs ?? [];
  return list
    .filter((r) => !types || (r.type ? types.includes(r.type) : types.includes(r.table)))
    .map((r) => ({
      id: r.id,
      table: r.table,
      type: r.type,
      title: r.externalId,
    }));
}

function uniqTypes(records: GlassBoxRecordRef[]): string[] {
  const set = new Set<string>();
  for (const r of records) {
    if (r.epistemicType) set.add(r.epistemicType);
    else if (r.type) set.add(r.type);
    else if (r.table) set.add(r.table);
  }
  return [...set];
}

function stage(
  name: GlassBoxStage["stage"],
  records: GlassBoxRecordRef[],
  capturedSummary: string,
  emptySummary = "not captured"
): GlassBoxStage {
  const status: GlassBoxStageStatus = records.length > 0 ? "captured" : "not_captured";
  return {
    stage: name,
    status,
    count: records.length,
    recordTypes: uniqTypes(records),
    ids: records.map((r) => r.id).filter((id): id is string => Boolean(id)),
    summary: status === "captured" ? capturedSummary : emptySummary,
    records: records.slice(0, 12),
  };
}

export function buildGlassBox(input: GlassBoxBuildInput): GlassBoxSummary {
  const pkg = input.contextPackageMalformed ? null : input.contextPackage ?? null;
  const created = input.recordsCreated ?? [];
  const retrieved = input.recordsRetrieved ?? [];

  const currentMessage = pkg?.executiveMessage?.trim()
    ? [
        {
          type: "current_message",
          summary: pkg.executiveMessage.slice(0, 400),
          title: "Current executive message",
        },
      ]
    : [];

  const retrievedRecords: GlassBoxRecordRef[] = [
    ...mapContinuity(pkg?.continuity?.priorSourceEvidence),
    ...mapContinuity(pkg?.continuity?.savedObservations),
    ...mapContinuity(pkg?.continuity?.findingsHypotheses),
    ...mapContinuity(pkg?.continuity?.recommendations),
    ...mapContinuity(pkg?.continuity?.people),
    ...(pkg?.continuity?.priorMessages ?? []).map((m) => ({
      id: m.id,
      table: "conversation_messages",
      type: "prior_message",
      title: m.role,
      summary: m.content.slice(0, 240),
    })),
    ...refsFromAudit(retrieved),
  ];

  // Deduplicate by id+table
  const seen = new Set<string>();
  const retrievedDeduped = retrievedRecords.filter((r) => {
    const key = `${r.table ?? ""}:${r.id ?? r.title ?? r.summary}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sourceEvidence: GlassBoxRecordRef[] = [
    ...mapContinuity(pkg?.continuity?.priorSourceEvidence),
    ...mapContinuity(pkg?.continuity?.savedObservations),
    ...refsFromAudit(created, ["source_evidence", "observation", "observations"]),
    ...created
      .filter((r) => r.table === "observations")
      .map((r) => ({ id: r.id, table: r.table, type: r.type ?? "source_evidence" })),
  ];

  const findings: GlassBoxRecordRef[] = [
    ...mapContinuity(pkg?.continuity?.findingsHypotheses).filter(
      (r) => (r.epistemicType ?? r.type) !== "hypothesis"
    ),
    ...refsFromAudit(created, ["finding"]),
  ];

  const hypotheses: GlassBoxRecordRef[] = [
    ...mapContinuity(pkg?.continuity?.findingsHypotheses).filter(
      (r) => (r.epistemicType ?? r.type) === "hypothesis"
    ),
    ...refsFromAudit(created, ["hypothesis"]),
    ...(pkg?.confidence?.assumptions ?? []).map((a, i) => ({
      id: `assumption-${i}`,
      type: "assumption",
      summary: a.slice(0, 240),
      title: "Assumption",
    })),
  ];

  const recommendations: GlassBoxRecordRef[] = [
    ...mapContinuity(pkg?.continuity?.recommendations),
    ...refsFromAudit(created, ["recommendation"]),
  ];

  // Alternatives / decision / outcome are not fabricated from LLM prose.
  const alternatives: GlassBoxRecordRef[] = refsFromAudit(created, ["alternative"]);
  const decisions: GlassBoxRecordRef[] = refsFromAudit(created, ["decision"]);
  const outcomes: GlassBoxRecordRef[] = [
    ...refsFromAudit(created, ["outcome", "learning"]),
    ...(pkg?.memory?.outcomes ?? []).map((o) => ({
      id: o.externalId,
      table: "memory_artifacts",
      type: "outcome",
      title: o.title,
      summary: o.summary.slice(0, 240),
    })),
  ];

  const malformedNote = input.contextPackageMalformed
    ? " Context Package data was malformed; stages reflect audit/trace only."
    : !pkg
      ? " Context Package unavailable; stages reflect audit/trace only."
      : "";

  return {
    runtimeId: input.runtimeId,
    conversationId: input.conversationId,
    contextPackageId: input.contextPackageId,
    source: "context_package_and_runtime_trace",
    auditableChain: AUDITABLE_CHAIN,
    stages: [
      stage(
        "current_executive_message",
        currentMessage,
        "Current executive message captured in Context Package.",
        pkg ? "not captured" : `not captured.${malformedNote}`
      ),
      stage(
        "retrieved_durable_records",
        retrievedDeduped,
        `Retrieved ${retrievedDeduped.length} durable record(s) into context.`,
        "not captured"
      ),
      stage(
        "source_evidence",
        dedupeRefs(sourceEvidence),
        `Source evidence: ${dedupeRefs(sourceEvidence).length} record(s).`,
        "not captured"
      ),
      stage(
        "findings_interpretations",
        dedupeRefs(findings),
        `Findings/interpretations: ${dedupeRefs(findings).length} record(s).`,
        "not captured"
      ),
      stage(
        "hypotheses_assumptions",
        dedupeRefs(hypotheses),
        `Hypotheses/assumptions: ${dedupeRefs(hypotheses).length} item(s).`,
        "not captured"
      ),
      stage(
        "alternatives",
        dedupeRefs(alternatives),
        `Alternatives: ${dedupeRefs(alternatives).length} record(s).`,
        "not captured"
      ),
      stage(
        "recommendation",
        dedupeRefs(recommendations),
        `Recommendations: ${dedupeRefs(recommendations).length} record(s).`,
        "not captured"
      ),
      stage(
        "executive_decision",
        dedupeRefs(decisions),
        `Executive decision: ${dedupeRefs(decisions).length} record(s).`,
        "not captured"
      ),
      stage(
        "outcome_learning",
        dedupeRefs(outcomes),
        `Outcome/learning: ${dedupeRefs(outcomes).length} record(s).`,
        "not captured"
      ),
    ],
  };
}

function dedupeRefs(records: GlassBoxRecordRef[]): GlassBoxRecordRef[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.table ?? ""}:${r.id ?? ""}:${r.type ?? ""}:${r.summary ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Glass Box for failed/unavailable runtime — all stages not_captured, honest source. */
export function buildUnavailableGlassBox(runtimeId: string | null): GlassBoxSummary {
  const empty = buildGlassBox({
    runtimeId: runtimeId ?? "unavailable",
    conversationId: null,
    contextPackageId: null,
    contextPackage: null,
  });
  return {
    ...empty,
    stages: empty.stages.map((s) => ({
      ...s,
      status: "not_captured" as const,
      count: 0,
      recordTypes: [],
      ids: [],
      records: [],
      summary: "not captured — ApexOS runtime was not available",
    })),
  };
}
