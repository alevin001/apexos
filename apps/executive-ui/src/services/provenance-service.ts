import { getSupabaseServer } from "./supabase-server";
import type {
  DecisionProvenanceView,
  ProvenanceArtifact,
  ProvenanceInsight,
  ProvenanceStageData,
  RuntimeObservability,
} from "@/types/executive";
import {
  getSituationPipeline,
  parseTierEntries,
  queryTraceabilityChainForSituation,
} from "./pipeline-service";
import { getEvidenceView } from "./evidence-service";
import { getReasoningView } from "./reasoning-service";

function logEntries(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && typeof e === "object") as Record<string, unknown>[];
}

function countEvidenceItems(assemblyTiers: Record<string, unknown> | null | undefined): number {
  if (!assemblyTiers) return 0;
  return (
    parseTierEntries(assemblyTiers, "critical").length +
    parseTierEntries(assemblyTiers, "supporting").length +
    parseTierEntries(assemblyTiers, "available").length
  );
}

async function fetchArtifactLinks(
  sourceTable: string,
  sourceId: string
): Promise<ProvenanceArtifact[]> {
  const supabase = getSupabaseServer();
  const { data: links } = await supabase
    .from("artifact_links")
    .select("target_table, target_id, link_type, tier")
    .eq("source_table", sourceTable)
    .eq("source_id", sourceId);

  if (!links?.length) return [];

  const artifacts: ProvenanceArtifact[] = [];
  for (const link of links) {
    const { data: row } = await supabase
      .from(link.target_table)
      .select("external_id, title, status, body_md")
      .eq("id", link.target_id)
      .maybeSingle();
    if (row) {
      artifacts.push({
        external_id: row.external_id,
        title: row.title,
        type: link.link_type ?? link.target_table,
        status: row.status,
        body_md: row.body_md,
      });
    }
  }
  return artifacts;
}

