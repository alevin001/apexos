import { getSupabase } from "../../shared/supabase.js";
import type { MemoryItem } from "../../types/context-package.js";
import type { MemoryRetrievalResult, PipelineContext } from "../../types/pipeline.js";

function toMemoryItem(row: Record<string, unknown>): MemoryItem {
  return {
    externalId: row.external_id as string,
    category: (row.category as string) ?? "unknown",
    title: row.title as string,
    summary: (row.summary as string) ?? "",
    confidence: row.confidence as string | undefined,
    bodyMd: row.body_md as string | undefined,
    repositoryPath: row.repository_path as string | undefined,
  };
}

/**
 * Memory Retrieval — loads executive memory relevant to the current request.
 * Reads from memory_artifacts and observations linked to the situation.
 */
export async function memoryRetrievalStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const supabase = getSupabase();
  const situationId = ctx.situation?.id;

  const categories = ["executive", "person", "relationship", "pattern", "outcome-results"] as const;
  const result: MemoryRetrievalResult = {
    executive: [],
    person: [],
    relationship: [],
    pattern: [],
    outcomes: [],
    observations: [],
  };

  for (const category of categories) {
    let query = supabase
      .from("memory_artifacts")
      .select("external_id, category, title, summary, confidence, body_md, repository_path")
      .eq("category", category)
      .in("status", ["active", "draft", "validated"]);

    if (situationId) {
      query = query.or(`situation_id.eq.${situationId},situation_id.is.null`);
    }

    const { data } = await query.limit(20);
    const items = (data ?? []).map(toMemoryItem);

    switch (category) {
      case "executive":
        result.executive = items;
        break;
      case "person":
        result.person = items;
        break;
      case "relationship":
        result.relationship = items;
        break;
      case "pattern":
        result.pattern = items;
        break;
      case "outcome-results":
        result.outcomes = items;
        break;
    }
  }

  if (situationId) {
    const { data: observations } = await supabase
      .from("observations")
      .select("external_id, title, summary, confidence, body_md, repository_path")
      .eq("related_situation_id", situationId)
      .limit(10);

    result.observations = (observations ?? []).map((row) => ({
      externalId: row.external_id,
      category: "observation",
      title: row.title,
      summary: row.summary,
      confidence: row.confidence ?? undefined,
      bodyMd: row.body_md ?? undefined,
      repositoryPath: row.repository_path ?? undefined,
    }));
  }

  ctx.memory = result;
  ctx.stages.push({
    stage: "memory-retrieval",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Retrieved ${countMemoryItems(result)} memory items`,
  });

  return ctx;
}

function countMemoryItems(m: MemoryRetrievalResult): number {
  return (
    m.executive.length +
    m.person.length +
    m.relationship.length +
    m.pattern.length +
    m.outcomes.length +
    m.observations.length
  );
}
