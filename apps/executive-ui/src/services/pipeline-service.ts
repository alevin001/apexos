import { getSupabaseServer } from "./supabase-server";
import type { Situation, TraceabilityChain, PipelineStage, SituationPipeline } from "@/types/executive";

export async function getSituationBySlug(slug: string): Promise<Situation | null> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("situations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data as Situation | null;
}

export async function queryTraceabilityChainForSituation(
  situationSlug: string
): Promise<TraceabilityChain | null> {
  const supabase = getSupabaseServer();

  const { data: situation } = await supabase
    .from("situations")
    .select("id")
    .eq("slug", situationSlug)
    .maybeSingle();

  if (!situation) return null;

  const { data: crs } = await supabase
    .from("context_relevance_specs")
    .select("id, external_id")
    .eq("related_situation_id", situation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let contextSpec = crs;

  if (!contextSpec) {
    const { data: fallback } = await supabase
      .from("context_relevance_specs")
      .select("id, external_id")
      .ilike("repository_path", `%${situationSlug}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    contextSpec = fallback;
  }

  if (!contextSpec) return null;

  const { data: rr } = await supabase
    .from("retrieval_requests")
    .select("id, external_id")
    .eq("context_reference_id", contextSpec.id)
    .maybeSingle();

  if (!rr) return null;

  const { data: ep } = await supabase
    .from("evidence_packages")
    .select("external_id")
    .eq("retrieval_request_id", rr.id)
    .maybeSingle();

  const { data: acp } = await supabase
    .from("assembled_context_packages")
    .select("id, external_id")
    .eq("retrieval_request_id", rr.id)
    .maybeSingle();

  if (!acp) return null;

  const { data: ip } = await supabase
    .from("interpretation_packages")
    .select("id, external_id")
    .eq("assembled_context_package_id", acp.id)
    .maybeSingle();

  if (!ip) return null;

  const { data: rp } = await supabase
    .from("recommendation_packages")
    .select("id, external_id")
    .eq("interpretation_package_id", ip.id)
    .maybeSingle();

  if (!rp) return null;

  const { data: oc } = await supabase
    .from("outcome_captures")
    .select("id, external_id")
    .eq("recommendation_package_id", rp.id)
    .maybeSingle();

  let validationId = "";
  let learningId = "";

  if (oc) {
    const { data: vp } = await supabase
      .from("validation_packages")
      .select("id, external_id")
      .eq("outcome_capture_id", oc.id)
      .maybeSingle();

    if (vp) {
      validationId = vp.external_id;
      const { data: lu } = await supabase
        .from("learning_updates")
        .select("external_id")
        .eq("validation_package_id", vp.id)
        .maybeSingle();
      learningId = lu?.external_id ?? "";
    }
  }

  return {
    context_spec: contextSpec.external_id,
    context_spec_id: contextSpec.id,
    retrieval_request: rr.external_id,
    evidence_package: ep?.external_id ?? "",
    context_package: acp.external_id,
    interpretation: ip.external_id,
    recommendation: rp.external_id,
    outcome_capture: oc?.external_id ?? "",
    validation: validationId,
    learning: learningId,
  };
}

export async function getSituationPipeline(slug: string): Promise<SituationPipeline | null> {
  const situation = await getSituationBySlug(slug);
  if (!situation) return null;

  const chain = await queryTraceabilityChainForSituation(slug);
  const supabase = getSupabaseServer();

  let contextSpec: Record<string, unknown> | null = null;
  let recommendationPackage: Record<string, unknown> | null = null;
  let outcomeCapture: Record<string, unknown> | null = null;

  if (chain?.context_spec) {
    const { data } = await supabase
      .from("context_relevance_specs")
      .select("*")
      .eq("external_id", chain.context_spec)
      .maybeSingle();
    contextSpec = data;
  }

  if (chain?.recommendation) {
    const { data } = await supabase
      .from("recommendation_packages")
      .select("*")
      .eq("external_id", chain.recommendation)
      .maybeSingle();
    recommendationPackage = data;
  }

  if (chain?.outcome_capture) {
    const { data } = await supabase
      .from("outcome_captures")
      .select("*")
      .eq("external_id", chain.outcome_capture)
      .maybeSingle();
    outcomeCapture = data;
  }

  const stages: PipelineStage[] = [
    { label: "Situation", externalId: situation.external_id, status: situation.status, complete: true },
    { label: "Context", externalId: chain?.context_spec ?? "—", status: (contextSpec?.status as string) ?? "pending", complete: !!chain?.context_spec },
    { label: "Retrieval", externalId: chain?.retrieval_request ?? "—", status: chain?.evidence_package ? "assembled" : "pending", complete: !!chain?.evidence_package },
    { label: "Evidence", externalId: chain?.evidence_package ?? "—", status: chain?.evidence_package ? "assembled" : "pending", complete: !!chain?.evidence_package },
    { label: "Inference", externalId: chain?.interpretation ?? "—", status: chain?.interpretation ? "handed_off" : "pending", complete: !!chain?.interpretation },
    { label: "Recommendation", externalId: chain?.recommendation ?? "—", status: (recommendationPackage?.status as string) ?? "pending", complete: !!chain?.recommendation },
    { label: "Decision", externalId: (outcomeCapture?.executive_decision_reference as string) ?? "—", status: outcomeCapture?.executive_decision_reference ? "recorded" : "pending", complete: !!outcomeCapture?.executive_decision_reference },
    { label: "Outcome", externalId: chain?.outcome_capture ?? "—", status: (outcomeCapture?.status as string) ?? "pending", complete: !!chain?.outcome_capture },
    { label: "Learning", externalId: chain?.learning ?? "—", status: chain?.learning ? "promoted" : "pending", complete: !!chain?.learning },
  ];

  return { situation, chain, stages, contextSpec, recommendationPackage, outcomeCapture };
}

export async function resolveArtifactByPath(path: string): Promise<{
  title?: string;
  summary?: string;
  body_md?: string;
  table_name?: string;
} | null> {
  const supabase = getSupabaseServer();
  const normalized = path.replace(/\\/g, "/");

  const { data: reg } = await supabase
    .from("artifact_registry")
    .select("table_name, record_id, title")
    .eq("repository_path", normalized)
    .maybeSingle();

  if (!reg) return { title: path.split("/").pop() };

  const { data: row } = await supabase
    .from(reg.table_name)
    .select("title, summary, body_md")
    .eq("id", reg.record_id)
    .maybeSingle();

  return row
    ? { ...row, table_name: reg.table_name }
    : { title: reg.title, table_name: reg.table_name };
}

interface TierEntry {
  path?: string;
  note?: string;
}

export function parseTierEntries(tiers: Record<string, unknown>, tierName: string): { path: string; tier: string; note?: string }[] {
  const entries = tiers[tierName];
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => {
    if (typeof e === "string") return { path: e, tier: tierName };
    const obj = e as TierEntry;
    return { path: obj.path ?? "", tier: tierName, note: obj.note };
  }).filter((e) => e.path);
}

export async function enrichTierItems(
  items: { path: string; tier: string; note?: string }[]
): Promise<import("@/types/executive").EvidenceItem[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const artifact = await resolveArtifactByPath(item.path);
      return { ...item, ...artifact };
    })
  );
  return enriched;
}

export function categorizeEvidencePath(
  path: string,
  tableName?: string
): "executive" | "person" | "relationship" | "knowledge" | "pattern" | "outcome" | "other" {
  const p = path.toLowerCase();
  if (tableName === "memory_artifacts" || p.includes("/memory/")) {
    if (p.includes("executive")) return "executive";
    if (p.includes("person")) return "person";
    if (p.includes("relationship")) return "relationship";
    if (p.includes("pattern")) return "pattern";
    if (p.includes("outcome")) return "outcome";
    if (p.includes("situation")) return "executive";
  }
  if (tableName === "knowledge_sources" || p.includes("/knowledge/")) return "knowledge";
  if (tableName === "patterns" || p.includes("pattern")) return "pattern";
  if (p.includes("/foundations/person")) return "person";
  if (p.includes("/foundations/")) return "other";
  return "other";
}
