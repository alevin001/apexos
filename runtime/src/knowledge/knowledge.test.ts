import assert from "node:assert/strict";
import test from "node:test";
import { setSupabaseForTests } from "../shared/supabase.js";
import { buildGlassBox } from "../mcp/adapters/glass-box.js";
import { chunkExtractedText } from "./chunk.js";
import { contentHash } from "./content-hash.js";
import { extractText } from "./extract.js";
import { ingestSource, previewExternalId } from "./ingest.js";
import { buildReceipt, formatReceiptPlainLanguage } from "./receipt.js";
import { CHATGPT_FILE_CAPABILITY, ingestChatGptAttachment } from "./chatgpt-attachment.js";
import {
  messageRequiresKnowledgeIngest,
  selectToolForExecutiveMessage,
  INGEST_TOOL_NAME,
  PRIMARY_TOOL_NAME,
} from "../mcp/connector-guidance.js";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function createKnowledgeMock(state: {
  sources: Row[];
  extractions: Row[];
  units: Row[];
  links: Row[];
  runs: Row[];
  runItems: Row[];
  registry: Row[];
  storageUploads: Array<{ path: string; bytes: number }>;
  failStorage?: boolean;
  failSourceInsert?: boolean;
}) {
  function from(table: string) {
    const filters: Record<string, unknown> = {};
    let rows: Row[] = [];
    let pendingInsert: Row | null = null;
    let pendingUpdate: Row | null = null;
    let upsertPayload: Row | Row[] | null = null;

    const api: Record<string, unknown> = {
      select() {
        return api;
      },
      insert(payload: Row | Row[]) {
        pendingInsert = Array.isArray(payload) ? payload[0] : payload;
        if (Array.isArray(payload)) {
          (api as { _many?: Row[] })._many = payload;
        }
        return api;
      },
      upsert(payload: Row | Row[]) {
        upsertPayload = payload;
        return api;
      },
      update(payload: Row) {
        pendingUpdate = payload;
        return api;
      },
      eq(column: string, value: unknown) {
        filters[column] = value;
        return api;
      },
      in(column: string, values: unknown[]) {
        filters[`in:${column}`] = values;
        return api;
      },
      order() {
        return api;
      },
      limit() {
        return api;
      },
      async maybeSingle() {
        if (table === "knowledge_sources") {
          const hash = filters.content_hash;
          if (hash) {
            const found = state.sources.find((s) => s.content_hash === hash) ?? null;
            return { data: found, error: null };
          }
          const externalId = filters.external_id;
          if (externalId) {
            return {
              data: state.sources.find((s) => s.external_id === externalId) ?? null,
              error: null,
            };
          }
        }
        if (table === "ingestion_runs") {
          const externalId = filters.external_id;
          return {
            data: state.runs.find((r) => r.external_id === externalId) ?? null,
            error: null,
          };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "knowledge_sources" && pendingInsert) {
          if (state.failSourceInsert) {
            return { data: null, error: { message: "insert failed" } };
          }
          const row: Row = {
            id: `src-${state.sources.length + 1}`,
            ...pendingInsert,
          };
          state.sources.push(row);
          return {
            data: { id: String(row.id), external_id: String(row.external_id) },
            error: null,
          };
        }
        if (table === "knowledge_source_extractions" && pendingInsert) {
          const row = {
            id: `ext-${state.extractions.length + 1}`,
            ...pendingInsert,
          };
          state.extractions.push(row);
          return { data: { id: row.id }, error: null };
        }
        if (table === "ingestion_runs" && pendingInsert) {
          const row = { id: `run-${state.runs.length + 1}`, ...pendingInsert };
          state.runs.push(row);
          return { data: { id: row.id }, error: null };
        }
        return { data: null, error: { message: `unexpected single on ${table}` } };
      },
      then(resolve: (value: unknown) => void) {
        // Awaitable query end for insert().select() chains and bare inserts
        if (table === "knowledge_retrieval_units" && (api as { _many?: Row[] })._many) {
          const many = (api as { _many: Row[] })._many;
          const inserted = many.map((u, i) => {
            const row = { id: `ru-${state.units.length + i + 1}`, ...u };
            state.units.push(row);
            return { id: row.id };
          });
          return resolve({ data: inserted, error: null });
        }
        if (table === "artifact_links" && (api as { _many?: Row[] })._many) {
          for (const row of (api as { _many: Row[] })._many) state.links.push(row);
          return resolve({ data: (api as { _many: Row[] })._many, error: null });
        }
        if (table === "artifact_links" && pendingInsert) {
          state.links.push(pendingInsert);
          return resolve({ data: pendingInsert, error: null });
        }
        if (table === "artifact_registry" && (upsertPayload || pendingInsert)) {
          const row = (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert;
          if (row) state.registry.push(row);
          return resolve({ data: row, error: null });
        }
        if (table === "ingestion_run_items" && (upsertPayload || pendingInsert)) {
          const row = (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert!;
          state.runItems.push(row as Row);
          return resolve({ data: row, error: null });
        }
        if (table === "ingestion_runs" && pendingUpdate) {
          const run = state.runs.find((r) => r.id === filters.id) ?? state.runs[0];
          if (run) Object.assign(run, pendingUpdate);
          return resolve({ data: run, error: null });
        }
        if (table === "knowledge_sources" && pendingUpdate) {
          const src = state.sources.find((s) => s.id === filters.id);
          if (src) Object.assign(src, pendingUpdate);
          return resolve({ data: src, error: null });
        }
        if (table === "knowledge_sources" && filters[`in:status`]) {
          rows = state.sources.filter((s) => s.retrieval_ready === true);
          return resolve({ data: rows, error: null });
        }
        if (table === "knowledge_retrieval_units") {
          const ids = filters[`in:knowledge_source_id`] as string[] | undefined;
          rows = state.units.filter((u) => !ids || ids.includes(u.knowledge_source_id as string));
          return resolve({ data: rows, error: null });
        }
        if (table === "ingestion_run_items" && filters.run_id) {
          rows = state.runItems.filter((i) => i.run_id === filters.run_id);
          return resolve({ data: rows, error: null });
        }
        return resolve({ data: [], error: null });
      },
    };
    return api;
  }

  const storage = {
    from() {
      return {
        async upload(path: string, bytes: Buffer) {
          if (state.failStorage) {
            return { data: null, error: { message: "storage unavailable" } };
          }
          state.storageUploads.push({ path, bytes: bytes.length });
          return { data: { path }, error: null };
        },
      };
    },
  };

  return { from, storage } as unknown as SupabaseClient;
}

test("extraction separates supported text from deferred and failed types", () => {
  const ok = extractText({
    filename: "note.md",
    bytes: Buffer.from("# Title\n\nBody"),
  });
  assert.equal(ok.status, "extracted");
  assert.ok(ok.text?.includes("Body"));

  const deferred = extractText({
    filename: "scan.pdf",
    bytes: Buffer.from("%PDF"),
  });
  assert.equal(deferred.status, "deferred");

  const failed = extractText({
    filename: "empty.txt",
    bytes: Buffer.from("   "),
  });
  assert.equal(failed.status, "failed");
});

test("chunking creates retrieval units that are derived, not original", () => {
  const units = chunkExtractedText("Para one.\n\nPara two.\n\nPara three.");
  assert.ok(units.length >= 1);
  assert.equal(units[0].unitIndex, 0);
  assert.ok(units[0].contentPreview.length <= 240);
});

test("source persistence + provenance links + retrieval units", async () => {
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    registry: [] as Row[],
    storageUploads: [] as Array<{ path: string; bytes: number }>,
  };
  setSupabaseForTests(createKnowledgeMock(state));

  const bytes = Buffer.from("Healthy conflict evidence for Build 18 retrieval.");
  const receipt = await ingestSource({
    filename: "healthy-conflict.md",
    bytes,
    ingestionMethod: "single_file",
    authorityClassification: "executive_material",
  });

  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.originalStored, true);
  assert.equal(receipt.textExtracted, true);
  assert.equal(receipt.retrievalReady, true);
  assert.equal(state.sources.length, 1);
  assert.equal(state.storageUploads.length, 1);
  assert.equal(state.extractions.length, 1);
  assert.ok(state.units.length >= 1);
  assert.ok(
    state.links.some(
      (l) =>
        l.link_type === "derived_from" &&
        l.target_table === "knowledge_sources"
    )
  );
  assert.notEqual(state.extractions[0].extracted_text, undefined);
  assert.notEqual(state.sources[0].body_md, state.extractions[0].extracted_text);

  setSupabaseForTests(null);
});