export async function getDecisionProvenance(
  situationSlug: string
): Promise<DecisionProvenanceView | null> {
  const pipeline = await getSituationPipeline(situationSlug);
  if (!pipeline) return null;

  const { situation, chain, contextSpec, recommendationPackage, outcomeCapture } = pipeline;
  const supabase = getSupabaseServer();
  const base = `/situations/${situationSlug}`;
  const stages: ProvenanceStageData[] = [];

  stages.push({
    id: "situation",
    label: "Situation",
    externalId: situation.external_id,
    status: situation.status,
    complete: true,
    summary: situation.situation_summary ?? situation.title,
    insights: [
      { question: "What situation is being evaluated?", answer: situation.situation_summary ?? situation.title },
      { question: "What type of situation is this?", answer: situation.situation_type ?? "Not classified" },
    ],
    artifacts: [],
    relatedPath: base,
  });

  if (contextSpec) {
    const domainWeights = (contextSpec.domain_weights as Record<string, string>) ?? {};
    const weightSummary = Object.entries(domainWeights)
      .map(([d, w]) => `${d}: ${w}`)
      .join(", ");

    stages.push({
      id: "context",
      label: "Context",
      externalId: chain?.context_spec ?? "—",
      status: (contextSpec.status as string) ?? "pending",
      complete: !!chain?.context_spec,
      summary: (contextSpec.situation_summary as string) ?? "",
      insights: [
        { question: "Why was this context assembled?", answer: (contextSpec.weighting_rationale as string) ?? "Context relevance determined from situation evaluation" },
        { question: "Which domains were weighted?", answer: weightSummary || "No domain weights recorded" },
        { question: "What retrieval tiers were specified?", answer: JSON.stringify(contextSpec.retrieval_tiers ?? {}) },
      ],
      artifacts: await fetchArtifactLinks("context_relevance_specs", contextSpec.id as string),
      body_md: contextSpec.body_md as string | null,
      transformation_log: logEntries(contextSpec.transformation_log),
      relatedPath: `${base}/evidence`,
    });
  }

  if (chain?.retrieval_request) {
    const { data: rr } = await supabase
      .from("retrieval_requests")
      .select("*")
      .eq("external_id", chain.retrieval_request)
      .maybeSingle();

    if (rr) {
      stages.push({
        id: "retrieval",
        label: "Retrieval",
        externalId: rr.external_id,
        status: rr.status,
        complete: !!chain.evidence_package,
        summary: rr.scope_summary,
        insights: [
          { question: "Why was this retrieved?", answer: rr.scope_summary },
          { question: "What retrieval targets were specified?", answer: (rr.retrieval_targets as string[])?.join(", ") ?? "None" },
          { question: "Was contradictory evidence required?", answer: rr.contradictory_evidence_required ? "Yes — contradictory evidence search required" : "No" },
        ],
        artifacts: await fetchArtifactLinks("retrieval_requests", rr.id),
        body_md: rr.body_md,
        transformation_log: logEntries(rr.transformation_log),
        relatedPath: `${base}/evidence`,
      });
    }
  }

  if (chain?.evidence_package) {
    const { data: ep } = await supabase
      .from("evidence_packages")
      .select("*")
      .eq("external_id", chain.evidence_package)
      .maybeSingle();

    const evidenceView = await getEvidenceView(situationSlug);
    const supportingCount = evidenceView
      ? evidenceView.executiveMemory.length +
        evidenceView.personMemory.length +
        evidenceView.relationshipMemory.length +
        evidenceView.retrievedKnowledge.length +
        evidenceView.patterns.length +
        evidenceView.outcomeHistory.length +
        evidenceView.supportingEvidence.length
      : countEvidenceItems(ep?.assembly_tiers as Record<string, unknown>);

    const contradictionCount = evidenceView?.contradictoryEvidence.length ?? 0;

    stages.push({
      id: "evidence",
      label: "Evidence",
      externalId: chain.evidence_package,
      status: (ep?.status as string) ?? "assembled",
      complete: true,
      summary: `${supportingCount} evidence items assembled${contradictionCount ? `; ${contradictionCount} contradiction(s) recorded` : ""}`,
      insights: [
        { question: "What evidence supports this?", answer: `${supportingCount} items across memory, knowledge, patterns, and outcome history` },
        { question: "What evidence contradicts this?", answer: contradictionCount ? `${contradictionCount} contradictory evidence record(s) — see Evidence viewer` : "No contradictory evidence recorded" },
        { question: "What gaps exist?", answer: JSON.stringify(ep?.gaps ?? []) },
      ],
      artifacts: ep
        ? await fetchArtifactLinks("evidence_packages", ep.id)
        : [],
      body_md: ep?.body_md,
      transformation_log: logEntries(ep?.transformation_log),
      relatedPath: `${base}/evidence`,
    });
  }

  if (chain?.interpretation) {
    const { data: ip } = await supabase
      .from("interpretation_packages")
      .select("*")
      .eq("external_id", chain.interpretation)
      .maybeSingle();

    const reasoning = await getReasoningView(situationSlug);
    const assumptions = reasoning?.assumptions ?? [];
    const blindSpots = reasoning?.blindSpots ?? [];
    const uncertainty = (ip?.uncertainty_flags as string[]) ?? [];

    const infArtifacts: ProvenanceArtifact[] = [];
    if (ip) {
      const { data: components } = await supabase
        .from("inference_components")
        .select("external_id, title, component_type, status, body_md")
        .eq("interpretation_package_id", ip.id)
        .order("created_at", { ascending: true });

      for (const c of components ?? []) {
        infArtifacts.push({
          external_id: c.external_id,
          title: c.title,
          type: c.component_type,
          status: c.status,
          body_md: c.body_md,
        });
      }
    }

    stages.push({
      id: "interpretation",
      label: "Interpretation",
      externalId: chain.interpretation,
      status: (ip?.status as string) ?? "pending",
      complete: true,
      summary: `Confidence: ${ip?.confidence_summary ?? "unknown"}${uncertainty.length ? ` · ${uncertainty.length} uncertainty flag(s)` : ""}`,
      insights: [
        { question: "How was this interpretation produced?", answer: `${infArtifacts.length} inference component(s) evaluated evidence through structured reasoning` },
        { question: "Which assumptions exist?", answer: assumptions.length ? assumptions.map((a) => a.title).join("; ") : "See assumption register in Reasoning viewer" },
        { question: "What uncertainty remains?", answer: uncertainty.length ? uncertainty.join(", ") : "No uncertainty flags recorded" },
        { question: "What blind spots were identified?", answer: blindSpots.length ? blindSpots.map((b) => b.title).join("; ") : "None recorded" },
      ],
      artifacts: infArtifacts,
      body_md: ip?.body_md,
      transformation_log: logEntries(ip?.transformation_log),
      relatedPath: `${base}/reasoning`,
    });
  }

  if (chain?.recommendation && recommendationPackage) {
    const recComponents: ProvenanceArtifact[] = [];
    const { data: components } = await supabase
      .from("recommendation_components")
      .select("external_id, title, component_type, status, body_md")
      .eq("recommendation_package_id", recommendationPackage.id as string)
      .order("created_at", { ascending: true });

    for (const c of components ?? []) {
      recComponents.push({
        external_id: c.external_id,
        title: c.title,
        type: c.component_type,
        status: c.status,
        body_md: c.body_md,
      });
    }

    const doctrineLinks = await fetchArtifactLinks(
      "recommendation_packages",
      recommendationPackage.id as string
    );
    const doctrineFromLinks = doctrineLinks.filter(
      (a) => a.type?.includes("doctrine") || a.type?.includes("knowledge")
    );

    const uncertainty = (recommendationPackage.uncertainty_flags as string[]) ?? [];

    stages.push({
      id: "recommendation",
      label: "Recommendation",
      externalId: chain.recommendation,
      status: (recommendationPackage.status as string) ?? "pending",
      complete: true,
      summary: `Confidence: ${recommendationPackage.confidence_summary ?? "unknown"} — ${recommendationPackage.title as string}`,
      insights: [
        { question: "How was this recommendation produced?", answer: `${recComponents.length} recommendation component(s) including option generation and doctrine evaluation` },
        { question: "What doctrine influenced this recommendation?", answer: doctrineFromLinks.length ? doctrineFromLinks.map((d) => d.title).join("; ") : "Evidence-first approach per option generation artifact" },
        { question: "What uncertainty remains?", answer: uncertainty.length ? uncertainty.join(", ") : "No uncertainty flags" },
        { question: "Which outcomes previously reinforced this?", answer: "See outcome history in Evidence viewer for prior similar situations" },
      ],
      artifacts: recComponents,
      body_md: recommendationPackage.body_md as string | null,
      transformation_log: logEntries(recommendationPackage.transformation_log),
      relatedPath: `${base}/reasoning`,
    });
  }

  const decisionRef = (outcomeCapture?.executive_decision_reference as string) ?? "";
  stages.push({
    id: "decision",
    label: "Decision",
    externalId: decisionRef || "—",
    status: decisionRef ? "recorded" : "pending",
    complete: !!decisionRef,
    summary: decisionRef
      ? `Executive decision recorded: ${decisionRef}`
      : "Awaiting executive decision",
    insights: [
      { question: "What decision was made?", answer: decisionRef || "Not yet recorded — use Decision capture" },
      { question: "Was the recommendation followed?", answer: (outcomeCapture?.recommendation_followed as string) ?? "Pending" },
    ],
    artifacts: [],
    relatedPath: `${base}/decision`,
  });

  if (chain?.outcome_capture && outcomeCapture) {
    stages.push({
      id: "outcome",
      label: "Outcome",
      externalId: chain.outcome_capture,
      status: (outcomeCapture.status as string) ?? "pending",
      complete: true,
      summary: (outcomeCapture.observed_outcome as string) ?? (outcomeCapture.title as string),
      insights: [
        { question: "What action was taken?", answer: (outcomeCapture.action_taken as string) ?? "Not recorded" },
        { question: "What was observed?", answer: (outcomeCapture.observed_outcome as string) ?? "Not recorded" },
        { question: "Were there unexpected consequences?", answer: JSON.stringify(outcomeCapture.unexpected_consequences ?? []) },
      ],
      artifacts: [],
      body_md: outcomeCapture.body_md as string | null,
      transformation_log: logEntries(outcomeCapture.transformation_log),
      relatedPath: `${base}/outcome`,
    });
  }

  if (chain?.learning) {
    const { data: lu } = await supabase
      .from("learning_updates")
      .select("*")
      .eq("external_id", chain.learning)
      .maybeSingle();

    stages.push({
      id: "learning",
      label: "Learning",
      externalId: chain.learning,
      status: (lu?.status as string) ?? "pending",
      complete: !!chain.learning,
      summary: (lu?.validation_basis as string) ?? (lu?.title as string) ?? "Learning update recorded",
      insights: [
        { question: "What learning will occur after this decision?", answer: (lu?.validation_basis as string) ?? lu?.title ?? "See learning update artifact" },
        { question: "What is the promotion status?", answer: (lu?.promotion_status as string) ?? "Pending memory promotion" },
        { question: "What type of learning is this?", answer: (lu?.learning_type as string) ?? "Not classified" },
      ],
      artifacts: [],
      body_md: lu?.body_md,
      transformation_log: logEntries(lu?.transformation_log),
    });
  }

  return {
    situationSlug,
    situationTitle: situation.title,
    stages,
    chain,
  };
}

