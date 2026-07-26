import { randomUUID } from "node:crypto";
import { runtimeConfig } from "../../config.js";
import { RuntimeError } from "../../shared/errors.js";
import { resolveExecutiveSlug } from "../../shared/executive-identity.js";
import type { ExecutiveRequest, ValidatedRequest } from "../../types/executive-request.js";
import type { PipelineContext } from "../../types/pipeline.js";
import { getSupabase } from "../../shared/supabase.js";

/**
 * Runtime Entry — validates and normalizes the incoming executive request.
 * Resolves executive identity and optional situation reference.
 */
export async function runtimeEntry(
  request: ExecutiveRequest
): Promise<ValidatedRequest> {
  if (!request.message?.trim()) {
    throw new RuntimeError("Executive message is required", "INVALID_REQUEST", "runtime-entry");
  }

  const executiveSlug = resolveExecutiveSlug(
    request.executiveSlug ?? runtimeConfig.executiveSlug
  );
  const supabase = getSupabase();

  const { data: executive } = await supabase
    .from("executives")
    .select("slug")
    .eq("slug", executiveSlug)
    .maybeSingle();

  if (!executive) {
    throw new RuntimeError(
      `Executive not found: ${executiveSlug}`,
      "EXECUTIVE_NOT_FOUND",
      "runtime-entry"
    );
  }

  let situationSlug = request.situationSlug ?? null;
  if (situationSlug) {
    const { data: situation } = await supabase
      .from("situations")
      .select("slug")
      .eq("slug", situationSlug)
      .maybeSingle();
    if (!situation) {
      throw new RuntimeError(
        `Situation not found: ${situationSlug}`,
        "SITUATION_NOT_FOUND",
        "runtime-entry"
      );
    }
  }

  return {
    requestId: randomUUID(),
    message: request.message.trim(),
    executiveSlug,
    situationSlug,
    conversationId: request.conversationId ?? null,
    previousResponseId: request.previousResponseId ?? null,
    receivedAt: new Date().toISOString(),
    metadata: request.metadata ?? {},
  };
}

export async function runtimeEntryStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();

  const { data: executive } = await supabase
    .from("executives")
    .select("id, slug, display_name, summary")
    .eq("slug", ctx.request.executiveSlug)
    .single();

  if (!executive) {
    throw new RuntimeError(
      `Executive not found: ${ctx.request.executiveSlug}`,
      "EXECUTIVE_NOT_FOUND",
      "runtime-entry"
    );
  }

  ctx.executive = {
    id: executive.id,
    slug: executive.slug,
    displayName: executive.display_name,
    summary: executive.summary ?? undefined,
  };

  if (ctx.request.situationSlug) {
    const { data: situation } = await supabase
      .from("situations")
      .select("id, slug, title, situation_summary, situation_type")
      .eq("slug", ctx.request.situationSlug)
      .single();

    if (!situation) {
      throw new RuntimeError(
        `Situation not found: ${ctx.request.situationSlug}`,
        "SITUATION_NOT_FOUND",
        "runtime-entry"
      );
    }

    ctx.situation = {
      id: situation.id,
      slug: situation.slug,
      title: situation.title,
      summary: situation.situation_summary ?? undefined,
      situationType: situation.situation_type ?? undefined,
    };
  }

  ctx.stages.push({
    stage: "runtime-entry",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Executive: ${ctx.executive.slug}, Situation: ${ctx.situation?.slug ?? "none"}`,
  });

  return ctx;
}
