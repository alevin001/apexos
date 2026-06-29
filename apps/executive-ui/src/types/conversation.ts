export type ConversationClassification =
  | "executive_situation"
  | "decision_update"
  | "outcome_update"
  | "strategic_discussion"
  | "casual";

export type ConversationLifecycleStatus =
  | "active"
  | "clarifying"
  | "situation_ready"
  | "runtime_executed"
  | "decision_pending"
  | "outcome_pending"
  | "completed"
  | "dismissed";

export type MessageRole = "executive" | "apexos";

export type MessageType =
  | "text"
  | "clarification"
  | "recommendation"
  | "decision_prompt"
  | "outcome_prompt"
  | "glass_box"
  | "lifecycle";

export interface SituationPackage {
  title: string;
  situation_type: string;
  executive_objective: string;
  situation_summary: string;
  people_involved: string[];
  organization: string | null;
  desired_outcome: string | null;
  constraints: string[];
  urgency: "low" | "medium" | "high" | null;
  known_risks: string[];
  missing_fields: string[];
  source_text: string;
}

export interface ClarificationRequest {
  field: keyof SituationPackage | string;
  question: string;
  priority: number;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExecutiveConversation {
  id: string;
  external_id: string;
  status: ConversationLifecycleStatus;
  classification: ConversationClassification | null;
  situation_id: string | null;
  situation_slug: string | null;
  situation_package: SituationPackage | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationTurnResult {
  conversation: ExecutiveConversation;
  messages: ConversationMessage[];
  awaiting_clarification: boolean;
  runtime_executed: boolean;
}

export interface RuntimePresentation {
  situationSlug: string;
  situationTitle: string;
  recommendationSummary: string | null;
  confidenceSummary: string | null;
  interpretationSummary: string | null;
  uncertaintyFlags: string[];
  glassBoxPath: string;
  recommendationPackageId: string | null;
  hasPipeline: boolean;
  lifecycleStage: string;
}
