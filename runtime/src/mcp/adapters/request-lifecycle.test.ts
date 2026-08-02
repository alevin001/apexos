import assert from "node:assert/strict";
import test from "node:test";
import {
  RequestLifecycle,
  clearLifecyclesForTests,
  getLifecycleByRequestId,
  getRecentLifecycles,
} from "./request-lifecycle.js";

test("lifecycle emits required events in order on success path", () => {
  clearLifecyclesForTests();
  const life = new RequestLifecycle("apexos_conversation");
  life.requestReceived({
    messageLength: 42,
    sessionKeyKind: "mcp_session",
    glassBoxRequest: false,
  });
  life.runtimeStarting();
  life.continuityResolved("durable_fallback");
  life.runtimeCompleted({
    runtimeId: "rt-1",
    conversationId: "conv-1",
    captureConfirmed: true,
    retrievalConfirmed: true,
    persistenceConfirmed: true,
    traceConfirmed: true,
  });
  life.responseAssembled({ basisIncluded: true, glassBoxReminderIncluded: true });
  life.mcpResponseSent({
    success: true,
    responseBytes: 128,
    contentType: "application/json",
  });

  const diag = life.buildLifecycleDiagnostic();
  assert.deepEqual(diag.events, [
    "request_received",
    "runtime_starting",
    "continuity_resolved",
    "runtime_completed",
    "response_assembled",
    "mcp_response_sent",
  ]);
  assert.equal(diag.continuitySource, "durable_fallback");
  assert.equal(diag.basisIncluded, true);
  assert.equal(diag.glassBoxReminderIncluded, true);
  assert.equal(diag.persistenceConfirmed, true);
  assert.equal(diag.retrievalConfirmed, true);
  assert.equal(diag.traceConfirmed, true);

  const inv = life.buildInvocation("invoked");
  assert.equal(inv.status, "invoked");
  assert.equal(inv.requestId, life.requestId);
  assert.equal(inv.runtimeId, "rt-1");
  assert.equal(inv.responseReturned, true);

  const stored = getLifecycleByRequestId(life.requestId);
  assert.ok(stored);
  assert.equal(stored?.outcome, "completed");
  assert.equal(getRecentLifecycles(5)[0]?.requestId, life.requestId);
});

test("request_failed still reaches mcp_response_sent via finalize pattern", () => {
  clearLifecyclesForTests();
  const life = new RequestLifecycle("apexos_conversation");
  life.requestReceived({
    messageLength: 10,
    sessionKeyKind: "stdio_process",
    glassBoxRequest: false,
  });
  life.runtimeStarting();
  life.requestFailed("runtime_starting", new Error("boom"));
  life.responseAssembled({ basisIncluded: true, glassBoxReminderIncluded: true });
  life.mcpResponseSent({
    success: false,
    responseBytes: 64,
    contentType: "application/json",
  });

  const diag = life.buildLifecycleDiagnostic();
  assert.ok(diag.events.includes("request_failed"));
  assert.ok(diag.events.includes("mcp_response_sent"));
  assert.equal(diag.failedStage, "runtime_starting");
  assert.match(diag.errorSummary ?? "", /boom/);
  assert.equal(life.buildInvocation("failed").responseReturned, true);
  assert.equal(getLifecycleByRequestId(life.requestId)?.outcome, "failed");
});

test("lifecycle logs omit message body fields", () => {
  clearLifecyclesForTests();
  const life = new RequestLifecycle("apexos_conversation");
  life.requestReceived({
    messageLength: 99,
    sessionKeyKind: "mcp_session",
    glassBoxRequest: false,
  });
  const summary = getLifecycleByRequestId(life.requestId);
  assert.equal(summary?.messageLength, 99);
  const blob = JSON.stringify(summary);
  assert.equal(blob.includes("Drew"), false);
  assert.equal(blob.includes("message\":"), false);
});
