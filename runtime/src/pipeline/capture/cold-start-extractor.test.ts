import assert from "node:assert/strict";
import test from "node:test";
import {
  extractColdStart,
  extractInterpretiveSegments,
  extractPeople,
  extractSourceFacts,
  isMaterialSituation,
  relevanceScore,
} from "./cold-start-extractor.js";
import { resolveExecutiveSlug, CANONICAL_EXECUTIVE_SLUG } from "../../shared/executive-identity.js";
import { buildRuntimeResponse } from "../stages/response-processing.js";
import type { PipelineContext } from "../../types/pipeline.js";

const LEADERSHIP_MESSAGE = [
  "I need help developing my leadership team.",
  "Jesse and Drew are strong in discussion but we do not get aligned execution.",
  "I want healthy conflict instead of passive agreement,",
  "and I am considering rotating leadership-meeting ownership to create CEO leverage.",
].join(" ");

test("extractPeople finds referenced leaders without hard-coded names", () => {
  const people = extractPeople(LEADERSHIP_MESSAGE);
  const names = people.map((p) => p.displayName);
  assert.ok(names.includes("Jesse") || names.some((n) => n.includes("Jesse")));
  assert.ok(names.includes("Drew") || names.some((n) => n.includes("Drew")));
});

test("cold-start marks material leadership situation and preserves source facts", () => {
  assert.equal(isMaterialSituation(LEADERSHIP_MESSAGE), true);
  const extraction = extractColdStart(LEADERSHIP_MESSAGE);
  assert.equal(extraction.isMaterialSituation, true);
  assert.ok(extraction.sourceFacts.length >= 1);
  assert.ok(extraction.sourceFacts.every((f) => f.epistemicType === "source_evidence"));
  assert.ok(
    extraction.sourceFacts.some((f) => /Jesse|Drew|healthy conflict|rotating|execution/i.test(f.text))
  );
  assert.ok(extraction.people.length >= 1);
});

test("interpretive segments are labeled separately from source evidence", () => {
  const response = [
    "A key finding is that aligned discussion is not the same as aligned execution.",
    "This may indicate passive agreement rather than healthy conflict.",
    "I recommend rotating leadership-meeting ownership to create accountability.",
  ].join(" ");
  const segments = extractInterpretiveSegments(response);
  const types = new Set(segments.map((s) => s.epistemicType));
  assert.ok(types.has("finding") || types.has("hypothesis") || types.has("recommendation"));
  assert.ok(segments.some((s) => s.epistemicType === "recommendation"));
  assert.ok(!segments.some((s) => (s as { epistemicType: string }).epistemicType === "source_evidence"));
});

test("relevanceScore ranks overlapping content higher", () => {
  const q = "leadership team healthy conflict rotating ownership";
  const high = relevanceScore(q, "healthy conflict and rotating meeting ownership");
  const low = relevanceScore(q, "quarterly budget spreadsheet formatting tips");
  assert.ok(high > low);
});

test("executive aliases resolve Andrew to primary-executive without duplicates", () => {
  assert.equal(resolveExecutiveSlug("andrew"), CANONICAL_EXECUTIVE_SLUG);
  assert.equal(resolveExecutiveSlug("Andre"), CANONICAL_EXECUTIVE_SLUG);
  assert.equal(resolveExecutiveSlug("primary-executive"), CANONICAL_EXECUTIVE_SLUG);
  assert.equal(resolveExecutiveSlug("other-exec"), "other-exec");
});

test("buildRuntimeResponse returns created conversation ID not null input", () => {
  const ctx = {
    request: {
      requestId: "req-1",
      message: "hello",
      executiveSlug: "primary-executive",
      situationSlug: null,
      conversationId: null,
      previousResponseId: null,
      receivedAt: new Date().toISOString(),
      metadata: {},
    },
    executive: { id: "e1", slug: "primary-executive", displayName: "Andrew" },
    situation: { id: "s1", slug: "sit-1", title: "T" },
    memory: null,
    continuity: null,
    contextRelevance: null,
    evidence: null,
    governance: null,
    contextPackage: { contextItemsSupplied: ["current_message"] },
    llmResponse: { text: "ok", model: "stub", provider: "stub", responseId: "r1" },
    interactionId: "conv-created-123",
    captureAudit: {
      created: [{ table: "situations", id: "s1", type: "situation" }],
      situationId: "s1",
      situationSlug: "sit-1",
      errors: [],
    },
    retrievalAudit: { retrieved: [], contextItems: [], errors: [] },
    stages: [
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
  } as unknown as PipelineContext;

  const response = buildRuntimeResponse(ctx);
  assert.equal(response.conversationId, "conv-created-123");
  assert.equal(response.metadata.persistenceStatus, "persisted");
  assert.equal(response.metadata.situationId, "s1");
  assert.equal(response.metadata.recordsCreated.length, 1);
});

test("extractSourceFacts never labels executive text as recommendation", () => {
  const facts = extractSourceFacts(LEADERSHIP_MESSAGE);
  assert.ok(facts.every((f) => f.epistemicType === "source_evidence"));
});
