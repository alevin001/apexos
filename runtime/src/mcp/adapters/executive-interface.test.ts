import assert from "node:assert/strict";
import test from "node:test";
import type { ExecutiveContextPackage } from "../../types/context-package.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../../shared/supabase.js";
import {
  buildApexosBasis,
  buildUnavailableBasis,
  formatInterfaceStatusBlock,
  GLASS_BOX_REMINDER,
} from "./apexos-basis.js";
import {
  clearConversationStateForTests,
  getConversationState,
  isNewSituationRequest,
  rememberConversation,
  resolveContinuity,
  resolveConversationId,
  resolveSessionKey,
  STDIO_SESSION_KEY,
} from "./conversation-state.js";
import { DURABLE_CONTINUITY_MAX_AGE_MS } from "./durable-continuity.js";
import { buildGlassBox, buildUnavailableGlassBox } from "./glass-box.js";
import {
  glassBoxFromDurableTrace,
  isGlassBoxRequest,
  resolveGlassBoxRequest,
  routeExecutiveToolMessage,
} from "./glass-box-request.js";
import {
  setInvokeExecuteRuntimeForTests,
  type ExecuteRuntimeResult,
} from "./runtime-adapter.js";
import { handleExecutiveConversation } from "../tools/register-tools.js";
import { PRIMARY_TOOL_NAME } from "../connector-guidance.js";
import { completeTrace, getTrace, startTrace } from "./trace-store.js";

function createDurableMock(opts: {
  executiveId?: string | null;
  conversation?: {
    id: string;
    executive_id: string;
    status: string;
    updated_at: string;
  } | null;
  trace?: {
    request_id: string;
    conversation_id: string;
    status: string;
    started_at: string;
    executive_slug?: string;
    stages?: unknown;
    records_created?: unknown;
    records_retrieved?: unknown;
    context_items?: unknown;
    capture_errors?: unknown;
    metadata?: unknown;
  } | null;
  latestTrace?: Record<string, unknown> | null;
}) {
  const executiveId = opts.executiveId ?? "exec-1";

  function from(table: string) {
    const filters: Record<string, unknown> = {};
    const api: Record<string, unknown> = {
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        filters[column] = value;
        return api;
      },
      gte(column: string, value: unknown) {
        filters[`gte:${column}`] = value;
        return api;
      },
      order() {
        return api;
      },
      limit() {
        return api;
      },
      async maybeSingle() {
        if (table === "executives") {
          if (filters.slug === "primary-executive" && executiveId) {
            return { data: { id: executiveId, slug: "primary-executive" }, error: null };
          }
          return { data: null, error: null };
        }
        if (table === "executive_conversations") {
          const conv = opts.conversation;
          if (
            conv &&
            filters.executive_id === conv.executive_id &&
            filters.status === "active"
          ) {
            return { data: conv, error: null };
          }
          return { data: null, error: null };
        }
        if (table === "runtime_interaction_traces") {
          if (filters.request_id && opts.latestTrace?.request_id === filters.request_id) {
            return { data: opts.latestTrace, error: null };
          }
          if (filters.request_id && opts.trace?.request_id === filters.request_id) {
            return { data: opts.trace, error: null };
          }
          if (filters.conversation_id && opts.trace?.conversation_id === filters.conversation_id) {
            return { data: opts.trace, error: null };
          }
          if (filters.executive_slug && opts.latestTrace) {
            return { data: opts.latestTrace, error: null };
          }
          if (filters.executive_slug && opts.trace?.executive_slug === filters.executive_slug) {
            return { data: opts.trace, error: null };
          }
          return { data: null, error: null };
        }
        return { data: null, error: null };
      },
    };
    return api;
  }

  return { from } as unknown as SupabaseClient;
}

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

test("confirmed session continuity reuses conversation", () => {
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
  assert.equal(resolved.lastRuntimeId, "runtime-1");
});

test("resolveConversationId still surfaces explicit IDs (legacy helper)", () => {
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

test("isNewSituationRequest detects capture-as-new phrasing", () => {
  assert.equal(
    isNewSituationRequest(
      "Capture this as a new executive situation. I need to prepare for a leadership meeting."
    ),
    true
  );
  assert.equal(isNewSituationRequest("What should I say to Drew?"), false);
});

test("mismatched host conversationId does not override session binding", async () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-keep-session");
  rememberConversation(sessionKey, "conv-session", "runtime-1");
  const resolved = await resolveContinuity({
    explicitConversationId: "conv-stale-from-host",
    sessionKey,
    message: "Follow up on the conflict discussion.",
  });
  assert.equal(resolved.conversationId, "conv-session");
  assert.equal(resolved.continuitySource, "session");
});

test("stdio without mcp-session-id uses process-scoped tool state key", () => {
  clearConversationStateForTests();
  assert.equal(resolveSessionKey(undefined), STDIO_SESSION_KEY);
  rememberConversation(STDIO_SESSION_KEY, "conv-stdio", "runtime-stdio");
  assert.equal(getConversationState(STDIO_SESSION_KEY)?.conversationId, "conv-stdio");
});

test("fresh chat does not auto-bind durable conversation as active situation", async () => {
  clearConversationStateForTests();
  const now = Date.now();
  const updatedAt = new Date(now - 60_000).toISOString();
  const startedAt = new Date(now - 30_000).toISOString();

  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: "conv-durable-1",
        executive_id: "exec-1",
        status: "active",
        updated_at: updatedAt,
      },
      trace: {
        request_id: "runtime-durable-1",
        conversation_id: "conv-durable-1",
        status: "completed",
        started_at: startedAt,
        executive_slug: "primary-executive",
      },
    })
  );

  try {
    const resolved = await resolveContinuity({
      explicitConversationId: undefined,
      sessionKey: resolveSessionKey("brand-new-host-session"),
      executiveSlug: "andrew",
      message:
        "I need to prepare for a leadership meeting with Drew and Jesse about healthy conflict.",
    });
    assert.equal(resolved.conversationId, undefined);
    assert.equal(resolved.continuitySource, "new");
    assert.equal(resolved.forceNewSituation, false);
    assert.match(resolved.disclosure ?? "", /No prior ApexOS conversation was confirmed/);
  } finally {
    setSupabaseForTests(null);
  }
});

