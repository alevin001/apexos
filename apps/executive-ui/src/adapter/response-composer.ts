import type { RuntimePresentation } from "@/types/conversation";
import type { ReasoningView } from "@/types/executive";

export function composeRuntimeResponse(
  presentation: RuntimePresentation,
  reasoning: ReasoningView | null
): string {
  if (!presentation.hasPipeline) {
    return [
      "I've registered your situation, but the reasoning pipeline hasn't been linked yet.",
      "",
      "The executive runtime requires ingested artifacts. Run the scenario ingestion or link repository artifacts to continue.",
      "",
      `You can view the situation workspace at /situations/${presentation.situationSlug}.`,
    ].join("\n");
  }

  const parts: string[] = [
    "I've completed the executive reasoning pipeline for your situation.",
    "",
  ];

  if (presentation.interpretationSummary) {
    parts.push("**My interpretation**", "", presentation.interpretationSummary, "");
  } else if (reasoning?.packageSummary?.body_md) {
    const summary = reasoning.packageSummary.body_md.split("\n").slice(0, 6).join("\n");
    parts.push("**My interpretation**", "", summary, "");
  }

  if (reasoning?.assumptions.length) {
    parts.push(
      "**Key assumptions I'm working with:**",
      ...reasoning.assumptions.slice(0, 2).map((a) => `• ${a.title}`),
      ""
    );
  }

  if (presentation.recommendationSummary) {
    parts.push("**Recommendation**", "", presentation.recommendationSummary, "");
  } else if (reasoning?.recommendations.length) {
    const primary = reasoning.recommendations[0];
    const excerpt = primary.body_md
      ? primary.body_md.split("\n").slice(0, 8).join("\n")
      : primary.title;
    parts.push("**Recommendation**", "", excerpt, "");
  }

  if (presentation.confidenceSummary) {
    parts.push(`Confidence: ${presentation.confidenceSummary}`);
  }

  if (presentation.uncertaintyFlags.length) {
    parts.push(
      "",
      "Areas of uncertainty:",
      ...presentation.uncertaintyFlags.map((f) => `• ${f}`)
    );
  }

  parts.push(
    "",
    "This is a recommendation — not a decision. Your judgment remains authoritative.",
    "",
    "You can inspect the full reasoning chain in the Glass Box, or tell me if you've accepted, modified, or rejected the recommendation."
  );

  return parts.join("\n");
}

export function composeDecisionAcknowledgment(choice: string, decisionRef: string): string {
  return [
    `Understood — you've **${choice}** the recommendation.`,
    "",
    `Decision reference: ${decisionRef}`,
    "",
    "When you've taken action, share the outcome so we can capture learning for future situations.",
  ].join("\n");
}

export function composeOutcomeAcknowledgment(): string {
  return [
    "Thank you for sharing the outcome. I've captured it in the executive loop.",
    "",
    "Validation and learning promotion follow the repository workflow — the Glass Box shows the full traceability chain.",
  ].join("\n");
}

export function composeLifecycleUpdate(stage: string): string {
  const messages: Record<string, string> = {
    decision_pending:
      "Your situation is ready for a decision. Have you accepted, modified, or rejected the recommendation?",
    outcome_pending:
      "Your decision is recorded. When you have observed results, describe what happened.",
    completed: "This conversation cycle is complete. Learning will inform future executive situations.",
  };
  return messages[stage] ?? "";
}