test("duplicate detection does not delete or overwrite originals", async () => {
  const bytes = Buffer.from("same-bytes");
  const hash = contentHash(bytes);
  const state = {
    sources: [
      {
        id: "src-existing",
        external_id: "SRC-existing",
        title: "Existing",
        content_hash: hash,
      },
    ] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    registry: [] as Row[],
    storageUploads: [] as Array<{ path: string; bytes: number }>,
  };
  setSupabaseForTests(createKnowledgeMock(state));

  const receipt = await ingestSource({
    filename: "copy.md",
    bytes,
    ingestionMethod: "single_file",
  });

  assert.equal(receipt.claim, "duplicate");
  assert.equal(receipt.durableKnowledgeConfirmed, false);
  assert.equal(state.sources.length, 1);
  assert.equal(state.storageUploads.length, 0);
  assert.match(formatReceiptPlainLanguage(receipt), /duplicate/i);

  setSupabaseForTests(null);
});

test("failed storage does not claim ingested", async () => {
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    registry: [] as Row[],
    storageUploads: [] as Array<{ path: string; bytes: number }>,
    failStorage: true,
  };
  setSupabaseForTests(createKnowledgeMock(state));

  const receipt = await ingestSource({
    filename: "contract.md",
    bytes: Buffer.from("contract text"),
    ingestionMethod: "single_file",
  });

  assert.equal(receipt.claim, "not_ingested");
  assert.equal(receipt.durableKnowledgeConfirmed, false);
  assert.equal(state.sources.length, 0);
  assert.match(formatReceiptPlainLanguage(receipt), /did not confirm durable ingestion/i);

  setSupabaseForTests(null);
});

