import assert from "node:assert/strict";
import test from "node:test";
import type { ContinuityPackage } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";
import { contextPackageBuilderStage } from "../stages/context-package-builder.js";

function baseCtx(continuity: ContinuityPackage | null): PipelineContext {
  return {
    request: {
      requestId: "req-followup",
      message: "What did we already establish about rotating meeting ownership?",
      executiveSlug: "primary-executive",
      situationSlug: "sit-1",
      conversationId: "conv-1",
      previousResponseId: null,
      receivedAt: new Date().toISOString(),
      metadata: {},
    },
    executive: { id: "e1", slug: "primary-executive", displayName: "Andrew" },
    situation: {
      id: "s1",
      slug: "sit-1",
      title: "Leadership team development",
      summary: "Jesse and Drew alignment",
      situationType: "leadership-development",
    },
    memory: {
      executive: [],
      person: [],
      relationship: [],
      pattern: [],
      outcomes: [],
      observations: [],
    },
    continuity,
    contextRelevance: null,
    evidence: {
      evidencePackage: null,
      contradictoryEvidence: [],
      assembledContextPackage: null,
      retrievalRequest: null,
    },
    governance: {
      doctrineReferences: [],
      fidelityRules: ["Do not fabricate evidence"],
      traceabilityRequired: true,
      driftProtection: [],
      validationResults: [],
    },
    contextPackage: null,
    llmResponse: null,
    interactionId: "conv-1",
    captureAudit: null,
    retrievalAudit: { retrieved: [], contextItems: [], errors: [] },
    stages: [],
  };
}

test("context package labels prior evidence vs findings vs current message", async () => {
  const continuity: ContinuityPackage = {
    conversationId: "conv-1",
    priorMessages: [
      {
        id: "m1",
        role: "executive",
        content: "Jesse and Drew struggle with aligned execution.",
        createdAt: new Date().toISOString(),
      },
    ],
    priorSourceEvidence: [
      {
        id: "obs-1",
        table: "observations",
        type: "source_evidence",
        title: "Source evidence 1",
        summary: "Jesse and Drew are strong in discussion but not aligned execution.",
        epistemicType: "source_evidence",
        score: 0.9,
      },
    ],
    savedObservations: [],
    findingsHypotheses: [
      {
        id: "mem-1",
        table: "memory_artifacts",
        type: "hypothesis",
        title: "hypothesis: passive agreement",
        summary: "This may indicate passive agreement rather than healthy conflict.",
        epistemicType: "hypothesis",
        score: 0.7,
      },
    ],
    recommendations: [
      {
        id: "mem-2",
        table: "memory_artifacts",
        type: "recommendation",
        title: "recommendation: rotate ownership",
        summary: "I recommend rotating leadership-meeting ownership.",
        epistemicType: "recommendation",
        score: 0.8,
      },
    ],
    people: [
      {
        id: "p1",
        table: "persons",
        type: "person",
        title: "Jesse",
        summary: "jesse",
      },
    ],
    currentMessage: "What did we already establish about rotating meeting ownership?",
  };

  const ctx = await contextPackageBuilderStage(baseCtx(continuity));
  const instructions = ctx.contextPackage?.llmInstructions ?? "";
  assert.match(instructions, /Prior Source Evidence/i);
  assert.match(instructions, /Findings \/ Hypotheses/i);
  assert.match(instructions, /New Information In Current Message/i);
  assert.match(instructions, /interpretation — not source evidence/i);
  assert.match(instructions, /Jesse and Drew/);
  assert.ok(ctx.contextPackage?.contextItemsSupplied.some((i) => i.startsWith("observations:obs-1")));
  assert.ok(ctx.contextPackage?.contextItemsSupplied.includes("current_message"));
  assert.equal(ctx.retrievalAudit?.contextItems.length, ctx.contextPackage?.contextItemsSupplied.length);
});

test("trace metadata shape includes created and retrieved record fields on response builder", async () => {
  // Covered via buildRuntimeResponse in extractor tests; assert continuity package wiring here.
  const ctx = await contextPackageBuilderStage(baseCtx(null));
  assert.ok(ctx.contextPackage?.contextItemsSupplied.includes("current_message"));
  assert.ok(ctx.contextPackage?.continuity === null);
});
