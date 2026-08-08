import { retrieveKnowledgeUnits } from "../../knowledge/retrieve.js";
import type { ContinuityItem } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * Knowledge Retrieval — relevance-bounded units from governed ingested sources.
 * Units are source_evidence only; never treated as interpretation or authority proof.
 */
export async function knowledgeRetrievalStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const audit = ctx.retrievalAudit ?? { retrieved: [], contextItems: [], errors: [] };

  try {
    const units = await retrieveKnowledgeUnits(ctx.request.message, { limit: 6 });
    const asContinuity: ContinuityItem[] = units.map((u) => ({
      id: u.id,
      table: "knowledge_retrieval_units",
      type:
        u.rankRole === "primary"
          ? "knowledge_source_excerpt_primary"
          : "knowledge_source_excerpt_subordinate",
      title: u.sourceTitle,
      summary: [
        u.rankRole === "primary" ? "[PRIMARY SOURCE]" : "[SUBORDINATE — do not distort answer]",
        `Source ID: ${u.sourceExternalId}.`,
        u.contentPreview,
        `Authority: ${u.authorityClassification}.`,
        u.whyRetrieved,
        u.transformationNote,
      ].join(" "),
      epistemicType: "source_evidence",
      score: u.score,
    }));

    if (!ctx.continuity) {
      ctx.continuity = {
        conversationId: ctx.request.conversationId ?? "none",
        priorMessages: [],
        priorSourceEvidence: asContinuity,
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: ctx.request.message,
      };
    } else {
      ctx.continuity.priorSourceEvidence = [
        ...asContinuity,
        ...ctx.continuity.priorSourceEvidence,
      ].slice(0, 12);
    }

    for (const u of units) {
      audit.retrieved.push({
        table: "knowledge_retrieval_units",
        id: u.id,
        type: "source_evidence",
        externalId: u.externalId,
      });
      audit.retrieved.push({
        table: "knowledge_sources",
        id: u.sourceId,
        type: "knowledge_source",
        externalId: u.sourceExternalId,
      });
      audit.contextItems.push(`knowledge:${u.sourceExternalId}:${u.externalId}`);
    }

    ctx.retrievalAudit = audit;
    ctx.stages.push({
      stage: "knowledge-retrieval",
      status: units.length > 0 ? "success" : "skipped",
      durationMs: Date.now() - start,
      detail:
        units.length > 0
          ? `Retrieved ${units.length} knowledge unit(s) from governed sources`
          : "No retrieval-ready knowledge units matched",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Knowledge retrieval failed";
    audit.errors.push(message);
    ctx.retrievalAudit = audit;
    ctx.stages.push({
      stage: "knowledge-retrieval",
      status: "failed",
      durationMs: Date.now() - start,
      detail: message,
    });
  }

  return ctx;
}