export async function getRuntimeObservability(
  situationSlug: string
): Promise<RuntimeObservability | null> {
  const pipeline = await getSituationPipeline(situationSlug);
  if (!pipeline) return null;

  const { situation, stages, chain, recommendationPackage } = pipeline;
  const evidenceView = chain ? await getEvidenceView(situationSlug) : null;
  const reasoning = chain ? await getReasoningView(situationSlug) : null;

  const evidenceCount = evidenceView
    ? evidenceView.executiveMemory.length +
      evidenceView.personMemory.length +
      evidenceView.relationshipMemory.length +
      evidenceView.retrievedKnowledge.length +
      evidenceView.patterns.length +
      evidenceView.outcomeHistory.length +
      evidenceView.supportingEvidence.length
    : 0;

  const completedStages = stages.filter((s) => s.complete).length;
  const currentStage =
    stages.find((s) => !s.complete)?.label ?? (completedStages === stages.length ? "Complete" : "Situation");

  const uncertaintyFlags = [
    ...((reasoning?.packageSummary?.uncertainty_flags as string[]) ?? []),
    ...((recommendationPackage?.uncertainty_flags as string[]) ?? []),
  ];

  let pipelineStatus: RuntimeObservability["pipelineStatus"] = "none";
  if (completedStages === stages.length) pipelineStatus = "complete";
  else if (completedStages > 1) pipelineStatus = "partial";

  return {
    activeSituation: situation.title,
    situationStatus: situation.status,
    contextCount: chain?.context_spec ? 1 : 0,
    evidenceCount,
    contradictoryEvidenceCount: evidenceView?.contradictoryEvidence.length ?? 0,
    assumptionCount: reasoning?.assumptions.length ?? 0,
    interpretationConfidence: reasoning?.packageSummary?.confidence_summary ?? null,
    recommendationConfidence: (recommendationPackage?.confidence_summary as string) ?? null,
    uncertaintyFlags: [...new Set(uncertaintyFlags)],
    completedStages,
    totalStages: stages.length,
    currentStage,
    pipelineStatus,
  };
}
