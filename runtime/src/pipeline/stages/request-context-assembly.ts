import { randomUUID } from "node:crypto";
import { getSupabase } from "../../shared/supabase.js";
import type { ContextRelevanceData, EvidenceAssembly } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapContextRelevance(row: Record<string, unknown>): ContextRelevanceData {
  return {
    externalId: row.external_id as string,
    title: row.title as string,
    situationSummary: row.situation_summary as string,
    domainWeights: (row.domain_weights as Record<string, string>) ?? {},
    weightingRationale: row.weighting_rationale as string,
    retrievalTiers: (row.retrieval_tiers as Record<string, unknown>) ?? {},
    bodyMd: row.body_md as string | undefined,
  };
}

/**
 * Ensure a Context Relevance Spec exists for the current situation.
 * Creates a request-scoped draft CRS with explicit limitations when none exists.
 * Never invents source evidence — documents only what the pipeline already retrieved.
 */
export async function ensureContextRelevanceForSituation(
  ctx: PipelineContext
): Promise<ContextRelevanceData | null> {
  if (!ctx.situation) return null;
  if (ctx.contextRelevance) return ctx.contextRelevance;

  const supabase = getSupabase();
  const retrieved = ctx.retrievalAudit?.retrieved ?? [];
  const contextItems = ctx.retrievalAudit?.contextItems ?? [];
  const knowledgeCount = retrieved.filter((r) => r.table === "knowledge_retrieval_units").length;
  const limitations = [
    "Request-scoped context relevance — not a pre-ingested scenario CRS.",
    knowledgeCount === 0
      ? "No governed knowledge units matched; only the executive statement and any continuity/memory are available."
      : `${knowledgeCount} governed knowledge unit(s) retrieved for this request.`,
    "Do not treat this specification as validated institutional evidence beyond listed items.",
  ];

  const externalId = `CRS-RT-${shortId()}`;
  const title = `Runtime context relevance — ${ctx.situation.title}`.slice(0, 200);
  const situationSummary = (ctx.situation.summary ?? ctx.request.message).slice(0, 2000);
  const bodyMd = [
    `# ${title}`,
    ``,
    `**Situation:** ${ctx.situation.slug}`,
    `**Request:** ${ctx.request.requestId}`,
    ``,
    `## Limitations`,
    ...limitations.map((l) => `- ${l}`),
    ``,
    `## Retrieved context item labels`,
    ...(contextItems.length ? contextItems.map((c) => `- ${c}`) : ["- (none)"]),
  ].join("\n");

  const { data, error } = await supabase
    .from("context_relevance_specs")
    .insert({
      external_id: externalId,
      domain: "situation",
      title,
      situation_summary: situationSummary,
      evaluation_date: today(),
      related_situation_id: ctx.situation.id,
      domain_weights: {
        situation: "primary",
        knowledge: knowledgeCount > 0 ? "supporting" : "unavailable",
        memory: "supporting",
      },
      weighting_rationale: limitations.join(" "),
      retrieval_tiers: {
        tier1_executive_statement: true,
        tier2_knowledge_units: knowledgeCount,
        tier3_continuity_memory: true,
      },
      review_status: "pending",
      status: "draft",
      architecture_layer: "context",
      repository_path: `runtime/capture/context/${externalId}.md`,
      source_document: "runtime/request-context-assembly",
      body_md: bodyMd,
      transformation_log: [
        {
          at: new Date().toISOString(),
          action: "request_scoped_crs",
          requestId: ctx.request.requestId,
          limitations,
        },
      ],
    })
    .select("*")
    .single();

  if (error) return null;
  return mapContextRelevance(data as Record<string, unknown>);
}

/**
 * Ensure retrieval → evidence → assembled context package chain exists for CRS.
 * Creates request-scoped records from already-retrieved pipeline artifacts only.
 */
