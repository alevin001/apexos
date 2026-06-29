import { getSupabaseServer } from "./supabase-server";
import type { ReasoningView, ReasoningLayer } from "@/types/executive";
import { queryTraceabilityChainForSituation } from "./pipeline-service";

const INFERENCE_LAYER_MAP: Record<string, { key: keyof ReasoningView; label: string }> = {
  evidence_assessment: { key: "evidence", label: "Evidence" },
  hypothesis_evaluation: { key: "interpretation", label: "Interpretation" },
  competing_interpretations: { key: "interpretation", label: "Interpretation" },
  assumption_register: { key: "assumptions", label: "Assumptions" },
  blind_spot_review: { key: "blindSpots", label: "Blind Spots" },
  confidence_assessment: { key: "confidence", label: "Confidence" },
};

const REC_COMPONENT_LABEL = "Recommendations";

function toLayer(row: {
  component_type: string;
  title: string;
  status: string;
  body_md: string | null;
  external_id: string;
}, label: string): ReasoningLayer {
  return {
    type: row.component_type,
    label,
    title: row.title,
    status: row.status,
    body_md: row.body_md,
    external_id: row.external_id,
  };
}

export async function getReasoningView(situationSlug: string): Promise<ReasoningView | null> {
  const chain = await queryTraceabilityChainForSituation(situationSlug);
  if (!chain?.interpretation) return null;

  const supabase = getSupabaseServer();

  const { data: interpPkg } = await supabase
    .from("interpretation_packages")
    .select("*")
    .eq("external_id", chain.interpretation)
    .maybeSingle();

  if (!interpPkg) return null;

  const { data: infComponents } = await supabase
    .from("inference_components")
    .select("*")
    .eq("interpretation_package_id", interpPkg.id)
    .order("created_at", { ascending: true });

  const view: ReasoningView = {
    evidence: [],
    interpretation: [],
    assumptions: [],
    blindSpots: [],
    confidence: [],
    recommendations: [],
    packageSummary: {
      title: interpPkg.title,
      confidence_summary: interpPkg.confidence_summary,
      uncertainty_flags: (interpPkg.uncertainty_flags as string[]) ?? [],
      body_md: interpPkg.body_md,
    },
  };

  if (interpPkg.body_md) {
    view.interpretation.push(
      toLayer(
        {
          component_type: "interpretation_summary",
          title: "Interpretation Package Summary",
          status: interpPkg.status,
          body_md: interpPkg.body_md,
          external_id: interpPkg.external_id,
        },
        "Interpretation"
      )
    );
  }

  for (const comp of infComponents ?? []) {
    const mapping = INFERENCE_LAYER_MAP[comp.component_type];
    if (mapping) {
      (view[mapping.key] as ReasoningLayer[]).push(
        toLayer(comp, mapping.label)
      );
    }
  }

  if (chain.recommendation) {
    const { data: recPkg } = await supabase
      .from("recommendation_packages")
      .select("*")
      .eq("external_id", chain.recommendation)
      .maybeSingle();

    if (recPkg) {
      if (recPkg.body_md) {
        view.recommendations.push(
          toLayer(
            {
              component_type: "recommendation_summary",
              title: recPkg.title,
              status: recPkg.status,
              body_md: recPkg.body_md,
              external_id: recPkg.external_id,
            },
            REC_COMPONENT_LABEL
          )
        );
      }

      const { data: recComponents } = await supabase
        .from("recommendation_components")
        .select("*")
        .eq("recommendation_package_id", recPkg.id)
        .order("created_at", { ascending: true });

      for (const comp of recComponents ?? []) {
        view.recommendations.push(toLayer(comp, REC_COMPONENT_LABEL));
      }
    }
  }

  return view;
}
