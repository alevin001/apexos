import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../shared/supabase.js";
import { buildGlassBox } from "../mcp/adapters/glass-box.js";
import { extractText } from "./extract.js";
import { ingestSource } from "./ingest.js";
import { formatReceiptPlainLanguage } from "./receipt.js";
import { DEFAULT_AUTHORITY_DISPLAY } from "./types.js";
import { extractionSupport } from "./mime.js";
import { knowledgeRetrievalStage } from "../pipeline/stages/knowledge-retrieval.js";
import type { PipelineContext } from "../types/pipeline.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = resolve(__dirname, "../../../knowledge/import/seed-build19-c");

function fixture(rel: string): Buffer {
  const path = resolve(FIXTURE_ROOT, rel);
  assert.ok(existsSync(path), `missing fixture ${path}`);
  return readFileSync(path);
}

type Row = Record<string, unknown>;

function createMock(state: {
  sources: Row[];
  extractions: Row[];
  units: Row[];
  links: Row[];
  registry: Row[];
  uploads: number;
}) {
  function from(table: string) {
    const filters: Record<string, unknown> = {};
    let pendingInsert: Row | Row[] | null = null;
    let upsertPayload: Row | Row[] | null = null;
    let pendingUpdate: Row | null = null;
    const api: Record<string, unknown> = {
      select() {
        return api;
      },
      insert(payload: Row | Row[]) {
        pendingInsert = payload;
        if (Array.isArray(payload)) (api as { _many?: Row[] })._many = payload;
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
        if (table === "knowledge_sources" && filters.content_hash) {
          return {
            data: state.sources.find((s) => s.content_hash === filters.content_hash) ?? null,
            error: null,
          };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "knowledge_sources" && pendingInsert && !Array.isArray(pendingInsert)) {
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
        if (
          table === "knowledge_source_extractions" &&
          pendingInsert &&
          !Array.isArray(pendingInsert)
        ) {
          const row = { id: `ext-${state.extractions.length + 1}`, ...pendingInsert };
          state.extractions.push(row);
          return { data: { id: row.id }, error: null };
        }
        return { data: null, error: { message: "unexpected" } };
      },
      then(resolveCb: (v: unknown) => void) {
        if (table === "knowledge_sources" && pendingUpdate && filters.id) {
          const row = state.sources.find((s) => s.id === filters.id);
          if (row) Object.assign(row, pendingUpdate);
          return resolveCb({ data: row, error: null });
        }
        if (table === "knowledge_retrieval_units" && (api as { _many?: Row[] })._many) {
          const many = (api as { _many: Row[] })._many;
          const inserted = many.map((u, i) => {
            const row = { id: `ru-${state.units.length + i + 1}`, ...u };
            state.units.push(row);
            return { id: row.id };
          });
          return resolveCb({ data: inserted, error: null });
        }
        if (table === "knowledge_retrieval_units" && filters.knowledge_source_id) {
          return resolveCb({
            data: state.units.filter(
              (u) => u.knowledge_source_id === filters.knowledge_source_id
            ),
            error: null,
          });
        }
        if (table === "artifact_links") {
          const rows = (api as { _many?: Row[] })._many ?? (pendingInsert ? [pendingInsert as Row] : []);
          for (const r of rows) state.links.push(r);
          return resolveCb({ data: rows, error: null });
        }
        if (table === "artifact_registry") {
          const row = (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert;
          if (row && !Array.isArray(row)) state.registry.push(row);
          return resolveCb({ data: row, error: null });
        }
        if (table === "knowledge_sources" && filters[`in:id`] == null && filters.retrieval_ready) {
          return resolveCb({
            data: state.sources.filter((s) => s.retrieval_ready === true),
            error: null,
          });
        }
        if (table === "knowledge_sources") {
          return resolveCb({
            data: state.sources.filter((s) => s.retrieval_ready === true),
            error: null,
          });
        }
        if (table === "knowledge_retrieval_units") {
          return resolveCb({
            data: state.units.filter((u) => u.status === "active"),
            error: null,
          });
        }
        return resolveCb({ data: [], error: null });
      },
    };
    return api;
  }
  return {
    from,
    storage: {
      from() {
        return {
          async upload() {
            state.uploads += 1;
            return { data: { path: "x" }, error: null };
          },
        };
      },
    },
  } as unknown as SupabaseClient;
}

test("legacy .ppt is preserve-only, not native extractable", () => {
  assert.equal(extractionSupport("deck.ppt"), "legacy_office");
  assert.equal(extractionSupport("deck.pptx"), "native_office");
});

test("PDF multi-page native extraction keeps page locators", async () => {
  const result = await extractText({
    filename: "multi-page-native.pdf",
    bytes: fixture("pdf/multi-page-native.pdf"),
  });
  assert.equal(result.status, "extracted");
  assert.equal(result.method, "native_pdf");
  assert.ok((result.units?.length ?? 0) >= 3);
  assert.equal(result.units![0].locator?.kind, "pdf_page");
  assert.equal(result.units![0].locator?.page, 1);
  assert.equal(result.units![1].locator?.page, 2);
  assert.equal(result.units![2].locator?.page, 3);
  assert.match(result.units![0].content, /page 1/i);
  assert.match(result.limitation ?? "", /layout/i);
});

test("DOCX extraction locates body paragraphs and table cells", async () => {
  const result = await extractText({
    filename: "with-table.docx",
    bytes: fixture("docx/with-table.docx"),
  });
  assert.equal(result.status, "extracted");
  assert.ok(result.units?.some((u) => u.locator?.kind === "docx_block"));
  const cell = result.units?.find((u) => u.content.includes("CELL-ALPHA"));
  assert.ok(cell);
  assert.equal(cell!.locator?.kind, "docx_cell");
  assert.match(result.limitation ?? "", /headers|footers|layout/i);
});

test("XLSX multi-sheet preserves formula vs value distinctly", async () => {
  const result = await extractText({
    filename: "multi-sheet-formulas.xlsx",
    bytes: fixture("xlsx/multi-sheet-formulas.xlsx"),
  });
  assert.equal(result.status, "extracted");
  const formulaCell = result.units?.find((u) => u.locator?.formula?.includes("B2"));
  assert.ok(formulaCell);
  assert.match(formulaCell!.content, /Formula:/);
  assert.match(formulaCell!.content, /Cached value:/);
  const sheet2 = result.units?.find((u) => u.content.includes("TOKEN-SHEET2"));
  assert.ok(sheet2);
  assert.equal(sheet2!.locator?.sheet, "Detail");
  const noCache = result.units?.find((u) =>
    (u.locator?.formula ?? "").includes("A2")
  );
  assert.ok(noCache);
  assert.match(result.limitation ?? "", /not recalculated|not independently verified/i);
});

test("PPTX multi-slide extracts notes, table, shape; discloses visual-only", async () => {
  const result = await extractText({
    filename: "multi-slide.pptx",
    bytes: fixture("pptx/multi-slide.pptx"),
  });
  assert.equal(result.status, "extracted");
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-SLIDE1")));
  assert.ok(result.units?.some((u) => u.locator?.kind === "pptx_notes"));
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-TABLE-CELL")));
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-SHAPE")));
  assert.match(result.limitation ?? "", /vision-derived extraction is deferred|visual-only|Vision-derived/i);
  assert.ok(result.units?.every((u) => u.locator?.slide != null || u.locator?.page != null));
});

test("corrupt OOXML/PDF extraction fails honestly after blocker detection", async () => {
  const docx = await extractText({
    filename: "broken.docx",
    bytes: fixture("corrupt/broken.docx"),
  });
  assert.equal(docx.status, "blocked_corrupt");
  const pdf = await extractText({
    filename: "broken.pdf",
    bytes: fixture("corrupt/broken.pdf"),
  });
  assert.equal(pdf.status, "blocked_corrupt");
});

test("ingest PDF creates locator-bearing retrieval units and clear receipt", async () => {
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    registry: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "multi-page-native.pdf",
    bytes: fixture("pdf/multi-page-native.pdf"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.retrievalReady, true);
  assert.ok(receipt.retrievalUnitCount >= 3);
  assert.ok(state.units.every((u) => u.locator));
  assert.equal(state.units[0].epistemic_type, "source_evidence");
  assert.match(formatReceiptPlainLanguage(receipt), /ingested/i);
  assert.equal(receipt.authorityDisplay, DEFAULT_AUTHORITY_DISPLAY);
  setSupabaseForTests(null);
});

test("failed extraction with preserved original is ingested but not retrieval-ready", async () => {
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    registry: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "broken.docx",
    bytes: fixture("corrupt/broken.docx"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.originalStored, true);
  assert.equal(receipt.retrievalReady, false);
  assert.match(
    formatReceiptPlainLanguage(receipt),
    /ingested—original preserved; extraction blocked; not retrieval-ready/i
  );
  setSupabaseForTests(null);
});

test("Glass Box surfaces native locator and authority default for PDF unit", async () => {
  const glass = buildGlassBox({
    runtimeId: "rt-c",
    conversationId: "c-c",
    contextPackageId: "cp-c",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-c",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "What does page 2 say?",
      continuity: {
        conversationId: "c-c",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-pdf-2",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "multi-page-native.pdf",
            summary:
              "[PRIMARY SOURCE] Source ID: SRC-pdf. Build19 PDF page 2. Authority: evidence/reference—authority unasserted. Locator: PDF page 2. Extraction method: native_pdf. Limitation: layout may differ. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-pdf",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "PDF page 2",
            extractionMethod: "native_pdf",
            materialLimitation: "layout may differ",
            sourceCardInformed: false,
            whyRetrieved: "Matched page 2",
            transformationNote: "Derived from native extraction — not a finding.",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "What does page 2 say?",
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
  });
  const sourceStage = glass.stages.find((s) => s.stage === "source_evidence");
  const record = sourceStage?.records.find((r) => r.id === "ru-pdf-2");
  assert.ok(record);
  assert.equal(record!.authorityStatus, DEFAULT_AUTHORITY_DISPLAY);
  assert.equal(record!.locator, "PDF page 2");
  assert.equal(record!.extractionMethod, "native_pdf");
  assert.equal(record!.sourceCardInformed, false);
});

test("retrieval stage keeps epistemicType source_evidence for office units", async () => {
  const state = {
    sources: [
      {
        id: "src-1",
        external_id: "SRC-docx",
        title: "with-table.docx",
        original_filename: "with-table.docx",
        source_type: "internal-document",
        authority_classification: "unverified",
        extraction_status: "extracted",
        retrieval_ready: true,
        status: "active",
      },
    ] as Row[],
    extractions: [] as Row[],
    units: [
      {
        id: "ru-1",
        external_id: "RU-1",
        knowledge_source_id: "src-1",
        content: "Bring agenda token CELL-ALPHA",
        content_preview: "Bring agenda token CELL-ALPHA",
        unit_index: 0,
        epistemic_type: "source_evidence",
        status: "active",
        locator: {
          kind: "docx_cell",
          label: "DOCX table 1 row 2 cell 2",
          tableIndex: 0,
          rowIndex: 1,
          cellIndex: 1,
        },
        extraction_method: "native_docx",
        material_limitation: "headers omitted",
      },
    ] as Row[],
    links: [] as Row[],
    registry: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));

  const ctx = {
    request: {
      message: "CELL-ALPHA commitment",
      executiveSlug: "primary-executive",
    },
    stages: [],
  } as unknown as PipelineContext;

  const out = await knowledgeRetrievalStage(ctx);
  assert.ok(out.continuity?.priorSourceEvidence?.length);
  const item = out.continuity!.priorSourceEvidence[0];
  assert.equal(item.epistemicType, "source_evidence");
  assert.match(item.summary, /Locator:\s*DOCX table 1 row 2 cell 2/);
  assert.match(item.summary, /Extraction method:\s*native_docx/);
  assert.match(item.summary, /authority unasserted/i);
  assert.match(item.summary, /Source card informed:\s*no/);
  setSupabaseForTests(null);
});
