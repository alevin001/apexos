import { getSupabase } from "../../shared/supabase.js";
import type { ContextRelevanceData } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * Context Retrieval — loads context relevance specification for the situation.
 * Reads from context_relevance_specs linked to the current situation.
 */
export async function contextRetrievalStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();

  if (!ctx.situation) {
    ctx.stages.push({
      stage: "context-retrieval",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: "No situation — context retrieval skipped",
    });
    return ctx;
  }

  const { data: crs } = await supabase
    .from("context_relevance_specs")
    .select("*")
    .eq("related_situation_id", ctx.situation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!crs) {
    const { data: fallback } = await supabase
      .from("context_relevance_specs")
      .select("*")
      .ilike("repository_path", `%${ctx.situation.slug}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback) {
      ctx.contextRelevance = mapContextRelevance(fallback);
    }
  } else {
    ctx.contextRelevance = mapContextRelevance(crs);
  }

  ctx.stages.push({
    stage: "context-retrieval",
    status: ctx.contextRelevance ? "success" : "skipped",
    durationMs: Date.now() - start,
    detail: ctx.contextRelevance
      ? `Context spec: ${ctx.contextRelevance.externalId}`
      : "No context relevance spec found",
  });

  return ctx;
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
