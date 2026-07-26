import type {
  ConfidenceIndicators,
  ContinuityItem,
  DoctrineReference,
  ExecutiveContextPackage,
} from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

/**
 * Context Package Construction — assembles the Executive Context Package.
 * Runtime integration boundary artifact per TECH-002 Section 7.
 * The runtime coordinates assembly; it does not perform executive reasoning.
 */
export async function contextPackageBuilderStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();

  const doctrine: DoctrineReference[] = (ctx.governance?.doctrineReferences ?? []).map((ref) => ({
    title: ref,
    source: "architecture",
    summary: ref,
  }));

  const confidence: ConfidenceIndicators = {
    retrievalConfidence: ctx.continuity
      ? "medium"
      : ctx.evidence?.assembledContextPackage
        ? "medium"
        : "low",
    evidenceGaps: extractGaps(ctx),
    uncertaintyFlags: ctx.evidence?.assembledContextPackage ? [] : ["no_assembled_context_package"],
    assumptions: ["Executive context assembled from available pipeline artifacts"],
  };

  const { instructions, contextItems } = buildLLMInstructions(ctx);

  const pkg: ExecutiveContextPackage = {
    version: "1.0",
    assembledAt: new Date().toISOString(),
    requestId: ctx.request.requestId,
    executive: {
      slug: ctx.executive!.slug,
      displayName: ctx.executive!.displayName,
      summary: ctx.executive!.summary,
    },
    situation: ctx.situation
      ? {
          slug: ctx.situation.slug,
          title: ctx.situation.title,
          summary: ctx.situation.summary,
          situationType: ctx.situation.situationType,
        }
      : null,
    executiveMessage: ctx.request.message,
    continuity: ctx.continuity,
    memory: ctx.memory ?? {
      executive: [],
      person: [],
      relationship: [],
      pattern: [],
      outcomes: [],
      observations: [],
    },
    contextRelevance: ctx.contextRelevance,
    evidence: ctx.evidence ?? {
      evidencePackage: null,
      contradictoryEvidence: [],
      assembledContextPackage: null,
      retrievalRequest: null,
    },
    governance: ctx.governance!,
    confidence,
    doctrine,
    contextItemsSupplied: contextItems,
    llmInstructions: instructions,
  };

  if (ctx.retrievalAudit) {
    ctx.retrievalAudit.contextItems = contextItems;
  }

  ctx.contextPackage = pkg;
  ctx.stages.push({
    stage: "context-package-construction",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Executive Context Package assembled (${instructions.length} chars; ${contextItems.length} context items)`,
  });

  return ctx;
}

function extractGaps(ctx: PipelineContext): string[] {
  const gaps: string[] = [];
  if (!ctx.contextRelevance) gaps.push("No context relevance specification");
  if (!ctx.evidence?.evidencePackage) gaps.push("No evidence package");
  if (!ctx.evidence?.assembledContextPackage) gaps.push("No assembled context package");
  if (!ctx.continuity) gaps.push("No continuity package (cold start or no conversationId)");
  const epGaps = ctx.evidence?.evidencePackage?.gaps;
  if (Array.isArray(epGaps)) {
    for (const g of epGaps) {
      gaps.push(typeof g === "string" ? g : JSON.stringify(g));
    }
  }
  return gaps;
}

function buildLLMInstructions(ctx: PipelineContext): {
  instructions: string;
  contextItems: string[];
} {
  const sections: string[] = [];
  const contextItems: string[] = [];

  sections.push("# ApexOS Executive Context Package");
  sections.push("");
  sections.push("You are assisting an executive through ApexOS. Reason over the supplied context.");
  sections.push("Do not fabricate evidence. Recommendations inform — the executive decides.");
  sections.push(
    "Distinguish source evidence (executive-stated) from findings, hypotheses, and recommendations."
  );
  sections.push("");

  if (ctx.executive) {
    sections.push("## Executive");
    sections.push(`- Name: ${ctx.executive.displayName}`);
    if (ctx.executive.summary) sections.push(`- Summary: ${ctx.executive.summary}`);
    sections.push("");
    contextItems.push(`executive:${ctx.executive.slug}`);
  }

  if (ctx.situation) {
    sections.push("## Situation");
    sections.push(`- Title: ${ctx.situation.title}`);
    if (ctx.situation.summary) sections.push(`- Summary: ${ctx.situation.summary}`);
    if (ctx.situation.situationType) sections.push(`- Type: ${ctx.situation.situationType}`);
    sections.push("");
    contextItems.push(`situation:${ctx.situation.id}`);
  }

  if (ctx.continuity) {
    sections.push("## Continuity — Prior Source Evidence");
    appendContinuityItems(sections, contextItems, ctx.continuity.priorSourceEvidence, "source");

    sections.push("## Continuity — Saved Observations");
    appendContinuityItems(sections, contextItems, ctx.continuity.savedObservations, "observation");

    sections.push("## Continuity — Findings / Hypotheses (interpretation — not source evidence)");
    appendContinuityItems(sections, contextItems, ctx.continuity.findingsHypotheses, "interpretive");

    sections.push("## Continuity — Prior Recommendations (interpretation)");
    appendContinuityItems(sections, contextItems, ctx.continuity.recommendations, "recommendation");

    if (ctx.continuity.people.length) {
      sections.push("## Continuity — People");
      for (const p of ctx.continuity.people.slice(0, 8)) {
        sections.push(`- **${p.title}** (${p.summary})`);
        contextItems.push(`persons:${p.id}`);
      }
      sections.push("");
    }

    if (ctx.continuity.priorMessages.length) {
      sections.push("## Continuity — Prior Conversation Messages (most recent, bounded)");
      for (const m of ctx.continuity.priorMessages.slice(-6)) {
        const excerpt = m.content.slice(0, 400);
        sections.push(`- **${m.role}**: ${excerpt}`);
        contextItems.push(`conversation_messages:${m.id}`);
      }
      sections.push("");
    }
  }

  sections.push("## New Information In Current Message");
  sections.push(ctx.request.message);
  sections.push("");
  contextItems.push("current_message");

  if (ctx.contextRelevance) {
    sections.push("## Context Relevance");
    sections.push(`- Spec: ${ctx.contextRelevance.title} (${ctx.contextRelevance.externalId})`);
    sections.push(`- Rationale: ${ctx.contextRelevance.weightingRationale}`);
    if (ctx.contextRelevance.bodyMd) {
      sections.push("");
      sections.push(ctx.contextRelevance.bodyMd.slice(0, 4000));
    }
    sections.push("");
    contextItems.push(`context_relevance:${ctx.contextRelevance.externalId}`);
  }

  appendMemorySection(sections, contextItems, "Executive Memory", ctx.memory?.executive ?? [], "memory_executive");
  appendMemorySection(sections, contextItems, "Person Context", ctx.memory?.person ?? [], "memory_person");
  appendMemorySection(
    sections,
    contextItems,
    "Relationship Context",
    ctx.memory?.relationship ?? [],
    "memory_relationship"
  );
  appendMemorySection(sections, contextItems, "Validated Patterns", ctx.memory?.pattern ?? [], "memory_pattern");
  appendMemorySection(sections, contextItems, "Historical Outcomes", ctx.memory?.outcomes ?? [], "memory_outcome");
  appendMemorySection(
    sections,
    contextItems,
    "Situation Observations (memory layer)",
    ctx.memory?.observations ?? [],
    "memory_observation"
  );

  if (ctx.evidence?.assembledContextPackage?.bodyMd) {
    sections.push("## Assembled Context Package");
    sections.push(ctx.evidence.assembledContextPackage.bodyMd.slice(0, 8000));
    sections.push("");
    contextItems.push(`assembled_context:${ctx.evidence.assembledContextPackage.externalId}`);
  } else if (ctx.evidence?.evidencePackage?.bodyMd) {
    sections.push("## Evidence Package");
    sections.push(ctx.evidence.evidencePackage.bodyMd.slice(0, 8000));
    sections.push("");
    contextItems.push(`evidence_package:${ctx.evidence.evidencePackage.externalId}`);
  }

  if (ctx.evidence?.contradictoryEvidence.length) {
    sections.push("## Contradictory Evidence");
    for (const c of ctx.evidence.contradictoryEvidence) {
      sections.push(`- **${c.title}**: ${c.summary}`);
      contextItems.push(`contradictory:${c.externalId}`);
    }
    sections.push("");
  }

  if (ctx.governance) {
    sections.push("## Governance Constraints");
    for (const rule of ctx.governance.fidelityRules) {
      sections.push(`- ${rule}`);
    }
    sections.push("");
  }

  return { instructions: sections.join("\n"), contextItems };
}

function appendContinuityItems(
  sections: string[],
  contextItems: string[],
  items: ContinuityItem[],
  label: string
): void {
  if (!items.length) {
    sections.push("_None retrieved for this turn._");
    sections.push("");
    return;
  }
  for (const item of items) {
    sections.push(
      `- **[${item.epistemicType ?? item.type}]** ${item.title}: ${item.summary.slice(0, 400)}`
    );
    contextItems.push(`${item.table}:${item.id}:${label}`);
  }
  sections.push("");
}

function appendMemorySection(
  sections: string[],
  contextItems: string[],
  heading: string,
  items: Array<{ externalId?: string; title: string; summary: string; bodyMd?: string }>,
  prefix: string
): void {
  if (!items.length) return;
  sections.push(`## ${heading}`);
  for (const item of items.slice(0, 5)) {
    sections.push(`- **${item.title}**: ${item.summary}`);
    if (item.bodyMd) {
      sections.push(`  ${item.bodyMd.slice(0, 500)}`);
    }
    contextItems.push(`${prefix}:${item.externalId ?? item.title}`);
  }
  sections.push("");
}