test("receipt never claims ingested without durable confirmation", () => {
  const receipt = buildReceipt({
    ingested: false,
    claim: "not_ingested",
    title: "x",
    sourceType: "pdf",
    originalStored: false,
    originalAvailable: false,
    textExtracted: false,
    retrievalReady: false,
    authorityClassification: "unverified",
    extractionStatus: "failed",
    processingStatus: "failed",
    integrityStatus: "error",
    retrievalUnitCount: 0,
  });
  assert.equal(receipt.durableKnowledgeConfirmed, false);
});

test("Glass Box source stage shows authority and transformation notes for knowledge units", () => {
  const glass = buildGlassBox({
    runtimeId: "rt-1",
    conversationId: "c-1",
    contextPackageId: "cp-1",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-1",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "What does the healthy conflict note say?",
      continuity: {
        conversationId: "c-1",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt",
            title: "healthy-conflict-operating-note.md",
            summary:
              "Use healthy conflict… Authority: executive_material. Matched query terms against source “healthy-conflict-operating-note.md” (relevance score 0.80). Relevance is not authority. Excerpt is from extracted/chunked text derived from the original source — not the original file itself.",
            epistemicType: "source_evidence",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "What does the healthy conflict note say?",
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
        assumptions: [],
      },
      doctrine: [],
      contextItemsSupplied: [],
      llmInstructions: "",
    },
    recordsRetrieved: [
      {
        table: "knowledge_sources",
        id: "src-1",
        type: "knowledge_source",
        externalId: "SRC-healthy",
      },
    ],
  });

  const sourceStage = glass.stages.find((s) => s.stage === "source_evidence");
  assert.ok(sourceStage);
  assert.equal(sourceStage!.status, "captured");
  const record = sourceStage!.records.find((r) => r.table === "knowledge_retrieval_units");
  assert.ok(record);
  assert.equal(record!.authorityStatus, "executive_material");
  assert.match(record!.transformationNote ?? "", /derived from the original source/i);
  assert.ok(record!.epistemicType === "source_evidence");
});

test("ChatGPT attachment without file/text is not claimed ingested", async () => {
  const { receipt, display, platformNote } = await ingestChatGptAttachment({});
  assert.equal(receipt.durableKnowledgeConfirmed, false);
  assert.match(display, /did not confirm durable ingestion/i);
  assert.match(platformNote, /does not make a file durable/i);
  assert.equal(CHATGPT_FILE_CAPABILITY.automaticIngestionGuaranteed, false);
});

test("ChatGPT text-only fallback ingests as derived text, not original binary", async () => {
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    registry: [] as Row[],
    storageUploads: [] as Array<{ path: string; bytes: number }>,
  };
  setSupabaseForTests(createKnowledgeMock(state));

  const { receipt } = await ingestChatGptAttachment({
    fileName: "meeting-notes.txt",
    textContent: "Notes from the leadership meeting about healthy conflict.",
  });

  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.originalStored, false);
  assert.equal(receipt.textExtracted, true);
  assert.equal(state.sources[0].ingestion_method, "chatgpt_text");
  assert.match(receipt.limitation ?? "", /derived content|original binary/i);

  setSupabaseForTests(null);
});

test("connector routes add-this-to-ApexOS to ingest tool", () => {
  assert.equal(messageRequiresKnowledgeIngest("Add this uploaded file to ApexOS."), true);
  assert.equal(messageRequiresKnowledgeIngest("Add this file to ApexOS."), true);
  assert.equal(selectToolForExecutiveMessage("Add this file to ApexOS."), INGEST_TOOL_NAME);
  assert.equal(selectToolForExecutiveMessage("Add this to ApexOS"), INGEST_TOOL_NAME);
  assert.equal(
    selectToolForExecutiveMessage(
      "I need to prepare for a leadership meeting with Drew and Jesse."
    ),
    PRIMARY_TOOL_NAME
  );
});

test("preview external id is stable for the same bytes", () => {
  const bytes = Buffer.from("stable");
  assert.equal(previewExternalId("a.md", bytes), previewExternalId("a.md", bytes));
  assert.notEqual(previewExternalId("a.md", bytes), previewExternalId("b.md", bytes));
});
