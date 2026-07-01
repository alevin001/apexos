import type {
  ConfidenceIndicators,
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
    retrievalConfidence: ctx.evidence?.assembledContextPackage ? "medium" : "low",
    evidenceGaps: extractGaps(ctx),
    uncertaintyFlags: ctx.evidence?.assembledContextPackage ? [] : ["no_assembled_context_package"],
    assumptions: ["Executive context assembled from available pipeline artifacts"],
  };

  const llmInstructions = buildLLMInstructions(ctx);

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
    llmInstructions,
  };

  ctx.contextPackage = pkg;
  ctx.stages.push({
    stage: "context-package-construction",
    status: "success",
    durationMs: Date.now() - start,
    detail: `Executive Context Package assembled (${llmInstructions.length} chars instructions)`,
  });

  return ctx;
}

function extractGaps(ctx: PipelineContext): string[] {
  const gaps: string[] = [];
  if (!ctx.contextRelevance) gaps.push("No context relevance specification");
  if (!ctx.evidence?.evidencePackage) gaps.push("No evidence package");
  if (!ctx.evidence?.assembledContextPackage) gaps.push("No assembled context package");
  const epGaps = ctx.evidence?.evidencePackage?.gaps;
  if (Array.isArray(epGaps)) {
    for (const g of epGaps) {
      gaps.push(typeof g === "string" ? g : JSON.stringify(g));
    }
  }
  return gaps;
}

function buildLLMInstructions(ctx: PipelineContext): string {
  const sections: string[] = [];

  sections.push("# ApexOS Executive Context Package");
  sections.push("");
  sections.push("You are assisting an executive through ApexOS. Reason over the supplied context.");
  sections.push("Do not fabricate evidence. Recommendations inform — the executive decides.");
  sections.push("");

  if (ctx.executive) {
    sections.push("## Executive");
    sections.push(`- Name: ${ctx.executive.displayName}`);
    if (ctx.executive.summary) sections.push(`- Summary: ${ctx.executive.summary}`);
    sections.push("");
  }

  if (ctx.situation) {
    sections.push("## Situation");
    sections.push(`- Title: ${ctx.situation.title}`);
    if (ctx.situation.summary) sections.push(`- Summary: ${ctx.situation.summary}`);
    if (ctx.situation.situationType) sections.push(`- Type: ${ctx.situation.situationType}`);
    sections.push("");
  }

  if (ctx.contextRelevance) {
    sections.push("## Context Relevance");
    sections.push(`- Spec: ${ctx.contextRelevance.title} (${ctx.contextRelevance.externalId})`);
    sections.push(`- Rationale: ${ctx.contextRelevance.weightingRationale}`);
    if (ctx.contextRelevance.bodyMd) {
      sections.push("");
      sections.push(ctx.contextRelevance.bodyMd.slice(0, 4000));
    }
    sections.push("");
  }

  appendMemorySection(sections, "Executive Memory", ctx.memory?.executive ?? []);
  appendMemorySection(sections, "Person Context", ctx.memory?.person ?? []);
  appendMemorySection(sections, "Relationship Context", ctx.memory?.relationship ?? []);
  appendMemorySection(sections, "Validated Patterns", ctx.memory?.pattern ?? []);
  appendMemorySection(sections, "Historical Outcomes", ctx.memory?.outcomes ?? []);

  if (ctx.evidence?.assembledContextPackage?.bodyMd) {
    sections.push("## Assembled Context Package");
    sections.push(ctx.evidence.assembledContextPackage.bodyMd.slice(0, 8000));
    sections.push("");
  } else if (ctx.evidence?.evidencePackage?.bodyMd) {
    sections.push("## Evidence Package");
    sections.push(ctx.evidence.evidencePackage.bodyMd.slice(0, 8000));
    sections.push("");
  }

  if (ctx.evidence?.contradictoryEvidence.length) {
    sections.push("## Contradictory Evidence");
    for (const c of ctx.evidence.contradictoryEvidence) {
      sections.push(`- **${c.title}**: ${c.summary}`);
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

  return sections.join("\n");
}

function appendMemorySection(
  sections: string[],
  heading: string,
  items: Array<{ title: string; summary: string; bodyMd?: string }>
): void {
  if (!items.length) return;
  sections.push(`## ${heading}`);
  for (const item of items.slice(0, 5)) {
    sections.push(`- **${item.title}**: ${item.summary}`);
    if (item.bodyMd) {
      sections.push(`  ${item.bodyMd.slice(0, 500)}`);
    }
  }
  sections.push("");
}
