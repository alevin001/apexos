import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { getSupabaseServer } from "./supabase-server";
import { getSituationPipeline, queryTraceabilityChainForSituation } from "./pipeline-service";
import { getReasoningView } from "./reasoning-service";
import type { RuntimePresentation } from "@/types/conversation";
import type { ReasoningView } from "@/types/executive";

const execFileAsync = promisify(execFile);

const SITUATION_TYPE_TO_SCENARIO: Record<string, string> = {
  "leadership-conflict": "leadership-conflict-q2",
  leadership: "leadership-conflict-q2",
  "strategic-decision": "leadership-conflict-q2",
  "difficult-conversation": "leadership-conflict-q2",
  "meeting-preparation": "leadership-conflict-q2",
  "meeting-analysis": "leadership-conflict-q2",
  "organizational-challenge": "leadership-conflict-q2",
  relationship: "leadership-conflict-q2",
  "executive-coaching": "leadership-conflict-q2",
  "decision-support": "leadership-conflict-q2",
  general: "leadership-conflict-q2",
};

export function resolveScenarioForSituationType(situationType: string): string {
  return SITUATION_TYPE_TO_SCENARIO[situationType] ?? "leadership-conflict-q2";
}

export async function invokeRuntimeIngestion(scenarioSlug: string): Promise<{ success: boolean; error?: string }> {
  const repoRoot = resolve(process.cwd(), "../..");
  const scriptsDir = resolve(repoRoot, "scripts");

  try {
    await execFileAsync("npm", ["run", "ingest:scenario"], {
      cwd: scriptsDir,
      env: process.env,
      timeout: 120_000,
      shell: process.platform === "win32",
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return { success: false, error: message };
  }
}

export async function linkPipelineToSituation(
  situationId: string,
  scenarioSlug: string
): Promise<boolean> {
  const supabase = getSupabaseServer();

  const { data: templateSituation } = await supabase
    .from("situations")
    .select("id")
    .eq("slug", scenarioSlug)
    .maybeSingle();

  if (!templateSituation) return false;

  const { data: crs } = await supabase
    .from("context_relevance_specs")
    .select("id")
    .eq("related_situation_id", templateSituation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!crs) return false;

  const { error } = await supabase
    .from("context_relevance_specs")
    .update({ related_situation_id: situationId })
    .eq("id", crs.id);

  return !error;
}

export async function invokeRuntimeForSituation(
  situationSlug: string,
  situationType: string
): Promise<{ presentation: RuntimePresentation; reasoning: ReasoningView | null }> {
  const supabase = getSupabaseServer();
  const scenarioSlug = resolveScenarioForSituationType(situationType);

  let chain = await queryTraceabilityChainForSituation(situationSlug);

  if (!chain) {
    const { data: situation } = await supabase
      .from("situations")
      .select("id")
      .eq("slug", situationSlug)
      .maybeSingle();

    if (situation) {
      await invokeRuntimeIngestion(scenarioSlug);
      await linkPipelineToSituation(situation.id, scenarioSlug);
      chain = await queryTraceabilityChainForSituation(situationSlug);
    }
  }

  const pipeline = await getSituationPipeline(situationSlug);
  const reasoning = await getReasoningView(situationSlug);

  const recPkg = pipeline?.recommendationPackage;
  const recommendationPackageId = (recPkg?.id as string) ?? null;

  let lifecycleStage = "runtime_executed";
  const outcome = pipeline?.outcomeCapture;
  if (outcome?.executive_decision_reference && outcome.status === "draft") {
    lifecycleStage = "decision_pending";
  } else if (outcome?.executive_decision_reference && outcome.status !== "captured") {
    lifecycleStage = "outcome_pending";
  } else if (outcome?.status === "captured") {
    lifecycleStage = "completed";
  }

  const presentation: RuntimePresentation = {
    situationSlug,
    situationTitle: pipeline?.situation.title ?? situationSlug,
    recommendationSummary: (recPkg?.body_md as string)?.split("\n").slice(0, 10).join("\n") ?? null,
    confidenceSummary: (recPkg?.confidence_summary as string) ?? reasoning?.packageSummary?.confidence_summary ?? null,
    interpretationSummary: reasoning?.packageSummary?.body_md?.split("\n").slice(0, 6).join("\n") ?? null,
    uncertaintyFlags: reasoning?.packageSummary?.uncertainty_flags ?? [],
    glassBoxPath: `/situations/${situationSlug}/provenance`,
    recommendationPackageId,
    hasPipeline: !!chain?.recommendation,
    lifecycleStage,
  };

  return { presentation, reasoning };
}
