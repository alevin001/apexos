import { getSupabaseServer, isTerminalStatus, appendTransformationLog } from "./supabase-server";
import type { DecisionChoice, DecisionRecord } from "@/types/executive";
import { DECISION_TO_FOLLOWED } from "@/types/executive";

export async function recordDecision(input: {
  recommendationPackageId: string;
  choice: DecisionChoice;
  reason?: string;
}): Promise<DecisionRecord> {
  const supabase = getSupabaseServer();
  const followed = DECISION_TO_FOLLOWED[input.choice];
  const decisionRef = `DEC-EXT-${Date.now().toString(36).toUpperCase()}`;

  const { data: recPkg } = await supabase
    .from("recommendation_packages")
    .select("id, external_id, interpretation_package_id, assembled_context_package_id")
    .eq("id", input.recommendationPackageId)
    .maybeSingle();

  if (!recPkg) throw new Error("Recommendation package not found");

  const { data: existingOutcome } = await supabase
    .from("outcome_captures")
    .select("*")
    .eq("recommendation_package_id", recPkg.id)
    .maybeSingle();

  if (existingOutcome && isTerminalStatus(existingOutcome.status)) {
    throw new Error(
      `Outcome capture ${existingOutcome.external_id} is terminal (${existingOutcome.status}). Historical integrity preserved.`
    );
  }

  const captureFields = {
    executive_decision_reference: decisionRef,
    recommendation_followed: followed,
    action_taken: existingOutcome?.action_taken ?? `[Decision ${input.choice}] Pending outcome capture`,
    observed_outcome: existingOutcome?.observed_outcome ?? "[Pending] Outcome not yet observed",
    status: "draft",
    transformation_log: appendTransformationLog(existingOutcome?.transformation_log ?? [], {
      action: "decision_recorded",
      rationale: input.reason ?? `Executive decision: ${input.choice}`,
      actor: "executive-ui",
    }),
    updated_at: new Date().toISOString(),
  };

  if (existingOutcome) {
    const { error } = await supabase
      .from("outcome_captures")
      .update(captureFields)
      .eq("id", existingOutcome.id);

    if (error) throw new Error(error.message);
  } else {
    const externalId = `OUT-CAP-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("outcome_captures").insert({
      external_id: externalId,
      title: `Outcome Capture — ${decisionRef}`,
      capture_date: new Date().toISOString().slice(0, 10),
      recommendation_package_id: recPkg.id,
      interpretation_package_id: recPkg.interpretation_package_id,
      assembled_context_package_id: recPkg.assembled_context_package_id,
      repository_path: `outcomes/${externalId.toLowerCase()}.md`,
      capture_method: "executive_interface",
      measurable_results: [],
      unexpected_consequences: [],
      ...captureFields,
    });

    if (error) throw new Error(error.message);
  }

  if (input.reason) {
    await supabase.from("decisions").insert({
      external_id: decisionRef,
      slug: decisionRef.toLowerCase(),
      title: `Executive Decision — ${input.choice}`,
      decision_date: new Date().toISOString().slice(0, 10),
      summary: input.reason,
      rationale: input.reason,
      executive_decision_reference: decisionRef,
      status: "recorded",
      repository_path: `decisions/${decisionRef.toLowerCase()}.md`,
      transformation_log: appendTransformationLog([], {
        action: "recorded",
        rationale: input.reason,
        actor: "executive-ui",
      }),
    });
  }

  return {
    executive_decision_reference: decisionRef,
    recommendation_followed: followed,
    rationale: input.reason,
    recommendation_package_id: input.recommendationPackageId,
  };
}

export async function getDecisionForRecommendation(
  recommendationPackageId: string
): Promise<{ executive_decision_reference: string | null; recommendation_followed: string | null } | null> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("outcome_captures")
    .select("executive_decision_reference, recommendation_followed")
    .eq("recommendation_package_id", recommendationPackageId)
    .maybeSingle();
  return data;
}
