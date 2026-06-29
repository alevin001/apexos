import { getSupabaseServer } from "./supabase-server";
import type { EvidenceView } from "@/types/executive";
import {
  queryTraceabilityChainForSituation,
  enrichTierItems,
  parseTierEntries,
  categorizeEvidencePath,
  resolveArtifactByPath,
} from "./pipeline-service";

export { parseTierEntries };

export async function getEvidenceView(situationSlug: string): Promise<EvidenceView | null> {
  const chain = await queryTraceabilityChainForSituation(situationSlug);
  if (!chain?.context_spec) return null;

  const supabase = getSupabaseServer();

  const { data: contextSpec } = await supabase
    .from("context_relevance_specs")
    .select("*")
    .eq("external_id", chain.context_spec)
    .maybeSingle();

  const { data: rr } = await supabase
    .from("retrieval_requests")
    .select("id")
    .eq("external_id", chain.retrieval_request)
    .maybeSingle();

  let evidencePackage = null;
  if (chain.evidence_package) {
    const { data } = await supabase
      .from("evidence_packages")
      .select("*")
      .eq("external_id", chain.evidence_package)
      .maybeSingle();
    evidencePackage = data;
  }

  const view: EvidenceView = {
    executiveMemory: [],
    personMemory: [],
    relationshipMemory: [],
    context: contextSpec
      ? {
          spec: {
            title: contextSpec.title,
            situation_summary: contextSpec.situation_summary,
            domain_weights: (contextSpec.domain_weights as Record<string, string>) ?? {},
            body_md: contextSpec.body_md,
          },
        }
      : null,
    retrievedKnowledge: [],
    patterns: [],
    outcomeHistory: [],
    supportingEvidence: [],
    contradictoryEvidence: [],
  };

  if (evidencePackage?.assembly_tiers) {
    const tiers = evidencePackage.assembly_tiers as Record<string, unknown>;
    const allItems = [
      ...parseTierEntries(tiers, "critical"),
      ...parseTierEntries(tiers, "supporting"),
      ...parseTierEntries(tiers, "available"),
    ];
    const enriched = await enrichTierItems(allItems);

    for (const item of enriched) {
      const resolved = await resolveArtifactByPath(item.path);
      const cat = categorizeEvidencePath(item.path, resolved?.table_name);
      const fullItem = { ...item, ...resolved };

      if (item.tier === "supporting" || item.tier === "available") {
        if (cat !== "executive" && cat !== "person" && cat !== "relationship") {
          view.supportingEvidence.push(fullItem);
        }
      }

      switch (cat) {
        case "executive":
          view.executiveMemory.push(fullItem);
          break;
        case "person":
          view.personMemory.push(fullItem);
          break;
        case "relationship":
          view.relationshipMemory.push(fullItem);
          break;
        case "knowledge":
          view.retrievedKnowledge.push(fullItem);
          break;
        case "pattern":
          view.patterns.push(fullItem);
          break;
        case "outcome":
          view.outcomeHistory.push(fullItem);
          break;
        default:
          if (item.tier === "critical") {
            view.retrievedKnowledge.push(fullItem);
          } else {
            view.supportingEvidence.push(fullItem);
          }
      }
    }
  }

  if (rr?.id) {
    const { data: contradictions } = await supabase
      .from("contradictory_evidence_records")
      .select("*")
      .eq("retrieval_request_id", rr.id);

    view.contradictoryEvidence = (contradictions ?? []).map((c) => ({
      title: c.title,
      conflicting_sources: c.conflicting_sources,
      resolution_status: c.resolution_status,
      body_md: c.body_md,
    }));
  }

  return view;
}