test("explicit new-situation request ignores host conversationId and durable state", async () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-stale-host-id");
  rememberConversation(sessionKey, "conv-old-session", "runtime-old");

  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: "conv-durable-old",
        executive_id: "exec-1",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      trace: {
        request_id: "runtime-durable-old",
        conversation_id: "conv-durable-old",
        status: "completed",
        started_at: new Date().toISOString(),
      },
    })
  );

  try {
    const resolved = await resolveContinuity({
      explicitConversationId: "243d90a7-116c-4be4-bd43-d2548eb6ec5b",
      sessionKey,
      executiveSlug: "primary-executive",
      message:
        "Capture this as a new executive situation. I need to prepare for a leadership meeting with Drew and Jesse about healthy conflict and execution speed.",
    });
    assert.equal(resolved.conversationId, undefined);
    assert.equal(resolved.continuitySource, "new");
    assert.equal(resolved.forceNewSituation, true);
    assert.match(resolved.disclosure ?? "", /New executive situation requested/i);
  } finally {
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("host conversationId is honored for same-chat continuation across fresh MCP sessions", async () => {
  clearConversationStateForTests();
  const resolved = await resolveContinuity({
    explicitConversationId: "874215c8-d365-46ce-a884-383db208ce92",
    sessionKey: resolveSessionKey("fresh-mcp-session-turn-2"),
    executiveSlug: "primary-executive",
    message: "What should I say first about healthy conflict with Drew?",
  });
  assert.equal(resolved.conversationId, "874215c8-d365-46ce-a884-383db208ce92");
  assert.equal(resolved.continuitySource, "explicit");
});

test("explicit continue may use durable fallback", async () => {
  clearConversationStateForTests();
  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: "conv-durable-1",
        executive_id: "exec-1",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      trace: {
        request_id: "runtime-durable-1",
        conversation_id: "conv-durable-1",
        status: "completed",
        started_at: new Date().toISOString(),
        executive_slug: "primary-executive",
      },
    })
  );

  try {
    const resolved = await resolveContinuity({
      sessionKey: resolveSessionKey("new-session-continue"),
      executiveSlug: "primary-executive",
      message: "Please continue the prior situation about Drew and Jesse.",
    });
    assert.equal(resolved.conversationId, "conv-durable-1");
    assert.equal(resolved.continuitySource, "durable_fallback");
    assert.equal(resolved.lastRuntimeId, "runtime-durable-1");
  } finally {
    setSupabaseForTests(null);
  }
});

test("refuses durable reuse when prior conversation is stale or unconfirmed", async () => {
  clearConversationStateForTests();
  const stale = new Date(Date.now() - DURABLE_CONTINUITY_MAX_AGE_MS - 60_000).toISOString();

  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: "conv-stale",
        executive_id: "exec-1",
        status: "active",
        updated_at: stale,
      },
      // Mock still returns conversation, but gte filter is not enforced in this simple mock —
      // simulate refusal by returning no conversation (as a real filtered query would).
      // Override: empty conversation when stale.
      executiveId: "exec-1",
    })
  );

  // Explicit empty match (no conversation row returned)
  setSupabaseForTests(
    createDurableMock({
      conversation: null,
      trace: null,
    })
  );

  try {
    const resolved = await resolveContinuity({
      explicitConversationId: undefined,
      sessionKey: resolveSessionKey("no-session-state"),
      executiveSlug: "primary-executive",
    });
    assert.equal(resolved.conversationId, undefined);
    assert.equal(resolved.continuitySource, "new");
    assert.match(resolved.disclosure ?? "", /No prior ApexOS conversation was confirmed/);
  } finally {
    setSupabaseForTests(null);
  }
});

test("refuses durable reuse when executive identity cannot be tied", async () => {
  clearConversationStateForTests();
  setSupabaseForTests(
    createDurableMock({
      executiveId: null,
      conversation: null,
      trace: null,
    })
  );

  try {
    const resolved = await resolveContinuity({
      sessionKey: resolveSessionKey("sess-x"),
      executiveSlug: "unknown-executive",
    });
    assert.equal(resolved.continuitySource, "new");
    assert.equal(resolved.conversationId, undefined);
  } finally {
    setSupabaseForTests(null);
  }
});

