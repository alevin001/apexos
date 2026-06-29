import type { ClarificationRequest, SituationPackage } from "@/types/conversation";

const FIELD_QUESTIONS: Record<string, string> = {
  executive_objective:
    "What is your primary objective here? What do you need to accomplish or resolve?",
  situation_summary:
    "Can you describe the situation in more detail — what's happening and why it matters now?",
  desired_outcome:
    "What would a successful outcome look like for you?",
  people_involved:
    "Who are the key people involved? Names or roles help me understand the dynamics.",
};

export function buildClarificationRequests(pkg: SituationPackage): ClarificationRequest[] {
  return pkg.missing_fields
    .filter((field) => FIELD_QUESTIONS[field])
    .map((field, index) => ({
      field,
      question: FIELD_QUESTIONS[field],
      priority: index + 1,
    }));
}

export function nextClarificationQuestion(pkg: SituationPackage): ClarificationRequest | null {
  const requests = buildClarificationRequests(pkg);
  return requests[0] ?? null;
}

export function isSituationPackageComplete(pkg: SituationPackage): boolean {
  const requiredMissing = pkg.missing_fields.filter(
    (f) => f === "executive_objective" || f === "situation_summary"
  );
  return requiredMissing.length === 0 && pkg.executive_objective.length >= 10;
}

export function formatSituationConfirmation(pkg: SituationPackage): string {
  const lines = [
    "I've captured the following situation:",
    "",
    `**${pkg.title}**`,
    "",
    pkg.situation_summary.length > 300
      ? `${pkg.situation_summary.slice(0, 300)}…`
      : pkg.situation_summary,
  ];

  if (pkg.people_involved.length) {
    lines.push("", `People involved: ${pkg.people_involved.join(", ")}`);
  }
  if (pkg.desired_outcome) {
    lines.push("", `Desired outcome: ${pkg.desired_outcome}`);
  }
  if (pkg.urgency) {
    lines.push("", `Urgency: ${pkg.urgency}`);
  }

  lines.push("", "I'll run this through the executive reasoning pipeline now.");
  return lines.join("\n");
}
