import assert from "node:assert/strict";
import test from "node:test";
import type { PipelineContext } from "../../types/pipeline.js";
import { interactionCaptureStage } from "./interaction-capture.js";
import { setSupabaseForTests } from "../../shared/supabase.js";

type Row = Record<string, unknown>;

function createMemorySupabase() {
  const db: Record<string, Row[]> = {
    executive_conversations: [],
    conversation_messages: [],
    situations: [],
    persons: [],
    relationships: [],
    relationship_participants: [],
    observations: [],
    memory_artifacts: [],
    runtime_interaction_traces: [],
  };

  function from(table: string) {
    const state: {
      filters: Array<(row: Row) => boolean>;
      payload: Row | Row[] | null;
      op: "select" | "insert" | "update" | "upsert";
      single: boolean;
      limitN?: number;
    } = {
      filters: [],
      payload: null,
      op: "select",
      single: false,
    };

    const api: Record<string, unknown> = {
      insert(payload: Row | Row[]) {
        state.op = "insert";
        state.payload = payload;
        return api;
      },
      update(payload: Row) {
        state.op = "update";
        state.payload = payload;
        return api;
      },
      upsert(payload: Row | Row[]) {
        state.op = "upsert";
        state.payload = payload;
        return api;
      },
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        state.filters.push((row) => row[column] === value);
        return api;
      },
      maybeSingle: async () => {
        const rows = (db[table] ?? []).filter((row) => state.filters.every((f) => f(row)));
        return { data: rows[0] ?? null, error: null };
      },
      single: async () => {
        state.single = true;
        return finalize();
      },
      then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
        finalize().then(resolve, reject);
      },
    };

    async function finalize() {
      if (state.op === "insert") {
        const rows = Array.isArray(state.payload) ? state.payload : [state.payload!];
        const inserted = rows.map((row) => {
          const full = {
            id: row.id ?? cryptoRandom(),
            external_id: row.external_id ?? null,
            ...row,
          };
          db[table] = db[table] ?? [];
          db[table].push(full);
          return full;
        });
        if (table === "conversation_messages" && inserted.length) {
          // ok
        }
        return state.single || !Array.isArray(state.payload)
          ? { data: inserted[0], error: null }
          : { data: inserted, error: null };
      }
      if (state.op === "update") {
        const rows = (db[table] ?? []).filter((row) => state.filters.every((f) => f(row)));
        for (const row of rows) Object.assign(row, state.payload);
        return { data: rows[0] ?? null, error: null };
      }
      if (state.op === "upsert") {
        const rows = Array.isArray(state.payload) ? state.payload : [state.payload!];
        db[table] = db[table] ?? [];
        for (const row of rows) db[table].push({ id: cryptoRandom(), ...row });
        return { data: rows, error: null };
      }
      const rows = (db[table] ?? []).filter((row) => state.filters.every((f) => f(row)));
      return { data: state.single ? rows[0] ?? null : rows, error: null };
    }

    return api;
  }

  return {
    client: { from } as unknown as import("@supabase/supabase-js").SupabaseClient,
    db,
  };
}

function cryptoRandom(): string {
  return `id-${Math.random().toString(16).slice(2, 10)}`;
}

test("new message creates conversation and persists source + response", async () => {
  const { client, db } = createMemorySupabase();
  setSupabaseForTests(client);

  const ctx = {
    request: {
      requestId: "req-new",
      message:
        "I need help with my leadership team. Jesse and Drew discuss well but execution is not aligned. I want healthy conflict and rotating meeting ownership.",
      executiveSlug: "primary-executive",
      situationSlug: null,
      conversationId: null,
      previousResponseId: null,
      receivedAt: new Date().toISOString(),
      metadata: {},
    },
    executive: { id: "exec-1", slug: "primary-executive", displayName: "Andrew" },
    situation: null,
    memory: null,
    continuity: null,
    contextRelevance: null,
    evidence: null,
    governance: null,
    contextPackage: { contextItemsSupplied: ["current_message"] },
    llmResponse: {
      text: "A key finding is discussion versus execution. I recommend rotating ownership.",
      model: "stub",
      provider: "stub",
      responseId: "resp-1",
    },
    interactionId: null,
    captureAudit: null,
    retrievalAudit: { retrieved: [], contextItems: [], errors: [] },
    stages: [],
  } as unknown as PipelineContext;

  const result = await interactionCaptureStage(ctx);
  setSupabaseForTests(null);

  assert.ok(result.interactionId);
  assert.equal(result.request.conversationId, result.interactionId);
  assert.equal(db.executive_conversations.length, 1);
  assert.equal(db.conversation_messages.length, 2);
  assert.equal(db.conversation_messages[0].role, "executive");
  assert.equal(db.conversation_messages[1].role, "apexos");
  assert.ok(db.situations.length >= 1);
  assert.ok(db.observations.length >= 1);
  assert.ok(result.captureAudit?.created.some((r) => r.table === "situations"));
  assert.ok(result.captureAudit?.created.some((r) => r.type === "source_evidence"));
  const stage = result.stages.find((s) => s.stage === "interaction-capture");
  assert.equal(stage?.status, "success");
});

test("follow-up reuses conversation id and keeps capture audit fields", async () => {
  const { client, db } = createMemorySupabase();
  setSupabaseForTests(client);
  db.executive_conversations.push({
    id: "conv-existing",
    external_id: "CONV-RUNTIME-test",
    status: "active",
  });

  const ctx = {
    request: {
      requestId: "req-2",
      message: "Remind me what we said about healthy conflict.",
      executiveSlug: "primary-executive",
      situationSlug: null,
      conversationId: "conv-existing",
      previousResponseId: null,
      receivedAt: new Date().toISOString(),
      metadata: {},
    },
    executive: { id: "exec-1", slug: "primary-executive", displayName: "Andrew" },
    situation: {
      id: "sit-1",
      slug: "sit-1",
      title: "Leadership",
      summary: "team",
      situationType: "leadership-development",
    },
    memory: null,
    continuity: null,
    contextRelevance: null,
    evidence: null,
    governance: null,
    contextPackage: { contextItemsSupplied: ["current_message", "observations:x"] },
    llmResponse: {
      text: "You wanted healthy conflict rather than passive agreement.",
      model: "stub",
      provider: "stub",
      responseId: "resp-2",
    },
    interactionId: null,
    captureAudit: null,
    retrievalAudit: {
      retrieved: [{ table: "observations", id: "obs-1", type: "source_evidence" }],
      contextItems: [],
      errors: [],
    },
    stages: [],
  } as unknown as PipelineContext;

  const result = await interactionCaptureStage(ctx);
  setSupabaseForTests(null);

  assert.equal(result.interactionId, "conv-existing");
  assert.equal(db.executive_conversations.length, 1);
  assert.equal(db.conversation_messages.length, 2);
  const apexMeta = db.conversation_messages[1].metadata as Record<string, unknown>;
  assert.equal(apexMeta.conversationId, "conv-existing");
  assert.ok(Array.isArray(apexMeta.recordsRetrieved));
  assert.ok(Array.isArray(apexMeta.contextItems));
});
