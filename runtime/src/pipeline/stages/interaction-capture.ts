import { randomUUID } from "node:crypto";
import { getSupabase } from "../../shared/supabase.js";
import type { PipelineContext } from "../../types/pipeline.js";
import { persistStructuredCapture } from "../capture/structured-capture.js";
import { persistRuntimeTrace } from "../../shared/runtime-trace-store.js";

/**
 * Interaction Capture — persists conversation messages and Build 16 structured
 * cold-start records. Message persistence failures are explicit (not silent).
 */
export async function interactionCaptureStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();

  let conversationId = ctx.request.conversationId;
  let persistenceStatus: "persisted" | "failed" = "persisted";

  try {
    if (!conversationId) {
      const externalId = `CONV-RUNTIME-${randomUUID().slice(0, 8)}`;
      const { data: conv, error: convError } = await supabase
        .from("executive_conversations")
        .insert({
          external_id: externalId,
          status: "active",
          classification: "executive_work",
          executive_id: ctx.executive?.id ?? null,
          situation_id: ctx.situation?.id ?? null,
          situation_slug: ctx.situation?.slug ?? null,
        })
        .select("id")
        .single();

      if (convError) throw convError;
      conversationId = conv.id;
    }

    // Handoff fix: effective conversation ID is the created/reused UUID.
    ctx.request.conversationId = conversationId;
    ctx.interactionId = conversationId;

    const captureAudit = await persistStructuredCapture(ctx);
    ctx.captureAudit = captureAudit;

    if (captureAudit.situationId && conversationId) {
      await supabase
        .from("executive_conversations")
        .update({
          situation_id: captureAudit.situationId,
          situation_slug: captureAudit.situationSlug,
          executive_id: ctx.executive?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    const contextItems = ctx.contextPackage?.contextItemsSupplied ?? [];
    const messageMetaBase = {
      requestId: ctx.request.requestId,
      conversationId,
      situationId: captureAudit.situationId ?? ctx.situation?.id ?? null,
      situationSlug: captureAudit.situationSlug ?? ctx.situation?.slug ?? null,
      recordsCreated: captureAudit.created,
      recordsRetrieved: ctx.retrievalAudit?.retrieved ?? [],
      contextItems,
      captureErrors: captureAudit.errors,
      retrievalErrors: ctx.retrievalAudit?.errors ?? [],
    };

    const { error: msgError } = await supabase.from("conversation_messages").insert([
      {
        conversation_id: conversationId,
        role: "executive",
        content: ctx.request.message,
        message_type: "text",
        metadata: {
          ...messageMetaBase,
          role: "executive",
        },
      },
      {
        conversation_id: conversationId,
        role: "apexos",
        content: ctx.llmResponse?.text ?? "",
        message_type: "text",
        metadata: {
          ...messageMetaBase,
          role: "apexos",
          contextPackageId: ctx.evidence?.assembledContextPackage?.externalId ?? null,
          stages: ctx.stages.map((s) => ({
            stage: s.stage,
            status: s.status,
            durationMs: s.durationMs,
          })),
          model: ctx.llmResponse?.model,
          provider: ctx.llmResponse?.provider,
          responseId: ctx.llmResponse?.responseId ?? null,
        },
      },
    ]);

    if (msgError) throw msgError;

    try {
      await persistRuntimeTrace({
        requestId: ctx.request.requestId,
        conversationId,
        situationId: captureAudit.situationId ?? ctx.situation?.id ?? null,
        executiveSlug: ctx.executive?.slug ?? null,
        tool: "execute_runtime",
        status: "completed",
        stages: [
          ...ctx.stages,
          {
            stage: "interaction-capture",
            status: "success",
            durationMs: Date.now() - start,
            detail: `Conversation: ${conversationId}`,
          },
        ],
        recordsCreated: captureAudit.created,
        recordsRetrieved: ctx.retrievalAudit?.retrieved ?? [],
        contextItems,
        captureErrors: [...captureAudit.errors, ...(ctx.retrievalAudit?.errors ?? [])],
        metadata: {
          model: ctx.llmResponse?.model ?? null,
          provider: ctx.llmResponse?.provider ?? null,
          responseId: ctx.llmResponse?.responseId ?? null,
        },
      });
    } catch (traceErr) {
      captureAudit.errors.push(
        `trace:${traceErr instanceof Error ? traceErr.message : String(traceErr)}`
      );
    }

    ctx.stages.push({
      stage: "interaction-capture",
      status: "success",
      durationMs: Date.now() - start,
      detail: `Conversation: ${conversationId}; created ${captureAudit.created.length} structured records`,
    });
  } catch (err) {
    persistenceStatus = "failed";
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

    try {
      await persistRuntimeTrace({
        requestId: ctx.request.requestId,
        conversationId: ctx.request.conversationId,
        situationId: ctx.situation?.id ?? null,
        executiveSlug: ctx.executive?.slug ?? null,
        tool: "execute_runtime",
        status: "failed",
        stages: ctx.stages,
        recordsCreated: ctx.captureAudit?.created ?? [],
        recordsRetrieved: ctx.retrievalAudit?.retrieved ?? [],
        contextItems: ctx.contextPackage?.contextItemsSupplied ?? [],
        captureErrors: [message, ...(ctx.captureAudit?.errors ?? [])],
        metadata: { persistenceStatus },
      });
    } catch {
      // Trace write is best-effort after capture failure.
    }

    // Explicit failure status — do not swallow. Response still returned with
    // metadata.persistenceStatus = "failed" for connector inspection.
    return ctx;
  }

  return ctx;
}
