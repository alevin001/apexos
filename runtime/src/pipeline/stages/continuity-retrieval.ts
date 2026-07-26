import { getSupabase } from "../../shared/supabase.js";
import type { ContinuityItem, ContinuityPackage } from "../../types/context-package.js";
import type { PipelineContext, RetrievalAudit } from "../../types/pipeline.js";
import { relevanceScore } from "../capture/cold-start-extractor.js";

const MAX_PRIOR_MESSAGES = 6;
const MAX_EVIDENCE = 8;
const MAX_INTERPRETIVE = 5;

/**
 * Continuity Retrieval — loads prior messages and structured records for a
 * conversation/situation. Relevance-bounded; does not dump full history.
 */
export async function continuityRetrievalStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const conversationId = ctx.request.conversationId;
  const audit: RetrievalAudit = { retrieved: [], contextItems: [], errors: [] };

  if (!conversationId) {
    ctx.continuity = null;
    ctx.retrievalAudit = audit;
    ctx.stages.push({
      stage: "continuity-retrieval",
      status: "skipped",
      durationMs: Date.now() - start,
      detail: "No conversationId — cold start",
    });
    return ctx;
  }

  const supabase = getSupabase();

  try {
    const { data: conversation, error: convErr } = await supabase
      .from("executive_conversations")
      .select("id, situation_id, situation_slug, situation_package")
      .eq("id", conversationId)
      .maybeSingle();

    if (convErr) throw convErr;
    if (!conversation) {
      audit.errors.push(`Conversation not found: ${conversationId}`);
      ctx.continuity = null;
      ctx.retrievalAudit = audit;
      ctx.stages.push({
        stage: "continuity-retrieval",
        status: "failed",
        durationMs: Date.now() - start,
        detail: audit.errors[0],
      });
      return ctx;
    }

    if (!ctx.situation && conversation.situation_id) {
      const { data: situation } = await supabase
        .from("situations")
        .select("id, slug, title, situation_summary, situation_type")
        .eq("id", conversation.situation_id)
        .maybeSingle();
      if (situation) {
        ctx.situation = {
          id: situation.id,
          slug: situation.slug,
          title: situation.title,
          summary: situation.situation_summary ?? undefined,
          situationType: situation.situation_type ?? undefined,
        };
        ctx.request.situationSlug = situation.slug;
      }
    }

    const situationId = ctx.situation?.id ?? conversation.situation_id ?? null;
    const query = ctx.request.message;

    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MAX_PRIOR_MESSAGES);

    const priorMessages = (messages ?? [])
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      }));

    for (const m of priorMessages) {
      audit.retrieved.push({ table: "conversation_messages", id: m.id, type: m.role });
    }

    const priorSourceEvidence: ContinuityItem[] = [];
    const savedObservations: ContinuityItem[] = [];
    const findingsHypotheses: ContinuityItem[] = [];
    const recommendations: ContinuityItem[] = [];
    const people: ContinuityItem[] = [];

    if (situationId) {
      const { data: observations } = await supabase
        .from("observations")
        .select("id, external_id, title, summary, body_md, transformation_log, created_at")
        .eq("related_situation_id", situationId)
        .order("created_at", { ascending: false })
        .limit(30);

      const scored = (observations ?? [])
        .map((row) => {
          const epistemic = extractEpistemic(row.transformation_log, row.body_md);
          const score = Math.max(
            relevanceScore(query, `${row.title} ${row.summary}`),
            0.15 // keep recent situation-linked evidence discoverable
          );
          return { row, epistemic, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_EVIDENCE);

      for (const { row, epistemic, score } of scored) {
        const item: ContinuityItem = {
          id: row.id,
          table: "observations",
          type: epistemic,
          title: row.title,
          summary: row.summary,
          epistemicType: epistemic,
          score,
        };
        audit.retrieved.push({
          table: "observations",
          id: row.id,
          type: epistemic,
          externalId: row.external_id,
        });
        if (epistemic === "source_evidence") priorSourceEvidence.push(item);
        else savedObservations.push(item);
      }

      const { data: artifacts } = await supabase
        .from("memory_artifacts")
        .select("id, external_id, title, summary, metadata, created_at")
        .eq("situation_id", situationId)
        .contains("tags", ["build16"])
        .order("created_at", { ascending: false })
        .limit(20);

      const interpretive = (artifacts ?? [])
        .map((row) => {
          const meta = (row.metadata ?? {}) as Record<string, unknown>;
          const epistemic = String(meta.epistemic_type ?? "finding");
          const score = relevanceScore(query, `${row.title} ${row.summary}`);
          return { row, epistemic, score };
        })
        .filter((x) => x.score >= 0.05)
        .sort((a, b) => b.score - a.score);

      for (const { row, epistemic, score } of interpretive.slice(0, MAX_INTERPRETIVE * 2)) {
        const item: ContinuityItem = {
          id: row.id,
          table: "memory_artifacts",
          type: epistemic,
          title: row.title,
          summary: row.summary,
          epistemicType: epistemic,
          score,
        };
        audit.retrieved.push({
          table: "memory_artifacts",
          id: row.id,
          type: epistemic,
          externalId: row.external_id,
        });
        if (epistemic === "recommendation") recommendations.push(item);
        else findingsHypotheses.push(item);
      }

      const { data: personRows } = await supabase
        .from("observations")
        .select("related_person_id")
        .eq("related_situation_id", situationId)
        .not("related_person_id", "is", null)
        .limit(20);

      const personIds = [
        ...new Set(
          (personRows ?? [])
            .map((r) => r.related_person_id as string | null)
            .filter((id): id is string => Boolean(id))
        ),
      ].slice(0, 8);

      if (personIds.length) {
        const { data: persons } = await supabase
          .from("persons")
          .select("id, external_id, display_name, slug")
          .in("id", personIds);
        for (const p of persons ?? []) {
          people.push({
            id: p.id,
            table: "persons",
            type: "person",
            title: p.display_name,
            summary: p.slug,
          });
          audit.retrieved.push({
            table: "persons",
            id: p.id,
            type: "person",
            externalId: p.external_id,
          });
        }
      }
    }

    const continuity: ContinuityPackage = {
      conversationId,
      priorMessages,
      priorSourceEvidence: priorSourceEvidence.slice(0, MAX_EVIDENCE),
      savedObservations: savedObservations.slice(0, MAX_EVIDENCE),
      findingsHypotheses: findingsHypotheses.slice(0, MAX_INTERPRETIVE),
      recommendations: recommendations.slice(0, MAX_INTERPRETIVE),
      people,
      currentMessage: query,
    };

    ctx.continuity = continuity;
    ctx.retrievalAudit = audit;
    ctx.stages.push({
      stage: "continuity-retrieval",
      status: "success",
      durationMs: Date.now() - start,
      detail: `Retrieved ${audit.retrieved.length} records for conversation ${conversationId}`,
    });
  } catch (err) {
    audit.errors.push(err instanceof Error ? err.message : String(err));
    ctx.continuity = null;
    ctx.retrievalAudit = audit;
    ctx.stages.push({
      stage: "continuity-retrieval",
      status: "failed",
      durationMs: Date.now() - start,
      detail: audit.errors.join("; "),
    });
  }

  return ctx;
}

function extractEpistemic(transformationLog: unknown, bodyMd: string | null): string {
  if (Array.isArray(transformationLog) && transformationLog[0]) {
    const first = transformationLog[0] as Record<string, unknown>;
    if (typeof first.epistemic_type === "string") return first.epistemic_type;
  }
  if (bodyMd?.includes("source_evidence")) return "source_evidence";
  return "observation";
}
