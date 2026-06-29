/**
 * Executive Conversation Adapter — Build 11
 *
 * Accepts natural language, extracts situations, requests clarification,
 * invokes the existing runtime, and composes conversational responses.
 *
 * Does NOT perform retrieval, inference, recommendation generation, or learning.
 */
import { classifyConversation, casualResponse } from "./conversation-classifier";
import {
  extractSituationPackage,
  mergeSituationPackage,
} from "./situation-extractor";
import {
  formatSituationConfirmation,
  isSituationPackageComplete,
  nextClarificationQuestion,
} from "./clarification-engine";
import {
  composeDecisionAcknowledgment,
  composeOutcomeAcknowledgment,
  composeRuntimeResponse,
} from "./response-composer";
import { createSituation } from "@/services/situation-service";
import { invokeRuntimeForSituation } from "@/services/runtime-invocation-service";
import { recordDecision } from "@/services/decision-service";
import { recordOutcome } from "@/services/outcome-service";
import { getOutcomeForSituation } from "@/services/outcome-service";
import {
  addMessage,
  getConversation,
  getMessages,
  updateConversation,
} from "@/services/conversation-service";
import type { ConversationTurnResult } from "@/types/conversation";
import type { DecisionChoice } from "@/types/executive";

export async function processConversationTurn(
  conversationId: string,
  executiveMessage: string,
  options?: { clarificationField?: string; decisionChoice?: DecisionChoice }
): Promise<ConversationTurnResult> {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  await addMessage({
    conversationId,
    role: "executive",
    content: executiveMessage,
  });

  const allMessages = [...(await getMessages(conversationId))];

  if (conversation.status === "clarifying" && conversation.situation_package) {
    return handleClarificationTurn(
      conversation,
      executiveMessage,
      options?.clarificationField,
      allMessages
    );
  }

  if (
    (conversation.status === "decision_pending" || conversation.status === "runtime_executed") &&
    options?.decisionChoice
  ) {
    return handleDecisionTurn(conversation, executiveMessage, options.decisionChoice, allMessages);
  }

  if (conversation.status === "outcome_pending") {
    return handleOutcomeTurn(conversation, executiveMessage, allMessages);
  }

  const classification = classifyConversation(executiveMessage);

  if (!classification.should_process) {
    const apexMsg = await addMessage({
      conversationId,
      role: "apexos",
      content: casualResponse(),
      messageType: "text",
    });
    const updated = await updateConversation(conversationId, {
      status: "dismissed",
      classification: classification.classification,
    });
    return {
      conversation: updated,
      messages: [...allMessages, apexMsg],
      awaiting_clarification: false,
      runtime_executed: false,
    };
  }

  if (classification.classification === "outcome_update" && conversation.situation_slug) {
    return handleOutcomeTurn(conversation, executiveMessage, allMessages);
  }

  const situationPackage = extractSituationPackage(
    executiveMessage,
    conversation.situation_package ?? undefined
  );

  if (!isSituationPackageComplete(situationPackage)) {
    const clarification = nextClarificationQuestion(situationPackage);
    const apexMsg = await addMessage({
      conversationId,
      role: "apexos",
      content: clarification?.question ?? "Can you tell me more about this situation?",
      messageType: "clarification",
      metadata: { field: clarification?.field },
    });

    const updated = await updateConversation(conversationId, {
      status: "clarifying",
      classification: classification.classification,
      situation_package: situationPackage,
    });

    return {
      conversation: updated,
      messages: [...allMessages, apexMsg],
      awaiting_clarification: true,
      runtime_executed: false,
    };
  }

  return executeSituationPipeline(
    conversationId,
    conversation,
    situationPackage,
    classification.classification,
    allMessages
  );
}

async function handleClarificationTurn(
  conversation: Awaited<ReturnType<typeof getConversation>>,
  text: string,
  field: string | undefined,
  allMessages: Awaited<ReturnType<typeof getMessages>>
): Promise<ConversationTurnResult> {
  if (!conversation?.situation_package) throw new Error("No situation package in clarification");

  const merged = mergeSituationPackage(conversation.situation_package, text, field);

  if (!isSituationPackageComplete(merged)) {
    const clarification = nextClarificationQuestion(merged);
    const apexMsg = await addMessage({
      conversationId: conversation.id,
      role: "apexos",
      content: clarification?.question ?? "Anything else I should know?",
      messageType: "clarification",
      metadata: { field: clarification?.field },
    });

    const updated = await updateConversation(conversation.id, {
      situation_package: merged,
      status: "clarifying",
    });

    return {
      conversation: updated,
      messages: [...allMessages, apexMsg],
      awaiting_clarification: true,
      runtime_executed: false,
    };
  }

  return executeSituationPipeline(
    conversation.id,
    conversation,
    merged,
    conversation.classification ?? "executive_situation",
    allMessages
  );
}

