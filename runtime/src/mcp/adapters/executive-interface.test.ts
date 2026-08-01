import assert from "node:assert/strict";
import test from "node:test";
import type { ExecutiveContextPackage } from "../../types/context-package.js";
import {
  buildApexosBasis,
  buildUnavailableBasis,
  formatBasisDisplayLine,
} from "./apexos-basis.js";
import {
  clearConversationStateForTests,
  getConversationState,
  rememberConversation,
  resolveConversationId,
  resolveSessionKey,
  STDIO_SESSION_KEY,
} from "./conversation-state.js";
import { buildGlassBox, buildUnavailableGlassBox } from "./glass-box.js";

test("natural-message cold start resolves to new continuity without inventing an ID", () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-natural-1");
  const resolved = resolveConversationId({
    explicitConversationId: undefined,
    sessionKey,
  });
  assert.equal(resolved.conversationId, undefined);
  assert.equal(resolved.continuitySource, "new");
  assert.equal(resolved.reusedFromSession, false);
});

test("continuation reuses conversation only from confirmed session tool state", () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-continue");
  rememberConversation(sessionKey, "conv-abc-123", "runtime-1");

  const resolved = resolveConversationId({
    explicitConversationId: undefined,
    sessionKey,
  });
  assert.equal(resolved.conversationId, "conv-abc-123");
  assert.equal(resolved.continuitySource, "session");
  assert.equal(resolved.reusedFromSession, true);

  const otherSession = resolveConversationId({
    explicitConversationId: undefined,
    sessionKey: resolveSessionKey("sess-other"),
  });
  assert.equal(otherSession.conversationId, undefined);
  assert.equal(otherSession.continuitySource, "new");
});

test("explicit conversationId wins over session state", () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-explicit");
  rememberConversation(sessionKey, "conv-session", "runtime-1");
  const resolved = resolveConversationId({
    explicitConversationId: "conv-explicit",
    sessionKey,
  });
  assert.equal(resolved.conversationId, "conv-explicit");
  assert.equal(resolved.continuitySource, "explicit");
});

test("stdio without mcp-session-id uses process-scoped tool state key", () => {
  clearConversationStateForTests();
  assert.equal(resolveSessionKey(undefined), STDIO_SESSION_KEY);
  assert.equal(resolveSessionKey(""), STDIO_SESSION_KEY);
  rememberConversation(STDIO_SESSION_KEY, "conv-stdio", "runtime-stdio");
  assert.equal(getConversationState(STDIO_SESSION_KEY)?.conversationId, "conv-stdio");
});