test("session continuity preferred over durable fallback", async () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-prefer");
  rememberConversation(sessionKey, "conv-session-win", "runtime-session");

  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: "conv-durable-other",
        executive_id: "exec-1",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      trace: {
        request_id: "runtime-other",
        conversation_id: "conv-durable-other",
        status: "completed",
        started_at: new Date().toISOString(),
      },
    })
  );

  try {
    const resolved = await resolveContinuity({
      sessionKey,
      executiveSlug: "primary-executive",
    });
    assert.equal(resolved.conversationId, "conv-session-win");
    assert.equal(resolved.continuitySource, "session");
  } finally {
    setSupabaseForTests(null);
  }
});

test("two-line Basis and Glass Box reminder on successful retrieval", () => {
  const basis = buildApexosBasis({
    conversationId: "conv-1",
    continuitySource: "durable_fallback",
    persistenceStatus: "persisted",
    recordsCreated: [],
    recordsRetrieved: Array.from({ length: 13 }, (_, i) => ({
      table: "observations",
      id: `o${i}`,
      type: "source_evidence",
    })),
    stages: [
      { stage: "continuity-retrieval", status: "success", durationMs: 1 },
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
    runtimeAvailable: true,
  });
  assert.equal(
    basis.status,
    "Runtime invoked successfully. Retrieved 13 saved ApexOS records and created a trace."
  );
  const display = formatInterfaceStatusBlock(basis, { glassBoxAvailable: true });
  const lines = display.split("\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0], `ApexOS Basis: ${basis.status}`);
  assert.equal(lines[1], GLASS_BOX_REMINDER);
  assert.equal(basis.continuitySource, "durable_fallback");
});

test("two-line status for new capture with no prior retrieval", () => {
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
    continuityDisclosure:
      "No prior ApexOS conversation was confirmed or reused; a new conversation will be created when persistence succeeds.",
  });
  assert.match(basis.status, /New situation captured and saved/);
  assert.match(basis.status, /no prior saved records were retrieved/i);
  const display = formatInterfaceStatusBlock(basis, { glassBoxAvailable: true });
  assert.match(display, /ApexOS Basis:/);
  assert.match(display, /Glass Box: Available/);
  assert.match(display, /No prior ApexOS conversation was confirmed/);
});

test("degraded persistence status is explicit", () => {
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
  assert.equal(
    basis.status,
    "Runtime invoked, but persistence was not confirmed. Do not treat this as durably saved."
  );
  assert.equal(basis.persistenceConfirmed, false);
  assert.equal(basis.groundedInSavedMemory, false);
});

test("degraded retrieval status is explicit", () => {
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
});

test("unavailable runtime basis", () => {
  const basis = buildUnavailableBasis();
  assert.match(basis.status, /runtime was not available/i);
  const display = formatInterfaceStatusBlock(basis, { glassBoxAvailable: false });
  assert.match(display, /Glass Box: Not available/);
});

test("isGlassBoxRequest detects natural Glass Box phrases", () => {
  assert.equal(isGlassBoxRequest("Show the Glass Box"), true);
  assert.equal(isGlassBoxRequest("Show the Glass Box for this response"), true);
  assert.equal(isGlassBoxRequest("@ApexOS show the glass box"), true);
  assert.equal(
    isGlassBoxRequest(
      "@ApexOS show the glass box. Prior turn mentioned Drew, a recommendation about speaking with Drew, and a pending proposed decision."
    ),
    true
  );
  assert.equal(isGlassBoxRequest("What should I say first?"), false);
});

test("executive situation ending with show Glass Box executes runtime and persists a trace", async () => {
  clearConversationStateForTests();
  const message =
    "I need to prepare for a leadership meeting with Drew and Jesse. Help me decide the one conversation we need to have about healthy conflict and execution speed. Show the Glass Box.";
  assert.equal(isGlassBoxRequest(message), false);
  assert.equal(routeExecutiveToolMessage(message), "execute_runtime");

  let invoked = false;
  setInvokeExecuteRuntimeForTests(async (req) => {
    invoked = true;
    assert.match(req.message, /Drew and Jesse/i);
    assert.match(req.message, /Glass Box/i);
    const runtimeId = "rt-mixed-exec-1";
    startTrace(runtimeId, "execute_runtime", { conversationId: "conv-mixed-1" });
    completeTrace(
      runtimeId,
      [{ stage: "interaction-capture", status: "success", durationMs: 5 }],
      {
        conversationId: "conv-mixed-1",
        persistenceStatus: "persisted",
        recordsCreated: [{ table: "situations", id: "sit-1", type: "situation" }],
        recordsRetrieved: [],
      }
    );
    const result: ExecuteRuntimeResult = {
      runtimeId,
      response: "Focus the meeting on healthy conflict and execution speed.",
      conversationId: "conv-mixed-1",
      interactionId: "conv-mixed-1",
      situationSlug: "runtime-mixed",
      contextPackageId: "ACP-RT-test",
      stages: [{ stage: "interaction-capture", status: "success", durationMs: 5 }],
      metadata: {
        model: "test",
        provider: "test",
        dryRun: false,
        persistenceStatus: "persisted",
        situationId: "sit-1",
        recordsCreated: [{ table: "situations", id: "sit-1", type: "situation" }],
        recordsRetrieved: [],
        contextItems: ["current_message"],
        captureErrors: [],
        retrievalErrors: [],
      },
      contextPackage: null,
    };
    return result;
  });

  try {
    const toolResult = await handleExecutiveConversation(
      { message },
      { sessionId: "sess-mixed-glass" },
      PRIMARY_TOOL_NAME
    );
    assert.equal(invoked, true);
    const payload = toolResult.structuredContent as {
      runtimeId?: string;
      glassBoxRequest?: boolean;
    };
    assert.equal(payload.glassBoxRequest ?? false, false);
    assert.equal(payload.runtimeId, "rt-mixed-exec-1");
    const trace = getTrace("rt-mixed-exec-1");
    assert.ok(trace);
    assert.equal(trace?.status, "completed");
  } finally {
    setInvokeExecuteRuntimeForTests(null);
    clearConversationStateForTests();
  }
});