async function executeSituationPipeline(
  conversationId: string,
  conversation: NonNullable<Awaited<ReturnType<typeof getConversation>>>,
  situationPackage: ReturnType<typeof extractSituationPackage>,
  classification: NonNullable<Awaited<ReturnType<typeof getConversation>>>["classification"],
  allMessages: Awaited<ReturnType<typeof getMessages>>
): Promise<ConversationTurnResult> {
  const confirmMsg = await addMessage({
    conversationId,
    role: "apexos",
    content: formatSituationConfirmation(situationPackage),
    messageType: "text",
  });

  const situation = await createSituation({
    title: situationPackage.title,
    situation_summary: situationPackage.situation_summary,
    situation_type: situationPackage.situation_type,
  });

  const { presentation, reasoning } = await invokeRuntimeForSituation(
    situation.slug,
    situationPackage.situation_type
  );

  const responseContent = composeRuntimeResponse(presentation, reasoning);

  const runtimeMsg = await addMessage({
    conversationId,
    role: "apexos",
    content: responseContent,
    messageType: "recommendation",
    metadata: {
      situation_slug: situation.slug,
      glass_box_path: presentation.glassBoxPath,
      recommendation_package_id: presentation.recommendationPackageId,
    },
  });

  const glassBoxMsg = await addMessage({
    conversationId,
    role: "apexos",
    content: "Full decision provenance is available in the Glass Box — every stage from situation through learning remains visible and traceable.",
    messageType: "glass_box",
    metadata: { glass_box_path: presentation.glassBoxPath },
  });

  const lifecycleStatus = !presentation.hasPipeline
    ? "situation_ready"
    : presentation.lifecycleStage === "completed"
      ? "completed"
      : presentation.lifecycleStage === "outcome_pending"
        ? "outcome_pending"
        : "decision_pending";

  const updated = await updateConversation(conversationId, {
    status: lifecycleStatus,
    classification,
    situation_id: situation.id,
    situation_slug: situation.slug,
    situation_package: situationPackage,
  });

  return {
    conversation: updated,
    messages: [...allMessages, confirmMsg, runtimeMsg, glassBoxMsg],
    awaiting_clarification: false,
    runtime_executed: presentation.hasPipeline,
  };
}

async function handleDecisionTurn(
  conversation: NonNullable<Awaited<ReturnType<typeof getConversation>>>,
  text: string,
  choice: DecisionChoice,
  allMessages: Awaited<ReturnType<typeof getMessages>>
): Promise<ConversationTurnResult> {
  const { presentation } = await invokeRuntimeForSituation(
    conversation.situation_slug!,
    conversation.situation_package?.situation_type ?? "general"
  );

  if (!presentation.recommendationPackageId) {
    throw new Error("No recommendation available for decision capture");
  }

  const record = await recordDecision({
    recommendationPackageId: presentation.recommendationPackageId,
    choice,
    reason: text.length > 10 ? text : undefined,
  });

  const apexMsg = await addMessage({
    conversationId: conversation.id,
    role: "apexos",
    content: composeDecisionAcknowledgment(choice, record.executive_decision_reference),
    messageType: "decision_prompt",
    metadata: { decision_ref: record.executive_decision_reference },
  });

  const updated = await updateConversation(conversation.id, { status: "outcome_pending" });

  return {
    conversation: updated,
    messages: [...allMessages, apexMsg],
    awaiting_clarification: false,
    runtime_executed: true,
  };
}

async function handleOutcomeTurn(
  conversation: NonNullable<Awaited<ReturnType<typeof getConversation>>>,
  text: string,
  allMessages: Awaited<ReturnType<typeof getMessages>>
): Promise<ConversationTurnResult> {
  const slug = conversation.situation_slug;
  if (!slug) throw new Error("No situation linked for outcome capture");

  const { presentation } = await invokeRuntimeForSituation(
    slug,
    conversation.situation_package?.situation_type ?? "general"
  );

  const existingOutcome = await getOutcomeForSituation(slug);

  if (presentation.recommendationPackageId) {
    await recordOutcome({
      recommendation_package_id: presentation.recommendationPackageId,
      action_taken: (existingOutcome?.action_taken as string) ?? text.slice(0, 200),
      observed_outcome: text,
      unexpected_consequences: [],
      measurable_results: [],
      learning_notes: text.length > 100 ? text : undefined,
    });
  }

  const apexMsg = await addMessage({
    conversationId: conversation.id,
    role: "apexos",
    content: composeOutcomeAcknowledgment(),
    messageType: "outcome_prompt",
  });

  const updated = await updateConversation(conversation.id, { status: "completed" });

  return {
    conversation: updated,
    messages: [...allMessages, apexMsg],
    awaiting_clarification: false,
    runtime_executed: true,
  };
}

