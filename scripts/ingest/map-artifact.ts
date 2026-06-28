import type { ParsedArtifact } from "../shared/types.js";
import { normalizePath } from "../shared/supabase.js";

export type TableMapping = {
  table: string;
  architectureLayer: string;
  sourceDocument: string;
  defaultRepositoryPath: string;
};

const INFERENCE_COMPONENT_MAP: Record<string, string> = {
  "inf-evd": "evidence_assessment",
  "inf-asm": "assumption_register",
  "inf-bls": "blind_spot_review",
  "inf-hyp": "hypothesis_evaluation",
  "inf-con": "confidence_assessment",
  "inf-cmp": "competing_interpretations",
};

const RECOMMENDATION_COMPONENT_MAP: Record<string, string> = {
  "rec-obj": "objective_alignment",
  "rec-opt": "option_generation",
  "rec-doc": "doctrine_evaluation",
  "rec-rsk": "risk_assessment",
  "rec-opp": "opportunity_assessment",
  "rec-trd": "tradeoff_analysis",
  "rec-con": "recommendation_confidence",
};

const OUTCOME_COMPONENT_MAP: Record<string, string> = {
  "out-rec-val": "recommendation_validation",
  "out-dec-val": "decision_validation",
  "out-asm-val": "assumption_validation",
  "out-pat-val": "pattern_validation",
  "out-con-recal": "confidence_recalibration",
  "out-rnf": "reinforcement_update",
  "out-lrn": "learning_update",
  "out-fup": "executive_follow_up",
};

const LINK_FIELD_MAP: Record<string, string> = {
  originating_knowledge: "originating_knowledge",
  promoted_from: "promoted_from",
  memory_references: "memory_reference",
  knowledge_references: "knowledge_reference",
  related_outcomes: "related_outcome",
  related_patterns: "related_pattern",
  related_decisions: "related_decision",
  source_files: "derived_from",
  doctrine_references: "doctrine_reference",
};

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function inferComponentType(path: string, maps: Record<string, string>[]): string | null {
  const name = basename(path).toLowerCase();
  for (const map of maps) {
    for (const [prefix, type] of Object.entries(map)) {
      if (name.startsWith(prefix)) return type;
    }
  }
  return null;
}

export function detectTableMapping(artifact: ParsedArtifact): TableMapping {
  const path = normalizePath(artifact.repositoryPath);
  const fm = artifact.frontmatter;
  const name = basename(path);

  if (path.includes("/foundations/") && fm.slug && !fm.category) {
    if (fm.display_name && path.includes("executive")) {
      return table("executives", "foundations");
    }
    if (fm.display_name) return table("persons", "foundations");
    if (fm.participants) return table("relationships", "foundations");
    if (fm.situation_type || fm.situation_summary) return table("situations", "foundations");
  }

  if (isKnowledgeMeta(path) || fm.source_file || fm.source_type || fm.type) {
    return table("knowledge_sources", "knowledge", "knowledge/templates/knowledge-source.meta.md");
  }
  if (name.startsWith("framework")) return table("frameworks", "knowledge");
  if (name.startsWith("concept")) return table("concepts", "knowledge");
  if (name.startsWith("reference")) return table("knowledge_references", "knowledge");

  if (fm.category === "observation" || name.startsWith("obs-")) {
    return table("observations", "memory", "memory/templates/observation.md");
  }
  if (fm.category && typeof fm.category === "string") {
    return table("memory_artifacts", "memory");
  }
  if (name.startsWith("promotion")) return table("promotion_records", "memory");
  if (name.startsWith("outcome-reference")) return table("outcome_references", "memory");

  if (name.startsWith("ctx-eval")) return table("context_evaluations", "context");
  if (name.startsWith("ctx-pkg") || fm.domain_weights) {
    return table("context_relevance_specs", "context", "context/templates/context-package.md");
  }

  if (name.startsWith("ret-req") || fm.retrieval_targets) {
    return table("retrieval_requests", "retrieval", "retrieval/templates/retrieval-request.md");
  }
  if (name.startsWith("ret-ctx") || (fm.evidence_package && fm.assembly_tiers)) {
    return table("assembled_context_packages", "retrieval");
  }
  if (name.startsWith("ret-evd") || (fm.assembly_tiers && fm.retrieval_request)) {
    return table("evidence_packages", "retrieval", "retrieval/templates/evidence-package.md");
  }
  if (name.startsWith("con-evd")) return table("contradictory_evidence_records", "retrieval");

  const infComp = inferComponentType(path, [INFERENCE_COMPONENT_MAP]);
  if (infComp || name.startsWith("inf-int")) {
    if (infComp) {
      return table("inference_components", "inference", `inference/templates/${infComp.replace(/_/g, "-")}-template.md`);
    }
    return table("interpretation_packages", "inference", "inference/templates/interpretation-package-template.md");
  }

  const recComp = inferComponentType(path, [RECOMMENDATION_COMPONENT_MAP]);
  if (recComp || name.startsWith("rec-pkg")) {
    if (recComp) {
      return table("recommendation_components", "recommendation");
    }
    return table("recommendation_packages", "recommendation", "recommendation/templates/recommendation-package-template.md");
  }

  const outComp = inferComponentType(path, [OUTCOME_COMPONENT_MAP]);
  if (name.startsWith("out-lrn") && fm.learning_type) {
    return table("learning_updates", "outcomes", "outcomes/templates/learning-update-template.md");
  }
  if (outComp) {
    return table("outcome_components", "outcomes");
  }
  if (name.startsWith("out-cap") || (fm.action_taken && fm.observed_outcome)) {
    return table("outcome_captures", "outcomes", "outcomes/templates/outcome-capture-template.md");
  }
  if (name.startsWith("val-pkg") || fm.validation_summary) {
    return table("validation_packages", "outcomes", "outcomes/templates/validation-package-template.md");
  }
  if (name.startsWith("out-rnf")) return table("reinforcement_updates", "outcomes");

  throw new Error(`Cannot detect table mapping for ${artifact.repositoryPath}`);
}