export async function ensureAssembledContextForRequest(
  ctx: PipelineContext,
  crsExternalId: string
): Promise<EvidenceAssembly> {
  const empty: EvidenceAssembly = {
    evidencePackage: null,
    contradictoryEvidence: [],
    assembledContextPackage: null,
    retrievalRequest: null,
  };

  const supabase = getSupabase();
  const { data: crsRow } = await supabase
    .from("context_relevance_specs")
    .select("id, title, situation_summary")
    .eq("external_id", crsExternalId)
    .maybeSingle();

  if (!crsRow) return empty;

  const { data: existingRr } = await supabase
    .from("retrieval_requests")
    .select("*")
    .eq("context_reference_id", crsRow.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRr) {
    const { data: ep } = await supabase
      .from("evidence_packages")
      .select("*")
      .eq("retrieval_request_id", existingRr.id)
      .maybeSingle();
    const { data: acp } = await supabase
      .from("assembled_context_packages")
      .select("*")
      .eq("retrieval_request_id", existingRr.id)
      .maybeSingle();

    if (ep && acp) {
      return {
        retrievalRequest: {
          externalId: existingRr.external_id,
          title: existingRr.title,
          scopeSummary: existingRr.scope_summary,
        },
        evidencePackage: {
          externalId: ep.external_id,
          title: ep.title,
          assemblyTiers: (ep.assembly_tiers as Record<string, unknown>) ?? {},
          gaps: (ep.gaps as unknown[]) ?? [],
          bodyMd: ep.body_md ?? undefined,
        },
        assembledContextPackage: {
          externalId: acp.external_id,
          title: acp.title,
          assemblyTiers: (acp.assembly_tiers as Record<string, unknown>) ?? {},
          bodyMd: acp.body_md ?? undefined,
        },
        contradictoryEvidence: [],
      };
    }
  }

  const retrieved = ctx.retrievalAudit?.retrieved ?? [];
  const contextItems = ctx.retrievalAudit?.contextItems ?? [];
  const knowledgeRefs = retrieved.filter((r) => r.table === "knowledge_retrieval_units");
  const gaps = [
    "Request-scoped assembly — not a pre-ingested scenario evidence package.",
    knowledgeRefs.length === 0
      ? "No governed knowledge units retrieved; evidence limited to executive statement and continuity/memory if present."
      : null,
    "Do not fabricate additional evidence beyond listed retrieval refs.",
  ].filter(Boolean);

  const rrExternalId = `RR-RT-${shortId()}`;
  const epExternalId = `EP-RT-${shortId()}`;
  const acpExternalId = `ACP-RT-${shortId()}`;

  const scopeSummary = [
    `Request ${ctx.request.requestId}`,
    `Situation ${ctx.situation?.slug ?? "none"}`,
    `${knowledgeRefs.length} knowledge unit(s)`,
    `${contextItems.length} context item label(s)`,
  ].join("; ");

  const epBody = [
    `# Evidence package (request-scoped)`,
    ``,
    `## Gaps / limitations`,
    ...gaps.map((g) => `- ${g}`),
    ``,
    `## Retrieved refs`,
    ...(retrieved.length
      ? retrieved.map(
          (r) =>
            `- ${r.table}:${r.externalId ?? r.id}${r.type ? ` (${r.type})` : ""}`
        )
      : ["- (none beyond executive message)"]),
  ].join("\n");

  const acpBody = [
    `# Assembled context package (request-scoped)`,
    ``,
    `Linked CRS: ${crsExternalId}`,
    `Linked retrieval: ${rrExternalId}`,
    `Linked evidence: ${epExternalId}`,
    ``,
    `## Context item labels supplied downstream`,
    ...(contextItems.length ? contextItems.map((c) => `- ${c}`) : ["- (none)"]),
    ``,
    `## Limitations`,
    ...gaps.map((g) => `- ${g}`),
  ].join("\n");

  const { data: rr, error: rrErr } = await supabase
    .from("retrieval_requests")
    .insert({
      external_id: rrExternalId,
      title: `Runtime retrieval — ${ctx.situation?.title ?? "request"}`.slice(0, 200),
      request_date: today(),
      context_reference_id: crsRow.id,
      retrieval_targets: ["executive_statement", "knowledge_retrieval_units", "memory", "continuity"],
      scope_summary: scopeSummary,
      tier_requirements: {
        requestScoped: true,
        knowledgeUnits: knowledgeRefs.length,
      },
      exclusions: ["fabricated_evidence"],
      contradictory_evidence_required: false,
      validation_status: "pending",
      status: "draft",
      architecture_layer: "retrieval",
      repository_path: `runtime/capture/retrieval/${rrExternalId}.md`,
      source_document: "runtime/request-context-assembly",
      body_md: scopeSummary,
      transformation_log: [
        {
          at: new Date().toISOString(),
          action: "request_scoped_retrieval",
          requestId: ctx.request.requestId,
        },
      ],
    })
    .select("*")
    .single();

  if (rrErr || !rr) return empty;

  const { data: ep, error: epErr } = await supabase
    .from("evidence_packages")
    .insert({
      external_id: epExternalId,
      title: `Runtime evidence — ${ctx.situation?.title ?? "request"}`.slice(0, 200),
      assembly_date: today(),
      retrieval_request_id: rr.id,
      context_reference_id: crsRow.id,
      assembly_tiers: {
        executive_statement: true,
        knowledge_units: knowledgeRefs.length,
        continuity_memory: true,
      },
      exclusions: [],
      gaps,
      status: "assembled",
      architecture_layer: "retrieval",
      repository_path: `runtime/capture/evidence/${epExternalId}.md`,
      source_document: "runtime/request-context-assembly",
      body_md: epBody,
      transformation_log: [
        {
          at: new Date().toISOString(),
          action: "request_scoped_evidence",
          requestId: ctx.request.requestId,
          retrievedCount: retrieved.length,
        },
      ],
    })
    .select("*")
    .single();

  if (epErr || !ep) return empty;

  const { data: acp, error: acpErr } = await supabase
    .from("assembled_context_packages")
    .insert({
      external_id: acpExternalId,
      title: `Runtime context package — ${ctx.situation?.title ?? "request"}`.slice(0, 200),
      assembly_date: today(),
      retrieval_request_id: rr.id,
      evidence_package_id: ep.id,
      context_reference_id: crsRow.id,
      assembly_tiers: {
        requestScoped: true,
        linkedSituation: ctx.situation?.slug ?? null,
        linkedCrs: crsExternalId,
      },
      status: "delivered",
      architecture_layer: "retrieval",
      repository_path: `runtime/capture/assembled/${acpExternalId}.md`,
      source_document: "runtime/request-context-assembly",
      body_md: acpBody,
      transformation_log: [
        {
          at: new Date().toISOString(),
          action: "request_scoped_acp",
          requestId: ctx.request.requestId,
        },
      ],
    })
    .select("*")
    .single();

  if (acpErr || !acp) return empty;

  await supabase
    .from("retrieval_requests")
    .update({
      evidence_package_id: ep.id,
      assembled_context_package_id: acp.id,
    })
    .eq("id", rr.id);

  await supabase
    .from("context_relevance_specs")
    .update({ retrieval_request_id: rr.id })
    .eq("id", crsRow.id);

  if (ctx.captureAudit) {
    ctx.captureAudit.created.push(
      {
        table: "context_relevance_specs",
        id: crsRow.id,
        type: "context_relevance",
        externalId: crsExternalId,
      },
      {
        table: "retrieval_requests",
        id: rr.id,
        type: "retrieval_request",
        externalId: rrExternalId,
      },
      {
        table: "evidence_packages",
        id: ep.id,
        type: "evidence_package",
        externalId: epExternalId,
      },
      {
        table: "assembled_context_packages",
        id: acp.id,
        type: "assembled_context_package",
        externalId: acpExternalId,
      }
    );
  }

  return {
    retrievalRequest: {
      externalId: rr.external_id,
      title: rr.title,
      scopeSummary: rr.scope_summary,
    },
    evidencePackage: {
      externalId: ep.external_id,
      title: ep.title,
      assemblyTiers: (ep.assembly_tiers as Record<string, unknown>) ?? {},
      gaps: (ep.gaps as unknown[]) ?? [],
      bodyMd: ep.body_md ?? undefined,
    },
    assembledContextPackage: {
      externalId: acp.external_id,
      title: acp.title,
      assemblyTiers: (acp.assembly_tiers as Record<string, unknown>) ?? {},
      bodyMd: acp.body_md ?? undefined,
    },
    contradictoryEvidence: [],
  };
}
