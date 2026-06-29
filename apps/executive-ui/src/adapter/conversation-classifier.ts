import type { ConversationClassification } from "@/types/conversation";

const CASUAL_PATTERNS = [
  /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|ok|okay|bye|goodbye|how are you)\b/i,
  /^(what's up|whats up|howdy)\b/i,
];

const OUTCOME_PATTERNS = [
  /\b(outcome was|results were|it worked|didn't work|did not work|follow.?up on|update on outcome|observed that)\b/i,
  /\b(here's what happened|here is what happened|the result)\b/i,
];

const DECISION_PATTERNS = [
  /\b(i decided|we decided|my decision|chose to|going with|went with|accepted the|rejected the|modified the)\b/i,
];

const EXECUTIVE_PATTERNS = [
  /\b(help me|need help|struggling|conflict|decision|strategy|strategic|leadership|team|meeting|prepare|conversation with)\b/i,
  /\b(difficult|challenge|problem|issue|dilemma|priorit|organizational|relationship|coaching|executive)\b/i,
  /\b(what should i|how should i|advise|recommend|guidance|support me)\b/i,
  /\b(transcript|analysis|misalign|tension|stakeholder|direct report|board|q[1-4])\b/i,
];

export interface ClassificationResult {
  classification: ConversationClassification;
  confidence: number;
  should_process: boolean;
}

export function classifyConversation(text: string): ClassificationResult {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) {
    return { classification: "casual", confidence: 0.9, should_process: false };
  }

  if (trimmed.length < 20 && CASUAL_PATTERNS.some((p) => p.test(trimmed))) {
    return { classification: "casual", confidence: 0.95, should_process: false };
  }

  if (OUTCOME_PATTERNS.some((p) => p.test(trimmed))) {
    return { classification: "outcome_update", confidence: 0.85, should_process: true };
  }

  if (DECISION_PATTERNS.some((p) => p.test(trimmed))) {
    return { classification: "decision_update", confidence: 0.85, should_process: true };
  }

  if (EXECUTIVE_PATTERNS.some((p) => p.test(trimmed))) {
    const isStrategic = /\b(strategy|strategic|roadmap|vision|long.?term|portfolio)\b/i.test(trimmed);
    return {
      classification: isStrategic ? "strategic_discussion" : "executive_situation",
      confidence: 0.8,
      should_process: true,
    };
  }

  if (trimmed.length >= 40) {
    return { classification: "executive_situation", confidence: 0.6, should_process: true };
  }

  if (CASUAL_PATTERNS.some((p) => p.test(trimmed))) {
    return { classification: "casual", confidence: 0.7, should_process: false };
  }

  return { classification: "casual", confidence: 0.5, should_process: false };
}

export function casualResponse(): string {
  return "I'm here when you have an executive situation, decision, or outcome to work through. Describe what's on your mind — a leadership challenge, strategic decision, difficult conversation, or meeting you need to prepare for.";
}
