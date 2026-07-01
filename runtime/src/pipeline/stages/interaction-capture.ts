import { randomUUID } from "node:crypto";
import { getSupabase } from "../../shared/supabase.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * Interaction Capture — persists the executive request and runtime response.
 * Uses existing Build 11 conversation tables; no schema changes required.
 */
export async function interactionCaptureStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();

  try {
    let conversationId = ctx.request.conversationId;

    if (!conversationId) {
      const externalId = `CONV-RUNTIME-${randomUUID().slice(0, 8)}`;
      const { data: conv, error: convError } = await supabase
        .from("executive_conversations")
        .insert({
          external_id: externalId,
          status: "active",
          classification: "executive_work",
          situation_id: ctx.situation?.id ?? null,
          situation_slug: ctx.situation?.slug ?? null,
        })
        .select("id")
        .single();

      if (convError) throw convError;
      conversationId = conv.id;
    }

    const contextPackageMeta = {
      requestId: ctx.request.requestId,
      contextPackageId: ctx.evidence?.assembledContextPackage?.externalId ?? null,
      stages: ctx.stages.map((s) => ({ stage: s.stage, status: s.status, durationMs: s.durationMs })),
      model: ctx.llmResponse?.model,
      provider: ctx.llmResponse?.provider,
    };

    await supabase.from("conversation_messages").insert([
      {
        conversation_id: conversationId,
        role: "executive",
        content: ctx.request.message,
        message_type: "text",
        metadata: { requestId: ctx.request.requestId },
      },
      {
        conversation_id: conversationId,
        role: "apexos",
        content: ctx.llmResponse?.text ?? "",
        message_type: "text",
        metadata: contextPackageMeta,
      },
    ]);

    ctx.interactionId = conversationId;
    ctx.stages.push({
      stage: "interaction-capture",
      status: "success",
      durationMs: Date.now() - start,
      detail: `Conversation: ${conversationId}`,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Interaction capture failed";
    ctx.stages.push({
      stage: "interaction-capture",
      status: "failed",
      durationMs: Date.now() - start,
      detail: message,
    });
  }

  return ctx;
}
