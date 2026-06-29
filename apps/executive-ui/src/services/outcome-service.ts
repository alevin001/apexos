import { getSupabaseServer, isTerminalStatus, appendTransformationLog } from "./supabase-server";
import type { OutcomeFormData } from "@/types/executive";

export async function recordOutcome(input: OutcomeFormData): Promise<{ external_id: string }> {
  const supabase = getSupabaseServer();

  const { data: recPkg } = await supabase
    .from("recommendation_packages")
    .select("id, external_id, interpretation_package_id, assembled_context_package_id")
    .eq("id", input.recommendation_package_id)
    .maybeSingle();

  if (!recPkg) throw new Error("Recommendation package not found");

  const { data: existing } = await supabase
    .from("outcome_captures")
    .select("*")
    .eq("recommendation_package_id", recPkg.id)
    .maybeSingle();

  if (existing && isTerminalStatus(existing.status)) {
    throw new Error(
      `Outcome ${existing.external_id} is terminal (${existing.status}). Create a new validation cycle via repository workflow.`
    );
  }

  const bodyAppend = input.learning_notes
    ? `\n\n## Learning Notes\n\n${input.learning_notes}`
    : "";

  const updateFields = {
    action_taken: input.action_taken,
    observed_outcome: input.observed_outcome,
    unexpected_consequences: input.unexpected_consequences.filter(Boolean),
    measurable_results: input.measurable_results.filter((m) => m.metric),
    status: "captured",
    body_md: existing?.body_md
      ? `${existing.body_md}${bodyAppend}`
      : `# Outcome Capture\n\n${input.action_taken}\n\n## Observed Outcome\n\n${input.observed_outcome}${bodyAppend}`,
    transformation_log: appendTransformationLog(existing?.transformation_log ?? [], {
      action: "captured",
      rationale: "Outcome recorded via executive interface",
      actor: "executive-ui",
    }),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("outcome_captures")
      .update(updateFields)
      .eq("id", existing.id)
      .select("external_id")
      .single();

    if (error) throw new Error(error.message);
    return { external_id: data.external_id };
  }

  const externalId = `OUT-CAP-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await supabase
    .from("outcome_captures")
    .insert({
      external_id: externalId,
      title: `Outcome Capture — ${recPkg.external_id}`,
      capture_date: new Date().toISOString().slice(0, 10),
      recommendation_package_id: recPkg.id,
      interpretation_package_id: recPkg.interpretation_package_id,
      assembled_context_package_id: recPkg.assembled_context_package_id,
      repository_path: `outcomes/${externalId.toLowerCase()}.md`,
      capture_method: "executive_interface",
      executive_decision_reference: null,
      recommendation_followed: "unknown",
      ...updateFields,
    })
    .select("external_id")
    .single();

  if (error) throw new Error(error.message);
  return { external_id: data.external_id };
}

export async function getOutcomeForSituation(situationSlug: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseServer();
  const { data: situation } = await supabase
    .from("situations")
    .select("id")
    .eq("slug", situationSlug)
    .maybeSingle();

  if (!situation) return null;

  const { data: crs } = await supabase
    .from("context_relevance_specs")
    .select("id")
    .eq("related_situation_id", situation.id)
    .maybeSingle();

  if (!crs) return null;

  const { data: rr } = await supabase
    .from("retrieval_requests")
    .select("id")
    .eq("context_reference_id", crs.id)
    .maybeSingle();

  if (!rr) return null;

  const { data: acp } = await supabase
    .from("assembled_context_packages")
    .select("id")
    .eq("retrieval_request_id", rr.id)
    .maybeSingle();

  if (!acp) return null;

  const { data: ip } = await supabase
    .from("interpretation_packages")
    .select("id")
    .eq("assembled_context_package_id", acp.id)
    .maybeSingle();

  if (!ip) return null;

  const { data: rp } = await supabase
    .from("recommendation_packages")
    .select("id")
    .eq("interpretation_package_id", ip.id)
    .maybeSingle();

  if (!rp) return null;

  const { data: oc } = await supabase
    .from("outcome_captures")
    .select("*")
    .eq("recommendation_package_id", rp.id)
    .maybeSingle();

  return oc;
}