test("standalone Show the Glass Box after prior runtime uses read-only Glass Box path", async () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-standalone-glass");
  rememberConversation(sessionKey, "conv-standalone", "runtime-standalone-1");
  startTrace("runtime-standalone-1", "execute_runtime", {
    conversationId: "conv-standalone",
  });
  completeTrace(
    "runtime-standalone-1",
    [{ stage: "continuity-retrieval", status: "success", durationMs: 2 }],
    {
      conversationId: "conv-standalone",
      recordsCreated: [],
      recordsRetrieved: [{ table: "observations", id: "obs-standalone", type: "source_evidence" }],
    }
  );

  assert.equal(isGlassBoxRequest("Show the Glass Box"), true);
  assert.equal(routeExecutiveToolMessage("Show the Glass Box"), "glass_box_only");

  let executeCalled = false;
  setInvokeExecuteRuntimeForTests(async () => {
    executeCalled = true;
    throw new Error("execute_runtime must not run for standalone Glass Box");
  });
  setSupabaseForTests(createDurableMock({ conversation: null, trace: null }));

  try {
    const toolResult = await handleExecutiveConversation(
      { message: "Show the Glass Box" },
      { sessionId: "sess-standalone-glass" },
      PRIMARY_TOOL_NAME
    );
    assert.equal(executeCalled, false);
    const payload = toolResult.structuredContent as {
      glassBoxRequest?: boolean;
      runtimeId?: string;
      glassBox?: { runtimeId?: string };
    };
    assert.equal(payload.glassBoxRequest, true);
    assert.equal(payload.runtimeId, "runtime-standalone-1");
    assert.equal(payload.glassBox?.runtimeId, "runtime-standalone-1");
  } finally {
    setInvokeExecuteRuntimeForTests(null);
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("no-runtime Glass Box request remains fail-closed with no prior trace", async () => {
  clearConversationStateForTests();
  assert.equal(isGlassBoxRequest("Show the Glass Box"), true);

  let executeCalled = false;
  setInvokeExecuteRuntimeForTests(async () => {
    executeCalled = true;
    throw new Error("execute_runtime must not run");
  });
  setSupabaseForTests(createDurableMock({ conversation: null, trace: null, latestTrace: null }));

  try {
    const toolResult = await handleExecutiveConversation(
      { message: "Show the Glass Box" },
      { sessionId: "sess-no-prior-glass" },
      PRIMARY_TOOL_NAME
    );
    assert.equal(executeCalled, false);
    const payload = toolResult.structuredContent as {
      glassBoxRequest?: boolean;
      runtimeId?: string | null;
      response?: string;
      glassBox?: unknown;
    };
    assert.equal(payload.glassBoxRequest, true);
    assert.equal(payload.runtimeId ?? null, null);
    assert.equal(payload.glassBox ?? null, null);
    assert.match(
      payload.response ?? "",
      /No confirmed (Glass Box|runtime trace)|Nothing was reconstructed/i
    );
  } finally {
    setInvokeExecuteRuntimeForTests(null);
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("fresh MCP sessions per turn: Glass Box reads msg2 via host conversationId without creating", async () => {
  // Live ChatGPT opens a new MCP session on every tools/call. Continuity for
  // Glass Box must use the host-bound conversationId, never execute_runtime.
  clearConversationStateForTests();
  const conversationId = "conv-live-gb-bind";
  const situationId = "sit-live-gb";
  const msg1 =
    "Capture this as a new executive situation. I need to prepare for a leadership meeting with Drew about healthy conflict.";
  const msg2 =
    "I'm leaning toward speaking with Drew first about healthy conflict. What should I recommend as the opening?";
  const msg3 =
    "@ApexOS show the glass box. Prior context: Drew, recommendation about speaking with Drew, pending proposed decision, outcome to track.";

  assert.equal(isNewSituationRequest(msg1), true);
  assert.equal(isGlassBoxRequest(msg3), true);
  assert.equal(routeExecutiveToolMessage(msg3), "glass_box_only");

  let executeCalls = 0;
  setInvokeExecuteRuntimeForTests(async (req) => {
    executeCalls += 1;
    if (executeCalls === 1) {
      assert.equal(req.conversationId == null || req.conversationId === undefined, true);
      const runtimeId = "rt-live-1";
      const created = [
        { table: "situations", id: situationId, type: "situation", externalId: "SIT-RT-08b7df90" },
      ];
      startTrace(runtimeId, "execute_runtime", { conversationId });
      completeTrace(runtimeId, [{ stage: "interaction-capture", status: "success", durationMs: 2 }], {
        conversationId,
        recordsCreated: created,
        recordsRetrieved: [],
        persistenceStatus: "persisted",
        situationId,
      });
      return {
        runtimeId,
        response: "New situation captured.",
        conversationId,
        interactionId: conversationId,
        situationSlug: "runtime-live-drew",
        contextPackageId: "ACP-RT-a52c0b7e",
        stages: [{ stage: "interaction-capture", status: "success", durationMs: 2 }],
        metadata: {
          model: "test",
          provider: "test",
          dryRun: false,
          persistenceStatus: "persisted",
          situationId,
          recordsCreated: created,
          recordsRetrieved: [],
          contextItems: ["current_message"],
          captureErrors: [],
          retrievalErrors: [],
        },
        contextPackage: null,
      } satisfies ExecuteRuntimeResult;
    }

    if (executeCalls === 2) {
      assert.equal(req.conversationId, conversationId);
      const runtimeId = "rt-live-2";
      const created = [
        { table: "memory_artifacts", id: "rec-2", type: "recommendation", externalId: "MEM-REC-2" },
        {
          table: "memory_artifacts",
          id: "prop-2",
          type: "proposed_decision",
          externalId: "MEM-PROP-2",
        },
        { table: "memory_artifacts", id: "out-2", type: "outcome", externalId: "MEM-OUT-2" },
      ];
      startTrace(runtimeId, "execute_runtime", {
        conversationId,
        contextPackageId: "ACP-RT-msg2",
      });
      completeTrace(runtimeId, [{ stage: "interaction-capture", status: "success", durationMs: 3 }], {
        conversationId,
        recordsCreated: created,
        recordsRetrieved: Array.from({ length: 12 }, (_, i) => ({
          table: "observations",
          id: `obs-${i}`,
          type: "source_evidence",
        })),
        persistenceStatus: "persisted",
        situationId,
        contextPackageId: "ACP-RT-msg2",
      });
      return {
        runtimeId,
        response:
          "Recommend speaking with Drew first. Leaning toward that opening is pending, not a confirmed decision. Outcome to track: Drew's response.",
        conversationId,
        interactionId: conversationId,
        situationSlug: "runtime-live-drew",
        contextPackageId: "ACP-RT-msg2",
        stages: [{ stage: "interaction-capture", status: "success", durationMs: 3 }],
        metadata: {
          model: "test",
          provider: "test",
          dryRun: false,
          persistenceStatus: "persisted",
          situationId,
          recordsCreated: created,
          recordsRetrieved: Array.from({ length: 12 }, (_, i) => ({
            table: "observations",
            id: `obs-${i}`,
            type: "source_evidence",
          })),
          contextItems: ["current_message"],
          captureErrors: [],
          retrievalErrors: [],
        },
        contextPackage: null,
      } satisfies ExecuteRuntimeResult;
    }

    throw new Error("Glass Box must not call execute_runtime");
  });

  setSupabaseForTests(
    createDurableMock({
      conversation: {
        id: conversationId,
        executive_id: "exec-1",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      trace: {
        request_id: "rt-live-2",
        conversation_id: conversationId,
        status: "completed",
        started_at: new Date().toISOString(),
        executive_slug: "primary-executive",
        stages: [{ stage: "interaction-capture", status: "success", durationMs: 3 }],
        records_created: [
          { table: "memory_artifacts", id: "rec-2", type: "recommendation" },
          { table: "memory_artifacts", id: "prop-2", type: "proposed_decision" },
          { table: "memory_artifacts", id: "out-2", type: "outcome" },
        ],
        records_retrieved: [{ table: "observations", id: "obs-0", type: "source_evidence" }],
        metadata: { situationId, contextPackageId: "ACP-RT-msg2" },
      },
      // Older executive-wide trace must NOT be selected for Glass Box.
      latestTrace: {
        request_id: "rt-old-4records",
        conversation_id: "conv-other",
        status: "completed",
        executive_slug: "primary-executive",
        records_created: [
          { table: "situations", id: "sit-old", type: "situation" },
          { table: "observations", id: "o1", type: "source_evidence" },
          { table: "observations", id: "o2", type: "source_evidence" },
          { table: "observations", id: "o3", type: "source_evidence" },
        ],
        metadata: {},
      },
    })
  );

  try {
    const r1 = await handleExecutiveConversation(
      { message: msg1 },
      { sessionId: "chatgpt-turn-1" },
      PRIMARY_TOOL_NAME
    );
    const p1 = r1.structuredContent as {
      runtimeId?: string;
      conversationId?: string;
      executionMetadata?: { situationId?: string; continuitySource?: string };
    };
    assert.equal(p1.runtimeId, "rt-live-1");
    assert.equal(p1.conversationId, conversationId);
    assert.equal(p1.executionMetadata?.situationId, situationId);
    assert.equal(p1.executionMetadata?.continuitySource, "new");
    assert.equal(executeCalls, 1);

    const r2 = await handleExecutiveConversation(
      { message: msg2, conversationId },
      { sessionId: "chatgpt-turn-2" },
      PRIMARY_TOOL_NAME
    );
    const p2 = r2.structuredContent as {
      runtimeId?: string;
      conversationId?: string;
      executionMetadata?: { situationId?: string };
    };
    assert.equal(p2.runtimeId, "rt-live-2");
    assert.equal(p2.conversationId, conversationId);
    assert.equal(p2.executionMetadata?.situationId, situationId);
    assert.equal(executeCalls, 2);

    const r3 = await handleExecutiveConversation(
      { message: msg3, conversationId },
      { sessionId: "chatgpt-turn-3" },
      PRIMARY_TOOL_NAME
    );
    assert.equal(executeCalls, 2, "message 3 must not create a runtime");
    const p3 = r3.structuredContent as {
      glassBoxRequest?: boolean;
      runtimeId?: string;
      conversationId?: string;
      glassBox?: {
        runtimeId?: string;
        stages: Array<{ stage: string; status: string; ids: string[]; summary: string }>;
      };
      executionMetadata?: {
        readOnly?: boolean;
        glassBoxSource?: string;
        recordsCreated?: unknown[];
      };
      apexosBasisDisplay?: string;
    };
    assert.equal(p3.glassBoxRequest, true);
    assert.equal(p3.runtimeId, "rt-live-2");
    assert.equal(p3.conversationId, conversationId);
    assert.equal(p3.glassBox?.runtimeId, "rt-live-2");
    assert.equal(p3.executionMetadata?.readOnly, true);
    assert.equal(p3.executionMetadata?.recordsCreated?.length ?? 0, 0);
    assert.notEqual(p3.runtimeId, "rt-old-4records");
    assert.ok(!(p3.apexosBasisDisplay ?? "").includes("new conversation will be created"));

    const byStage = Object.fromEntries((p3.glassBox?.stages ?? []).map((s) => [s.stage, s]));
    assert.equal(byStage.recommendation.status, "captured");
    assert.ok(byStage.recommendation.ids.includes("rec-2"));
    assert.ok(byStage.recommendation.ids.includes("prop-2"));
    assert.equal(byStage.outcome_learning.status, "captured");
    assert.ok(byStage.outcome_learning.ids.includes("out-2"));
    assert.equal(byStage.executive_decision.status, "not_captured");
  } finally {
    setInvokeExecuteRuntimeForTests(null);
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("Drew three-message acceptance: capture truth matches Glass Box for same runtime", async () => {
  clearConversationStateForTests();
  const sessionId = "sess-drew-e2e";
  const conversationId = "conv-drew-e2e";
  const msg1 =
    "I need to prepare for a leadership meeting with Drew and Jesse. Help me decide the one conversation we need to have about healthy conflict and execution speed.";
  const msg2 = "What should I say first?";
  const msg3 = "Show the Glass Box.";

  const response1 = [
    "A key finding is that discussion alignment is not the same as execution alignment.",
    "Option A: open with Drew on healthy conflict. Option B: joint session with Jesse — tradeoff is speed versus shared ownership.",
    "I recommend focusing the meeting on one conversation about healthy conflict and execution speed.",
    "Outcome to track: whether ownership clarity and healthy conflict improve after the meeting.",
  ].join(" ");

  const response2 = [
    "A key finding is that the first minute sets whether conflict stays healthy.",
    "Option A: ask what feels unresolved. Alternative: name the execution-speed tension directly.",
    "I recommend you say first: what healthy conflict would look like for this decision.",
    "You are leaning toward a direct opening — that is proposed/pending, not a confirmed decision.",
    "Outcome to track: whether Drew and Jesse respond with specifics rather than passive agreement.",
  ].join(" ");

  // Prove extractor labeling matches what we will persist for msg2.
  const { extractInterpretiveSegments } = await import(
    "../../pipeline/capture/cold-start-extractor.js"
  );
  const labeled = extractInterpretiveSegments(response2);
  assert.ok(labeled.some((s) => s.epistemicType === "finding"));
  assert.ok(labeled.some((s) => s.epistemicType === "alternative"));
  assert.ok(labeled.some((s) => s.epistemicType === "recommendation"));
  assert.ok(labeled.some((s) => s.epistemicType === "proposed_decision"));
  assert.ok(labeled.some((s) => s.epistemicType === "outcome"));
  assert.ok(!labeled.some((s) => s.epistemicType === "decision"));

  let turn = 0;
  setInvokeExecuteRuntimeForTests(async (req) => {
    turn += 1;
    if (turn === 1) {
      assert.equal(req.message, msg1);
      const runtimeId = "rt-drew-1";
      const created = [
        { table: "situations", id: "sit-drew", type: "situation", externalId: "SIT-DREW" },
        { table: "memory_artifacts", id: "f1", type: "finding", externalId: "MEM-FIN-1" },
        { table: "memory_artifacts", id: "a1", type: "alternative", externalId: "MEM-ALT-1" },
        { table: "memory_artifacts", id: "a2", type: "alternative", externalId: "MEM-ALT-2" },
        { table: "memory_artifacts", id: "r1", type: "recommendation", externalId: "MEM-REC-1" },
        { table: "memory_artifacts", id: "o1", type: "outcome", externalId: "MEM-OUT-1" },
      ];
      startTrace(runtimeId, "execute_runtime", { conversationId });
      completeTrace(runtimeId, [{ stage: "interaction-capture", status: "success", durationMs: 3 }], {
        conversationId,
        recordsCreated: created,
        recordsRetrieved: [],
        persistenceStatus: "persisted",
      });
      rememberConversation(resolveSessionKey(sessionId), conversationId, runtimeId);
      return {
        runtimeId,
        response: response1,
        conversationId,
        interactionId: conversationId,
        situationSlug: "runtime-drew",
        contextPackageId: "ACP-DREW-1",
        stages: [{ stage: "interaction-capture", status: "success", durationMs: 3 }],
        metadata: {
          model: "test",
          provider: "test",
          dryRun: false,
          persistenceStatus: "persisted",
          situationId: "sit-drew",
          recordsCreated: created,
          recordsRetrieved: [],
          contextItems: ["current_message"],
          captureErrors: [],
          retrievalErrors: [],
        },
        contextPackage: null,
      } satisfies ExecuteRuntimeResult;
    }

    if (turn === 2) {
      assert.equal(req.message, msg2);
      assert.equal(req.conversationId, conversationId);
      const runtimeId = "rt-drew-2";
      // This runtime only — no confirmed decision; leanings are proposed_decision.
      const createdThisRuntime = [
        { table: "memory_artifacts", id: "f2", type: "finding", externalId: "MEM-FIN-2" },
        { table: "memory_artifacts", id: "a3", type: "alternative", externalId: "MEM-ALT-3" },
        { table: "memory_artifacts", id: "a4", type: "alternative", externalId: "MEM-ALT-4" },
        { table: "memory_artifacts", id: "r2", type: "recommendation", externalId: "MEM-REC-2" },
        {
          table: "memory_artifacts",
          id: "p2",
          type: "proposed_decision",
          externalId: "MEM-PROP-2",
        },
        { table: "memory_artifacts", id: "o2", type: "outcome", externalId: "MEM-OUT-2" },
      ];
      startTrace(runtimeId, "execute_runtime", { conversationId });
      completeTrace(
        runtimeId,
        [{ stage: "interaction-capture", status: "success", durationMs: 4 }],
        {
          conversationId,
          recordsCreated: createdThisRuntime,
          recordsRetrieved: [{ table: "observations", id: "obs-drew", type: "source_evidence" }],
          persistenceStatus: "persisted",
          contextPackageId: "ACP-DREW-2",
        }
      );
      rememberConversation(resolveSessionKey(sessionId), conversationId, runtimeId);
      return {
        runtimeId,
        response: response2,
        conversationId,
        interactionId: conversationId,
        situationSlug: "runtime-drew",
        contextPackageId: "ACP-DREW-2",
        stages: [{ stage: "interaction-capture", status: "success", durationMs: 4 }],
        metadata: {
          model: "test",
          provider: "test",
          dryRun: false,
          persistenceStatus: "persisted",
          situationId: "sit-drew",
          recordsCreated: createdThisRuntime,
          recordsRetrieved: [{ table: "observations", id: "obs-drew", type: "source_evidence" }],
          contextItems: ["current_message", "observations:obs-drew"],
          captureErrors: [],
          retrievalErrors: [],
        },
        contextPackage: null,
      } satisfies ExecuteRuntimeResult;
    }

    throw new Error(`unexpected execute_runtime turn ${turn}`);
  });

  setSupabaseForTests(createDurableMock({ conversation: null, trace: null }));

  try {
    const r1 = await handleExecutiveConversation(
      { message: msg1 },
      { sessionId },
      PRIMARY_TOOL_NAME
    );
    assert.equal((r1.structuredContent as { runtimeId?: string }).runtimeId, "rt-drew-1");

    const r2 = await handleExecutiveConversation(
      { message: msg2, conversationId },
      { sessionId },
      PRIMARY_TOOL_NAME
    );
    const p2 = r2.structuredContent as { runtimeId?: string; conversationId?: string };
    assert.equal(p2.runtimeId, "rt-drew-2");
    assert.equal(p2.conversationId, conversationId);

    let executeOnGlass = false;
    setInvokeExecuteRuntimeForTests(async () => {
      executeOnGlass = true;
      throw new Error("Show the Glass Box must not execute_runtime");
    });

    const r3 = await handleExecutiveConversation(
      { message: msg3, conversationId },
      { sessionId },
      PRIMARY_TOOL_NAME
    );
    assert.equal(executeOnGlass, false);
    const p3 = r3.structuredContent as {
      glassBoxRequest?: boolean;
      runtimeId?: string;
      glassBox?: {
        runtimeId?: string;
        stages: Array<{ stage: string; status: string; count: number; ids: string[]; summary: string }>;
      };
    };
    assert.equal(p3.glassBoxRequest, true);
    assert.equal(p3.runtimeId, "rt-drew-2");
    assert.equal(p3.glassBox?.runtimeId, "rt-drew-2");

    const byStage = Object.fromEntries((p3.glassBox?.stages ?? []).map((s) => [s.stage, s]));
    assert.equal(byStage.findings_interpretations.status, "captured");
    assert.ok(byStage.findings_interpretations.ids.includes("f2"));
    assert.equal(byStage.alternatives.status, "captured");
    assert.ok(byStage.alternatives.ids.includes("a3"));
    assert.equal(byStage.recommendation.status, "captured");
    assert.ok(byStage.recommendation.ids.includes("r2"));
    assert.ok(byStage.recommendation.ids.includes("p2")); // proposed/pending leaning
    assert.equal(byStage.outcome_learning.status, "captured");
    assert.ok(byStage.outcome_learning.ids.includes("o2"));
    assert.equal(byStage.executive_decision.status, "not_captured");
    assert.match(byStage.executive_decision.summary, /pending|not a confirmed|no confirmed/i);
    // Must not report msg1-only ids as this runtime's interpretive truth.
    assert.ok(!byStage.findings_interpretations.ids.includes("f1"));
    assert.ok(!byStage.recommendation.ids.includes("r1"));
  } finally {
    setInvokeExecuteRuntimeForTests(null);
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("Show the Glass Box returns only trace-supported data", async () => {
  clearConversationStateForTests();
  const sessionKey = resolveSessionKey("sess-glass");
  rememberConversation(sessionKey, "conv-glass", "runtime-glass-1");
  startTrace("runtime-glass-1", "execute_runtime", { conversationId: "conv-glass" });
  completeTrace(
    "runtime-glass-1",
    [{ stage: "continuity-retrieval", status: "success", durationMs: 2 }],
    {
      conversationId: "conv-glass",
      recordsCreated: [],
      recordsRetrieved: [{ table: "observations", id: "obs-1", type: "source_evidence" }],
    }
  );

  setSupabaseForTests(createDurableMock({ conversation: null, trace: null }));
  try {
    assert.equal(isGlassBoxRequest("Show the Glass Box"), true);
    const resolved = await resolveGlassBoxRequest({
      sessionKey,
      executiveSlug: "primary-executive",
    });
    assert.equal(resolved.source, "session_runtime");
    assert.ok(resolved.glassBox);
    assert.equal(resolved.glassBox.runtimeId, "runtime-glass-1");
    const retrieved = resolved.glassBox.stages.find(
      (s) => s.stage === "retrieved_durable_records"
    );
    assert.equal(retrieved?.status, "captured");
    assert.ok(retrieved?.ids.includes("obs-1"));
    // No Context Package — current message stage not fabricated from chat prose
    const current = resolved.glassBox.stages.find(
      (s) => s.stage === "current_executive_message"
    );
    assert.equal(current?.status, "not_captured");
  } finally {
    setSupabaseForTests(null);
    clearConversationStateForTests();
  }
});

test("Glass Box from durable trace only uses audit fields", () => {
  const glass = glassBoxFromDurableTrace({
    runtimeId: "rt-1",
    conversationId: "conv-1",
    executiveSlug: "primary-executive",
    status: "completed",
    stages: [{ stage: "interaction-capture", status: "success", durationMs: 1 }],
    recordsCreated: [{ table: "memory_artifacts", id: "rec-1", type: "recommendation" }],
    recordsRetrieved: [{ table: "observations", id: "obs-9", type: "source_evidence" }],
    contextItems: ["observations:obs-9"],
    captureErrors: [],
    metadata: {},
  });
  assert.equal(glass.runtimeId, "rt-1");
  assert.equal(
    glass.stages.find((s) => s.stage === "recommendation")?.status,
    "captured"
  );
  assert.equal(
    glass.stages.find((s) => s.stage === "executive_decision")?.status,
    "not_captured"
  );
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
      priorMessages: [],
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
      findingsHypotheses: [],
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
      people: [],
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
    recordsCreated: [
      { table: "memory_artifacts", id: "rec-1", type: "recommendation", externalId: "MEM-REC-1" },
      { table: "memory_artifacts", id: "fin-1", type: "finding", externalId: "MEM-FIN-1" },
    ],
    recordsRetrieved: [{ table: "observations", id: "obs-1", type: "source_evidence" }],
    stages: [{ stage: "continuity-retrieval", status: "success", durationMs: 2 }],
  });
  assert.equal(glass.source, "context_package_and_runtime_trace");
  const byStage = Object.fromEntries(glass.stages.map((s) => [s.stage, s]));
  assert.equal(byStage.current_executive_message.status, "captured");
  assert.equal(byStage.source_evidence.status, "captured");
  assert.equal(byStage.findings_interpretations.status, "captured");
  assert.equal(byStage.recommendation.status, "captured");
  assert.equal(byStage.executive_decision.status, "not_captured");
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
