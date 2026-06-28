import { getSupabase, fetchRegistry, normalizePath } from "../shared/supabase.js";
import type { LinkSpec } from "../shared/types.js";

export async function resolvePendingLinks(pendingLinks: LinkSpec[]): Promise<{
  created: number;
  unresolved: string[];
}> {
  const supabase = getSupabase();
  const registry = await fetchRegistry();
  let created = 0;
  const unresolved: string[] = [];

  for (const link of pendingLinks) {
    const targetId = resolveTarget(link.targetRef, registry);
    if (!targetId) {
      unresolved.push(`${link.sourceTable}:${link.sourceId} → ${link.targetRef}`);
      continue;
    }

    const targetEntry = findRegistryByRecordId(registry, targetId);
    if (!targetEntry) {
      unresolved.push(`${link.sourceTable}:${link.sourceId} → ${link.targetRef} (no registry)`);
      continue;
    }

    const { error } = await supabase.from("artifact_links").insert({
      source_table: link.sourceTable,
      source_id: link.sourceId,
      target_table: targetEntry.table_name,
      target_id: targetId,
      link_type: link.linkType,
      tier: link.tier ?? null,
    });

    if (error) {
      if (error.code === "23505") continue;
      unresolved.push(`${link.linkType}: ${error.message}`);
    } else {
      created++;
    }
  }

  return { created, unresolved };
}

function resolveTarget(
  ref: string,
  registry: Map<string, { record_id: string; repository_path?: string; external_id: string }>
): string | null {
  const normalized = normalizePath(ref);
  if (registry.has(normalized)) return registry.get(normalized)!.record_id;
  if (registry.has(ref)) return registry.get(ref)!.record_id;

  const suffix = normalized.split("/").pop() ?? normalized;
  for (const [key, entry] of registry) {
    if (key.endsWith(suffix)) return entry.record_id;
  }
  return null;
}

function findRegistryByRecordId(
  registry: Map<string, { record_id: string; table_name: string }>,
  recordId: string
): { table_name: string } | null {
  for (const entry of registry.values()) {
    if (entry.record_id === recordId) return entry;
  }
  return null;
}

export async function backfillPipelineLinks(): Promise<void> {
  const supabase = getSupabase();

  const backfills = [
    {
      parent: "context_relevance_specs",
      child: "retrieval_requests",
      parentFk: "retrieval_request_id",
      childMatch: (p: { id: string }, c: { context_reference_id: string }) =>
        c.context_reference_id === p.id,
    },
    {
      parent: "retrieval_requests",
      child: "evidence_packages",
      parentFk: "evidence_package_id",
      childMatch: (p: { id: string }, c: { retrieval_request_id: string }) =>
        c.retrieval_request_id === p.id,
    },
    {
      parent: "retrieval_requests",
      child: "assembled_context_packages",
      parentFk: "assembled_context_package_id",
      childMatch: (p: { id: string }, c: { retrieval_request_id: string }) =>
        c.retrieval_request_id === p.id,
    },
    {
      parent: "outcome_captures",
      child: "validation_packages",
      parentFk: "related_validation_package_id",
      childMatch: (p: { id: string }, c: { outcome_capture_id: string }) =>
        c.outcome_capture_id === p.id,
    },
    {
      parent: "validation_packages",
      child: "learning_updates",
      parentFk: "learning_promoted_id",
      childMatch: (p: { id: string }, c: { validation_package_id: string }) =>
        c.validation_package_id === p.id,
    },
  ];

  for (const bf of backfills) {
    const { data: parents } = await supabase.from(bf.parent).select("*");
    const { data: children } = await supabase.from(bf.child).select("*");

    for (const parent of parents ?? []) {
      const match = (children ?? []).find((c) => bf.childMatch(parent, c));
      if (match && !parent[bf.parentFk]) {
        await supabase
          .from(bf.parent)
          .update({ [bf.parentFk]: match.id })
          .eq("id", parent.id);
      }
    }
  }
}

export const TRACEABILITY_QUERY = `
SELECT
  crs.external_id AS context_spec,
  crs.repository_path AS context_spec_path,
  rr.external_id AS retrieval_request,
  ep.external_id AS evidence_package,
  acp.external_id AS context_package,
  ip.external_id AS interpretation,
  rp.external_id AS recommendation,
  oc.external_id AS outcome_capture,
  vp.external_id AS validation,
  lu.external_id AS learning
FROM context_relevance_specs crs
JOIN retrieval_requests rr ON rr.context_reference_id = crs.id
JOIN evidence_packages ep ON ep.retrieval_request_id = rr.id
JOIN assembled_context_packages acp ON acp.retrieval_request_id = rr.id
JOIN interpretation_packages ip ON ip.assembled_context_package_id = acp.id
JOIN recommendation_packages rp ON rp.interpretation_package_id = ip.id
JOIN outcome_captures oc ON oc.recommendation_package_id = rp.id
JOIN validation_packages vp ON vp.outcome_capture_id = oc.id
LEFT JOIN learning_updates lu ON lu.validation_package_id = vp.id
WHERE crs.external_id = 'CTX-PKG-001';
`;