function table(
  tableName: string,
  layer: string,
  defaultPath?: string
): TableMapping {
  const docs: Record<string, string> = {
    foundations: "architecture/2 - ApexOS - Foundations Architecture v1.0.docx",
    knowledge: "architecture/2 - ApexOS - Foundations Architecture v1.0.docx",
    memory: "architecture/3 - ApexOS - Memory Architecture v1.0.docx",
    context: "architecture/4 - ApexOS - Context Architecture v1.0.docx",
    retrieval: "architecture/5 - ApexOS - Retrieval Architecture v1.0.docx",
    inference: "architecture/7 - ApexOS - Inference Architecture v1.0.docx",
    recommendation: "architecture/8 - ApexOS - Recommendation Architecture v1.0.docx",
    outcomes: "architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx",
  };
  return {
    table: tableName,
    architectureLayer: layer,
    sourceDocument: docs[layer] ?? docs.foundations,
    defaultRepositoryPath: defaultPath ?? "",
  };
}

export function extractLinkSpecs(
  table: string,
  recordId: string,
  fm: Record<string, unknown>
): { linkType: string; targetRef: string; tier?: string }[] {
  const links: { linkType: string; targetRef: string; tier?: string }[] = [];

  for (const [field, linkType] of Object.entries(LINK_FIELD_MAP)) {
    const val = fm[field];
    if (Array.isArray(val)) {
      for (const ref of val) {
        if (typeof ref === "string") links.push({ linkType, targetRef: ref });
      }
    } else if (typeof val === "string" && val) {
      links.push({ linkType, targetRef: val });
    }
  }

  const componentArtifacts = fm.component_artifacts;
  if (componentArtifacts && typeof componentArtifacts === "object") {
    for (const ref of Object.values(componentArtifacts as Record<string, unknown>)) {
      if (typeof ref === "string" && ref) {
        links.push({ linkType: "component", targetRef: ref });
      }
    }
  }

  return links;
}

export function inferComponentTypeFromPath(path: string, layer: "inference" | "recommendation" | "outcomes"): string | null {
  const maps = {
    inference: INFERENCE_COMPONENT_MAP,
    recommendation: RECOMMENDATION_COMPONENT_MAP,
    outcomes: OUTCOME_COMPONENT_MAP,
  };
  return inferComponentType(path, [maps[layer]]);
}

function isKnowledgeMeta(path: string): boolean {
  return path.endsWith(".meta.md");
}

export { INFERENCE_COMPONENT_MAP, RECOMMENDATION_COMPONENT_MAP, OUTCOME_COMPONENT_MAP, LINK_FIELD_MAP };