test("basis: new situation captured and saved", () => {
  const basis = buildApexosBasis({
    conversationId: "conv-1",
    continuitySource: "new",
    persistenceStatus: "persisted",
    recordsCreated: [{ table: "situations", id: "s1", type: "situation" }],
    recordsRetrieved: [],
    stages: [
      { stage: "continuity-retrieval", status: "skipped", durationMs: 1 },
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
    runtimeAvailable: true,
  });
  assert.equal(basis.status, "New situation captured and saved.");
  assert.equal(basis.persistenceConfirmed, true);
  assert.equal(basis.groundedInSavedMemory, false);
  assert.equal(formatBasisDisplayLine(basis), `ApexOS Basis: ${basis.status}`);
});

test("basis: retrieved saved ApexOS memory with count", () => {
  const basis = buildApexosBasis({
    conversationId: "conv-1",
    continuitySource: "session",
    persistenceStatus: "persisted",
    recordsCreated: [],
    recordsRetrieved: [
      { table: "observations", id: "o1", type: "source_evidence" },
      { table: "conversation_messages", id: "m1" },
    ],
    stages: [
      { stage: "continuity-retrieval", status: "success", durationMs: 1 },
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
    runtimeAvailable: true,
  });
  assert.equal(basis.status, "Retrieved saved ApexOS memory: 2 relevant records.");
  assert.equal(basis.retrievalConfirmed, true);
  assert.equal(basis.groundedInSavedMemory, true);
  assert.equal(basis.recordsRetrievedCount, 2);
});

test("basis: no relevant saved memory", () => {
  const basis = buildApexosBasis({
    conversationId: "conv-1",
    continuitySource: "session",
    persistenceStatus: "persisted",
    recordsCreated: [],
    recordsRetrieved: [],
    stages: [
      { stage: "continuity-retrieval", status: "success", durationMs: 1 },
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
    runtimeAvailable: true,
  });
  assert.equal(
    basis.status,
    "No relevant saved ApexOS records found. Response is based on your current message only."
  );
  assert.equal(basis.groundedInSavedMemory, false);
  assert.equal(basis.retrievalConfirmed, true);
});

test("basis: failed persistence does not claim saved update", () => {
  const basis = buildApexosBasis({
    conversationId: null,
    continuitySource: "new",
    persistenceStatus: "failed",
    recordsCreated: [],
    recordsRetrieved: [],
    captureErrors: ["insert failed"],
    stages: [{ stage: "interaction-capture", status: "failed", durationMs: 1 }],
    runtimeAvailable: true,
  });
  assert.match(basis.status, /persistence was not confirmed/i);
  assert.equal(basis.persistenceConfirmed, false);
  assert.equal(basis.groundedInSavedMemory, false);
  assert.ok(basis.degradations.includes("persistence_failed"));
});

test("basis: failed retrieval does not claim memory grounding", () => {
  const basis = buildApexosBasis({
    conversationId: "conv-missing",
    continuitySource: "explicit",
    persistenceStatus: "persisted",
    recordsCreated: [],
    recordsRetrieved: [],
    retrievalErrors: ["Conversation not found"],
    stages: [{ stage: "continuity-retrieval", status: "failed", durationMs: 1 }],
    runtimeAvailable: true,
  });
  assert.match(basis.status, /retrieval was not confirmed/i);
  assert.equal(basis.groundedInSavedMemory, false);
  assert.equal(basis.retrievalConfirmed, false);
});

test("basis: unavailable runtime", () => {
  const basis = buildUnavailableBasis();
  assert.equal(
    basis.status,
    "ApexOS runtime was not available; do not treat this as a database-grounded response."
  );
  assert.equal(basis.groundedInSavedMemory, false);
  assert.equal(basis.persistenceConfirmed, false);
  assert.equal(basis.retrievalConfirmed, false);
  assert.equal(basis.traceConfirmed, false);
});

function fixtureContextPackage(): ExecutiveContextPackage {
  return {
    version: "1.0",
    assembledAt: "2026-08-01T12:00:00.000Z",
    requestId: "req-glass-1",
    executive: { slug: "primary-executive", displayName: "Andrew" },
    situation: { slug: "lead-1", title: "Leadership conflict" },
    executiveMessage: "Jesse and Drew disagree on healthy conflict ownership.",
    continuity: {
      conversationId: "conv-1",
      priorMessages: [
        {
          id: "msg-1",
          role: "executive",
          content: "Earlier we established rotating ownership.",
          createdAt: "2026-08-01T11:00:00.000Z",
        },
      ],
      priorSourceEvidence: [
        {
          id: "obs-1",
          table: "observations",
          type: "source_evidence",
          title: "Conflict noted",
          summary: "Jesse and Drew disagree",
          epistemicType: "source_evidence",
        },
      ],
      savedObservations: [],
      findingsHypotheses: [
        {
          id: "find-1",
          table: "memory_artifacts",
          type: "finding",
          title: "Alignment gap",
          summary: "Execution vs alignment tension",
          epistemicType: "finding",
        },
        {
          id: "hyp-1",
          table: "memory_artifacts",
          type: "hypothesis",
          title: "Ownership rotation helps",
          summary: "Rotating ownership may reduce conflict",
          epistemicType: "hypothesis",
        },
      ],
      recommendations: [
        {
          id: "rec-1",
          table: "memory_artifacts",
          type: "recommendation",
          title: "Rotate facilitation",
          summary: "Try rotating meeting ownership for two weeks",
          epistemicType: "recommendation",
        },
      ],
      people: [
        {
          id: "p-1",
          table: "persons",
          type: "person",
          title: "Jesse",
          summary: "Leader",
        },
      ],
      currentMessage: "Jesse and Drew disagree on healthy conflict ownership.",
    },
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
      retrievalConfidence: "medium",
      evidenceGaps: [],
      uncertaintyFlags: [],
      assumptions: ["Assembled from available pipeline artifacts"],
    },
    doctrine: [],
    contextItemsSupplied: ["current_message", "observations:obs-1"],
    llmInstructions: "do-not-use-for-glass-box-fabrication",
  };
}

test("glassBox accuracy against Context Package and audit fixtures", () => {
  const glass = buildGlassBox({
    runtimeId: "req-glass-1",
    conversationId: "conv-1",
    contextPackageId: "cp-1",
    contextPackage: fixtureContextPackage(),
    recordsCreated: [{ table: "observations", id: "obs-new", type: "source_evidence" }],
    recordsRetrieved: [{ table: "observations", id: "obs-1", type: "source_evidence" }],
    stages: [{ stage: "continuity-retrieval", status: "success", durationMs: 2 }],
  });

  assert.equal(glass.source, "context_package_and_runtime_trace");
  assert.match(glass.auditableChain, /Situation → retrieved context/);

  const byStage = Object.fromEntries(glass.stages.map((s) => [s.stage, s]));
  assert.equal(byStage.current_executive_message.status, "captured");
  assert.match(byStage.current_executive_message.summary, /Current executive message/);
  assert.ok(byStage.retrieved_durable_records.count >= 1);
  assert.equal(byStage.source_evidence.status, "captured");
  assert.ok(byStage.source_evidence.ids.includes("obs-1"));
  assert.equal(byStage.findings_interpretations.status, "captured");
  assert.equal(byStage.hypotheses_assumptions.status, "captured");
  assert.equal(byStage.recommendation.status, "captured");
  assert.equal(byStage.alternatives.status, "not_captured");
  assert.equal(byStage.executive_decision.status, "not_captured");
  assert.equal(byStage.outcome_learning.status, "not_captured");
  assert.equal(byStage.alternatives.summary, "not captured");
});

test("glassBox does not fabricate stages from model prose when package missing", () => {
  const glass = buildGlassBox({
    runtimeId: "req-2",
    conversationId: null,
    contextPackageId: null,
    contextPackage: null,
    recordsCreated: [],
    recordsRetrieved: [],
  });
  assert.ok(glass.stages.every((s) => s.status === "not_captured"));
  const unavailable = buildUnavailableGlassBox(null);
  assert.ok(
    unavailable.stages.every((s) => s.summary.includes("runtime was not available"))
  );
});

test("glassBox never uses llmInstructions as a captured stage", () => {
  const pkg = fixtureContextPackage();
  const glass = buildGlassBox({
    runtimeId: pkg.requestId,
    conversationId: "conv-1",
    contextPackageId: null,
    contextPackage: pkg,
  });
  const blob = JSON.stringify(glass);
  assert.equal(blob.includes("do-not-use-for-glass-box-fabrication"), false);
});
