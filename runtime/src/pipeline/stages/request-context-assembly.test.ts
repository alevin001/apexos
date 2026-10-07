import assert from "node:assert/strict";
import test from "node:test";
import { extractInterpretiveSegments } from "../capture/cold-start-extractor.js";
import { buildRuntimeResponse } from "./response-processing.js";
import type { PipelineContext } from "../../types/pipeline.js";

test("buildRuntimeResponse exposes non-null contextPackageId when ACP is present", () => {
  const ctx = {
    request: {
      requestId: "req-trace-1",
      message: "I need help with Drew and Jesse on healthy conflict.",
      executiveSlug: "primary-executive",
      situationSlug: "runtime-test",
      conversationId: "conv-1",
      previousResponseId: null,
      receivedAt: new Date().toISOString(),
      metadata: {},
    },
    executive: { id: "e1", slug: "primary-executive", displayName: "Andrew" },
    situation: {
      id: "sit-1",
      slug: "runtime-test",
      title: "Leadership conflict",
      summary: "Drew and Jesse",
    },
    memory: null,
    continuity: null,
    contextRelevance: {
      externalId: "CRS-RT-test",
      title: "Runtime CRS",
      situationSummary: "test",
      domainWeights: {},
      weightingRationale: "limitations stated",
      retrievalTiers: {},
    },
    evidence: {
      evidencePackage: {
        externalId: "EP-RT-test",
        title: "Runtime EP",
        assemblyTiers: {},
        gaps: ["Request-scoped assembly"],
      },
      contradictoryEvidence: [],
      assembledContextPackage: {
        externalId: "ACP-RT-test",
        title: "Runtime ACP",
        assemblyTiers: {},
      },
      retrievalRequest: {
        externalId: "RR-RT-test",
        title: "Runtime RR",
        scopeSummary: "request-scoped",
      },
    },
    governance: {
      doctrineReferences: [],
      fidelityRules: [],
      traceabilityRequired: true,
      driftProtection: [],
      validationResults: [],
    },
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "req-trace-1",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: { slug: "runtime-test", title: "Leadership conflict" },
      executiveMessage: "I need help with Drew and Jesse on healthy conflict.",
      continuity: null,
      memory: {
        executive: [],
        person: [],
        relationship: [],
        pattern: [],
        outcomes: [],
        observations: [],
      },
      contextRelevance: null,
      evidence: {
        evidencePackage: null,
        contradictoryEvidence: [],
        assembledContextPackage: null,
        retrievalRequest: null,
      },
      governance: {
        doctrineReferences: [],
        fidelityRules: [],
        traceabilityRequired: true,
        driftProtection: [],
        validationResults: [],
      },
      confidence: {
        retrievalConfidence: "low",
        evidenceGaps: [],
        uncertaintyFlags: [],
        assumptions: [],
      },
      doctrine: [],
      contextItemsSupplied: ["knowledge:SRC-1:RU-1"],
      llmInstructions: "test",
    },
    llmResponse: {
      text: "I recommend one conversation about healthy conflict.",
      model: "test",
      provider: "test",
      responseId: "resp-1",
    },
    interactionId: "conv-1",
    captureAudit: {
      created: [
        { table: "situations", id: "sit-1", type: "situation", externalId: "SIT-1" },
        {
          table: "memory_artifacts",
          id: "mem-1",
          type: "recommendation",
          externalId: "MEM-REC-1",
        },
        {
          table: "memory_artifacts",
          id: "mem-2",
          type: "alternative",
          externalId: "MEM-ALT-1",
        },
        {
          table: "memory_artifacts",
          id: "mem-3",
          type: "decision",
          externalId: "MEM-DEC-1",
        },
        {
          table: "memory_artifacts",
          id: "mem:4",
          type: "outcome",
          externalId: "MEM-OUT-1",
        },
      ],
      situationId: "sit-1",
      situationSlug: "runtime-test",
      errors: [],
      extraction: null,
    },
    retrievalAudit: { retrieved: [], contextItems: ["knowledge:SRC-1:RU-1"], errors: [] },
    stages: [
      { stage: "context-retrieval", status: "success", durationMs: 1, detail: "CRS-RT-test" },
      { stage: "evidence-assembly", status: "success", durationMs: 1, detail: "ACP-RT-test" },
    ],
  } as unknown as PipelineContext;

  const response = buildRuntimeResponse(ctx);
  assert.equal(response.contextPackageId, "ACP-RT-test");
  assert.ok(response.metadata.contextItems.includes("knowledge:SRC-1:RU-1"));
  assert.ok(response.metadata.recordsCreated.some((r) => r.type === "recommendation"));
  assert.ok(response.metadata.recordsCreated.some((r) => r.type === "alternative"));
  assert.ok(response.metadata.recordsCreated.some((r) => r.type === "decision"));
  assert.ok(response.metadata.recordsCreated.some((r) => r.type === "outcome"));
});

test("extractInterpretiveSegments covers full reasoning chain labels", () => {
  const segments = extractInterpretiveSegments(
    [
      "Option A is a direct Drew conversation; Option B is a joint session with Jesse — tradeoff is speed versus shared ownership.",
      "I recommend starting with Drew on healthy conflict and execution speed.",
      "The decision to make is which conversation happens first.",
      "Track whether ownership clarity improves after the meeting.",
    ].join(" ")
  );
  const types = new Set(segments.map((s) => s.epistemicType));
  assert.ok(types.has("alternative"));
  assert.ok(types.has("recommendation"));
  assert.ok(types.has("proposed_decision"));
  assert.ok(!types.has("decision"));
  assert.ok(types.has("outcome"));
});
