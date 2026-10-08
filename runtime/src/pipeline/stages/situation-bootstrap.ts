import { randomUUID } from "node:crypto";
import { getSupabase } from "../../shared/supabase.js";
import type { PipelineContext } from "../../types/pipeline.js";
import { extractColdStart } from "../capture/cold-start-extractor.js";

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * Situation Bootstrap — creates a situation early when cold-start material is
 * present so context relevance + evidence assembly can link before LLM.
 * Does not invent people/facts beyond the executive message heuristics.
 */
export async function situationBootstrapStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const forceNew = ctx.request.metadata?.forceNewSituation === true;

  if (ctx.situation && !forceNew) {
    ctx.stages.push({
      stage: "situation-bootstrap",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: `Situation already resolved: ${ctx.situation.slug}`,
    });
    return ctx;
  }

  if (forceNew && ctx.situation) {
    // Explicit new-situation request — do not keep a prior active situation.
    ctx.situation = null;
    ctx.request.situationSlug = null;
  }

  const extraction = extractColdStart(ctx.request.message);
  if (!extraction.isMaterialSituation && !forceNew) {
    ctx.stages.push({
      stage: "situation-bootstrap",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: "No material situation — bootstrap skipped",
    });
    return ctx;
  }

  if (!extraction.isMaterialSituation && forceNew) {
    // Still create a situation shell when the executive demanded a new one.
    extraction.isMaterialSituation = true;
  }

  const supabase = getSupabase();
  const externalId = `SIT-RT-${shortId()}`;
  const slug = `runtime-${shortId()}-${extraction.situationType}`.slice(0, 80);

  const { data: sit, error } = await supabase
    .from("situations")
    .insert({
      external_id: externalId,
      slug,
      title: extraction.title.slice(0, 200),
      situation_summary: extraction.summary,
      situation_type: extraction.situationType,
      status: "active",
      architecture_layer: "foundations",
      repository_path: `runtime/capture/situations/${slug}.md`,
      source_document: "runtime/build-16-cold-start",
      transformation_log: [
        {
          at: new Date().toISOString(),
          action: "situation_bootstrap",
          requestId: ctx.request.requestId,
          conversationId: ctx.request.conversationId,
        },
      ],
    })
    .select("id, slug, title, situation_summary, situation_type")
    .single();

  if (error) {
    ctx.stages.push({
      stage: "situation-bootstrap",
      status: "failed",
      durationMs: Date.now() - start,
      detail: error.message,
    });
    return ctx;
  }

  ctx.situation = {
    id: sit.id,
    slug: sit.slug,
    title: sit.title,
    summary: sit.situation_summary ?? undefined,
    situationType: sit.situation_type ?? undefined,
  };
  ctx.request.situationSlug = sit.slug;

  // Seed capture audit so later stages know the situation was created here.
  ctx.captureAudit = {
    created: [
      {
        table: "situations",
        id: sit.id,
        type: "situation",
        externalId,
      },
    ],
    situationId: sit.id,
    situationSlug: sit.slug,
    errors: [],
    extraction,
  };

  ctx.stages.push({
    stage: "situation-bootstrap",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Situation bootstrapped: ${externalId}`,
  });

  return ctx;
}
