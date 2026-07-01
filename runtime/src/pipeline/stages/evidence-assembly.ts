import { getSupabase } from "../../shared/supabase.js";
import type { EvidenceAssembly } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * Evidence Assembly — loads evidence packages and assembled context packages
 * from the retrieval layer for the current situation's pipeline chain.
 */
export async function evidenceAssemblyStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();

  const assembly: EvidenceAssembly = {
    evidencePackage: null,
    contradictoryEvidence: [],
    assembledContextPackage: null,
    retrievalRequest: null,
  };

  if (!ctx.contextRelevance) {
    ctx.evidence = assembly;
    ctx.stages.push({
      stage: "evidence-assembly",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: "No context relevance — evidence assembly skipped",
    });
    return ctx;
  }

  const { data: crsRow } = await supabase
    .from("context_relevance_specs")
    .select("id")
    .eq("external_id", ctx.contextRelevance.externalId)
    .single();

  if (!crsRow) {
    ctx.evidence = assembly;
    ctx.stages.push({
      stage: "evidence-assembly",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: "Context relevance record not found in database",
    });
    return ctx;
  }

  const { data: rr } = await supabase
    .from("retrieval_requests")
    .select("*")
    .eq("context_reference_id", crsRow.id)
    .maybeSingle();

  if (rr) {
    assembly.retrievalRequest = {
      externalId: rr.external_id,
      title: rr.title,
      scopeSummary: rr.scope_summary,
    };

    const { data: ep } = await supabase
      .from("evidence_packages")
      .select("*")
      .eq("retrieval_request_id", rr.id)
      .maybeSingle();

    if (ep) {
      assembly.evidencePackage = {
        externalId: ep.external_id,
        title: ep.title,
        assemblyTiers: (ep.assembly_tiers as Record<string, unknown>) ?? {},
        gaps: (ep.gaps as unknown[]) ?? [],
        bodyMd: ep.body_md ?? undefined,
      };
    }

    const { data: acp } = await supabase
      .from("assembled_context_packages")
      .select("*")
      .eq("retrieval_request_id", rr.id)
      .maybeSingle();

    if (acp) {
      assembly.assembledContextPackage = {
        externalId: acp.external_id,
        title: acp.title,
        assemblyTiers: (acp.assembly_tiers as Record<string, unknown>) ?? {},
        bodyMd: acp.body_md ?? undefined,
      };
    }

    const { data: contradictions } = await supabase
      .from("contradictory_evidence_records")
      .select("external_id, title, body_md, conflicting_sources")
      .eq("retrieval_request_id", rr.id);

    assembly.contradictoryEvidence = (contradictions ?? []).map((c) => ({
      externalId: c.external_id,
      title: c.title,
      summary: c.body_md?.slice(0, 500) ?? JSON.stringify(c.conflicting_sources ?? []),
      bodyMd: c.body_md ?? undefined,
    }));
  }

  ctx.evidence = assembly;
  ctx.stages.push({
    stage: "evidence-assembly",
    status: assembly.assembledContextPackage ? "success" : "skipped",
    durationMs: Date.now() - start,
    detail: assembly.assembledContextPackage
      ? `Evidence: ${assembly.evidencePackage?.externalId ?? "none"}, Context: ${assembly.assembledContextPackage.externalId}`
      : "No assembled evidence found",
  });

  return ctx;
}
