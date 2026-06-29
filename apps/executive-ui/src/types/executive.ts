export type SituationStatus = "active" | "archived" | "draft";

export interface Situation {
  id: string;
  external_id: string;
  slug: string;
  title: string;
  situation_summary: string | null;
  situation_type: string | null;
  status: string;
  created_at: string;
}

export interface TraceabilityChain {
  context_spec: string;
  context_spec_id?: string;
  retrieval_request: string;
  evidence_package: string;
  context_package: string;
  interpretation: string;
  recommendation: string;
  outcome_capture: string;
  validation: string;
  learning: string;
}

export interface PipelineStage {
  label: string;
  externalId: string;
  status: string;
  complete: boolean;
}

export interface EvidenceItem {
  path: string;
  tier: string;
  note?: string;
  title?: string;
  summary?: string;
  body_md?: string;
}

export interface EvidenceView {
  executiveMemory: EvidenceItem[];
  personMemory: EvidenceItem[];
  relationshipMemory: EvidenceItem[];
  context: {
    spec: { title: string; situation_summary: string | null; domain_weights: Record<string, string>; body_md?: string };
  } | null;
  retrievedKnowledge: EvidenceItem[];
  patterns: EvidenceItem[];
  outcomeHistory: EvidenceItem[];
  supportingEvidence: EvidenceItem[];
  contradictoryEvidence: {
    title: string;
    conflicting_sources: unknown;
    resolution_status: string;
    body_md?: string;
  }[];
}

export interface ReasoningLayer {
  type: string;
  label: string;
  title: string;
  status: string;
  body_md: string | null;
  external_id: string;
}

export interface ReasoningView {
  evidence: ReasoningLayer[];
  interpretation: ReasoningLayer[];
  assumptions: ReasoningLayer[];
  blindSpots: ReasoningLayer[];
  confidence: ReasoningLayer[];
  recommendations: ReasoningLayer[];
  packageSummary: {
    title: string;
    confidence_summary: string | null;
    uncertainty_flags: string[];
    body_md: string | null;
  } | null;
}

export type DecisionChoice = "accepted" | "modified" | "rejected";

export const DECISION_TO_FOLLOWED: Record<DecisionChoice, string> = {
  accepted: "followed",
  modified: "modified",
  rejected: "rejected",
};

export interface DecisionRecord {
  executive_decision_reference: string;
  recommendation_followed: string;
  rationale?: string;
  recommendation_package_id: string;
}

export interface OutcomeFormData {
  action_taken: string;
  observed_outcome: string;
  unexpected_consequences: string[];
  measurable_results: { metric: string; value: string | number }[];
  learning_notes?: string;
  recommendation_package_id: string;
}

export interface HomeSummary {
  recentSituations: Situation[];
  pendingFollowUps: {
    id: string;
    title: string;
    external_id: string;
    recommendation_date: string;
    situation_slug?: string;
    situation_title?: string;
  }[];
  recentRecommendations: {
    id: string;
    external_id: string;
    title: string;
    recommendation_date: string;
    confidence_summary: string | null;
    situation_slug?: string;
  }[];
  recentOutcomes: {
    id: string;
    external_id: string;
    title: string;
    capture_date: string;
    status: string;
    situation_slug?: string;
  }[];
}

export interface SituationPipeline {
  situation: Situation;
  chain: TraceabilityChain | null;
  stages: PipelineStage[];
  contextSpec: Record<string, unknown> | null;
  recommendationPackage: Record<string, unknown> | null;
  outcomeCapture: Record<string, unknown> | null;
}

export interface ProvenanceInsight {
  question: string;
  answer: string;
}

export interface ProvenanceArtifact {
  external_id: string;
  title: string;
  type?: string;
  status?: string;
  body_md?: string | null;
}

export interface ProvenanceStageData {
  id: string;
  label: string;
  externalId: string;
  status: string;
  complete: boolean;
  summary: string;
  insights: ProvenanceInsight[];
  artifacts: ProvenanceArtifact[];
  body_md?: string | null;
  transformation_log?: Record<string, unknown>[];
  relatedPath?: string;
}

export interface DecisionProvenanceView {
  situationSlug: string;
  situationTitle: string;
  stages: ProvenanceStageData[];
  chain: TraceabilityChain | null;
}

export interface RuntimeObservability {
  activeSituation: string;
  situationStatus: string;
  contextCount: number;
  evidenceCount: number;
  contradictoryEvidenceCount: number;
  assumptionCount: number;
  interpretationConfidence: string | null;
  recommendationConfidence: string | null;
  uncertaintyFlags: string[];
  completedStages: number;
  totalStages: number;
  currentStage: string;
  pipelineStatus: "complete" | "partial" | "none";
}
