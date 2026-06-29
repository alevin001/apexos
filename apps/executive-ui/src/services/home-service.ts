import { getSupabaseServer } from "./supabase-server";
import type { HomeSummary } from "@/types/executive";
import { listSituations } from "./situation-service";

export async function getHomeSummary(): Promise<HomeSummary> {
  const supabase = getSupabaseServer();
  const recentSituations = await listSituations(10);

  const { data: recommendations } = await supabase
    .from("recommendation_packages")
    .select("id, external_id, title, recommendation_date, confidence_summary, status, context_reference_id")
    .order("recommendation_date", { ascending: false })
    .limit(10);

  const { data: outcomes } = await supabase
    .from("outcome_captures")
    .select("id, external_id, title, capture_date, status, recommendation_package_id")
    .order("capture_date", { ascending: false })
    .limit(10);

  const recIdsWithOutcome = new Set(
    (outcomes ?? []).map((o) => o.recommendation_package_id)
  );

  const pendingFollowUps = (recommendations ?? [])
    .filter((r) => r.status === "delivered" && !recIdsWithOutcome.has(r.id))
    .map((r) => ({
      id: r.id,
      external_id: r.external_id,
      title: r.title,
      recommendation_date: r.recommendation_date,
    }));

  const recentRecommendations = (recommendations ?? []).slice(0, 5).map((r) => ({
    id: r.id,
    external_id: r.external_id,
    title: r.title,
    recommendation_date: r.recommendation_date,
    confidence_summary: r.confidence_summary,
  }));

  const recentOutcomes = (outcomes ?? []).slice(0, 5).map((o) => ({
    id: o.id,
    external_id: o.external_id,
    title: o.title,
    capture_date: o.capture_date,
    status: o.status,
  }));

  return {
    recentSituations,
    pendingFollowUps,
    recentRecommendations,
    recentOutcomes,
  };
}
