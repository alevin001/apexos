import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../shared/supabase.js";
import { runtimeConfig } from "../config.js";
import { buildGlassBox } from "../mcp/adapters/glass-box.js";
import { extractText } from "./extract.js";
import { ingestSource } from "./ingest.js";
import { formatReceiptPlainLanguage } from "./receipt.js";
import { retrieveKnowledgeUnits } from "./retrieve.js";
import { DEFAULT_AUTHORITY_DISPLAY } from "./types.js";
import { extractionSupport, defaultHandlingPath } from "./mime.js";
import {
  MockVisionProvider,
  OpenAiVisionProvider,
  setVisionProviderForTests,
} from "./vision/provider.js";
import { VISION_PROCESS_VERSION, VISION_PROMPT_VERSION } from "./vision/versions.js";
import { hasSufficientNativeText } from "./extractors/pdf-governed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = resolve(__dirname, "../../../knowledge/import/seed-build19-d");

function fixture(rel: string): Buffer {
  const path = resolve(FIXTURE_ROOT, rel);
  assert.ok(existsSync(path), `missing fixture ${path} — run npm run knowledge:fixtures-d`);
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
          const rows =
            (api as { _many?: Row[] })._many ?? (pendingInsert ? [pendingInsert as Row] : []);
          for (const r of rows) state.links.push(r);
          return resolveCb({ data: rows, error: null });
        }
        if (table === "artifact_registry") {
          const row =
            (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert;
          if (row && !Array.isArray(row)) state.registry.push(row);
          return resolveCb({ data: row, error: null });
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

test.afterEach(() => {
  setVisionProviderForTests(null);
  setSupabaseForTests(null);
});

test("images use vision_assisted handling, not deferred extraction", () => {
  assert.equal(extractionSupport("diagram.png"), "vision_image");
  assert.equal(defaultHandlingPath("diagram.png"), "vision_assisted");
});

test("native-text PDF does not invoke vision", async () => {
  let calls = 0;
  setVisionProviderForTests({
    name: "counting-mock",
    async analyze() {
      calls += 1;
      throw new Error("vision must not be called for native-text PDF");
    },
  });
  const result = await extractText({
    filename: "native-text-multi.pdf",
    bytes: fixture("pdf/native-text-multi.pdf"),
  });
  assert.equal(result.status, "extracted");
  assert.equal(result.visionInvoked, false);
  assert.equal(calls, 0);
  assert.ok(result.pageCoverage?.every((p) => p.status === "native"));
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-NATIVE-P1")));
  assert.ok(result.units?.some((u) => u.locator?.page === 2));
  assert.match(result.limitation ?? "", /Vision was not invoked/i);
  assert.match(result.limitation ?? "", /not an Office document/i);
});

test("scanned multi-page PDF uses vision with page locators (mock)", async () => {
  setVisionProviderForTests(
    new MockVisionProvider(
      "ok",
      "TOKEN-SCAN mock transcription for governed vision page"
    )
  );
  const result = await extractText({
    filename: "scanned-multipage.pdf",
    bytes: fixture("pdf/scanned-multipage.pdf"),
  });
  assert.equal(result.status, "extracted");
  assert.equal(result.visionInvoked, true);
  assert.ok(result.pageCoverage?.length === 2);
  assert.ok(result.pageCoverage?.every((p) => p.status === "vision_derived"));
  assert.ok(result.derivatives?.some((d) => d.representationKind === "vision_transcription"));
  assert.ok(
    result.units?.every(
      (u) => u.locator?.kind === "pdf_page" && u.locator.section === "vision_transcription"
    )
  );
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-SCAN")));
});

test("hybrid PDF reports separate page methods and coverage", async () => {
  setVisionProviderForTests(
    new MockVisionProvider("ok", "TOKEN-HYBRID-SCAN mock vision transcription")
  );
  const result = await extractText({
    filename: "hybrid-native-scan.pdf",
    bytes: fixture("pdf/hybrid-native-scan.pdf"),
  });
  assert.equal(result.visionInvoked, true);
  const byPage = new Map(result.pageCoverage?.map((p) => [p.page, p]));
  assert.equal(byPage.get(1)?.status, "native");
  assert.ok(["vision_derived", "both_separate", "partial"].includes(byPage.get(2)?.status ?? ""));
  assert.ok(
    ["vision_derived", "both_separate", "partial"].includes(byPage.get(3)?.status ?? ""),
    `page 3 status=${byPage.get(3)?.status}`
  );
  assert.ok(result.derivatives?.some((d) => d.representationKind === "deterministic_parser"));
  assert.ok(result.derivatives?.some((d) => d.representationKind === "vision_transcription"));
  assert.match(result.limitation ?? "", /not fully extracted|separate|Vision invoked/i);
});

test("diagram transcription is distinct from visual description", async () => {
  setVisionProviderForTests(new MockVisionProvider("ok"));
  const result = await extractText({
    filename: "diagram-with-labels.png",
    bytes: fixture("image/diagram-with-labels.png"),
  });
  assert.equal(result.visionInvoked, true);
  assert.ok(result.derivatives?.some((d) => d.representationKind === "vision_transcription"));
  assert.ok(
    result.derivatives?.some((d) => d.representationKind === "vision_visual_description")
  );
  const desc = result.derivatives?.find(
    (d) => d.representationKind === "vision_visual_description"
  );
  assert.equal(desc?.createRetrievalUnits, false);
  assert.match(result.text ?? "", /vision-derived transcription/i);
  assert.match(result.text ?? "", /vision-derived visual description/i);
  assert.ok(result.units?.every((u) => u.locator?.kind === "image"));
});

test("embellished visual description is withheld rather than stored", async () => {
  setVisionProviderForTests({
    name: "embellish-mock",
    async analyze(req) {
      if (req.kind === "transcription") {
        return {
          ok: true,
          text: "TOKEN-DIAGRAM-LABEL Box A",
          provider: "embellish-mock",
          model: "mock",
          processVersion: VISION_PROCESS_VERSION,
          promptVersion: VISION_PROMPT_VERSION,
          timestamp: new Date().toISOString(),
        };
      }
      return {
        ok: true,
        text: "Two labeled boxes indicating a relationship from Box A to Box B in a hierarchy.",
        provider: "embellish-mock",
        model: "mock",
        processVersion: VISION_PROCESS_VERSION,
        promptVersion: VISION_PROMPT_VERSION,
        timestamp: new Date().toISOString(),
      };
    },
  });
  const result = await extractText({
    filename: "diagram-with-labels.png",
    bytes: fixture("image/diagram-with-labels.png"),
  });
  const desc = result.derivatives?.find(
    (d) => d.representationKind === "vision_visual_description"
  );
  assert.equal(desc?.text, "visual description withheld—insufficient grounded detail");
  assert.equal(desc?.createRetrievalUnits, false);
});

test("fully covered scanned PDF receipt is not partial-or-blocked", async () => {
  setVisionProviderForTests(
    new MockVisionProvider("ok", "TOKEN-SCAN-P1 full coverage transcription")
  );
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
    filename: "scanned-multipage.pdf",
    bytes: fixture("pdf/scanned-multipage.pdf"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.pageCoverageComplete, true);
  assert.equal(receipt.retrievalReady, true);
  assert.equal(receipt.retrievalReadiness, "ready");
  const plain = formatReceiptPlainLanguage(receipt);
  assert.doesNotMatch(plain, /vision extraction partial or blocked/i);
  assert.match(plain, /page coverage confirmed|retrieval-ready for confirmed units/i);
});

test("partial unreadable image reports honest partial without inventing content", async () => {
  setVisionProviderForTests(new MockVisionProvider("partial"));
  const result = await extractText({
    filename: "partial-obscured.png",
    bytes: fixture("image/partial-obscured.png"),
  });
  assert.equal(result.status, "extracted");
  assert.match(result.units?.[0]?.content ?? "", /\[unreadable\]/i);
  assert.match(result.limitation ?? "", /unreadable|Partial/i);
  assert.ok(!/invented|hallucin/i.test(result.limitation ?? ""));
});

test("provider failure preserves original and does not mark retrieval-ready", async () => {
  setVisionProviderForTests(new MockVisionProvider("fail"));
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
    filename: "diagram-with-labels.png",
    bytes: fixture("image/diagram-with-labels.png"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.originalStored, true);
  assert.equal(receipt.retrievalReady, false);
  assert.equal(receipt.retrievalReadiness, "not_ready");
  assert.match(
    formatReceiptPlainLanguage(receipt),
    /ingested—original preserved; vision extraction partial or blocked; retrieval availability limited to confirmed units/i
  );
});

test("provider timeout blocks vision coverage honestly", async () => {
  setVisionProviderForTests(new MockVisionProvider("timeout"));
  const result = await extractText({
    filename: "scanned-multipage.pdf",
    bytes: fixture("pdf/scanned-multipage.pdf"),
  });
  assert.equal(result.visionInvoked, true);
  assert.ok(result.pageCoverage?.every((p) => p.status === "blocked"));
  assert.equal((result.units ?? []).length, 0);
  assert.match(result.limitation ?? "", /timed out|blocked/i);
});

test("ingest scanned PDF persists vision derivative lineage + retrieval units", async () => {
  setVisionProviderForTests(
    new MockVisionProvider("ok", "TOKEN-SCAN-P1 lineage proof transcription")
  );
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
    filename: "scanned-multipage.pdf",
    bytes: fixture("pdf/scanned-multipage.pdf"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.retrievalReady, true);
  assert.ok(state.extractions.some((e) => e.representation_kind === "vision_transcription"));
  assert.ok(state.extractions.every((e) => e.content_hash_of_original));
  assert.ok(state.extractions.some((e) => e.process_version === VISION_PROCESS_VERSION));
  assert.ok(state.extractions.some((e) => e.provider_name === "mock-vision"));
  assert.ok(state.units.every((u) => u.locator));
  assert.ok(state.units.every((u) => String(u.extraction_method).includes("vision")));
  assert.equal(state.units[0].epistemic_type, "source_evidence");
});

test("retrieval + Glass Box for scanned PDF page and diagram", async () => {
  const glassPdf = buildGlassBox({
    runtimeId: "rt-d-pdf",
    conversationId: "c-d",
    contextPackageId: "cp-d",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-d-pdf",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "What does the scanned page say?",
      continuity: {
        conversationId: "c-d",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-scan-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "scanned-multipage.pdf",
            summary:
              "[PRIMARY SOURCE] Source ID: SRC-scan. Authority: evidence/reference—authority unasserted. Locator: PDF page 1. Extraction method: vision_pdf_page. Limitation: Vision-derived transcription — not independent verification. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-scan",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "PDF page 1",
            extractionMethod: "vision_pdf_page",
            materialLimitation:
              "Vision-derived transcription — not independent verification of meaning; not a finding.",
            sourceCardInformed: false,
            whyRetrieved: "Matched TOKEN-SCAN-P1 on scanned page",
            transformationNote:
              "Excerpt is a vision-derived transcription linked to the original source locator — not the original file, not independent verification of meaning, and not a finding.",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "What does the scanned page say?",
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
  const src = glassPdf.stages.find((s) => s.stage === "source_evidence");
  assert.ok(src && src.status === "captured");
  const rec = src!.records[0];
  assert.equal(rec.authorityStatus, DEFAULT_AUTHORITY_DISPLAY);
  assert.equal(rec.locator, "PDF page 1");
  assert.equal(rec.extractionMethod, "vision_pdf_page");
  assert.equal(rec.sourceCardInformed, false);
  assert.match(rec.transformationNote ?? "", /vision-derived transcription/i);

  const glassImg = buildGlassBox({
    runtimeId: "rt-d-img",
    conversationId: "c-d2",
    contextPackageId: "cp-d2",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-d-img",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "What labels are on the diagram?",
      continuity: {
        conversationId: "c-d2",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-img-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "diagram-with-labels.png",
            summary:
              "[PRIMARY SOURCE] Authority: evidence/reference—authority unasserted. Locator: Image diagram-with-labels.png. Extraction method: vision_image_transcription. Limitation: Vision-derived transcription. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-diagram",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "Image diagram-with-labels.png",
            extractionMethod: "vision_image_transcription",
            materialLimitation: "Vision-derived transcription — not independent verification of meaning.",
            sourceCardInformed: false,
            whyRetrieved: "Matched TOKEN-DIAGRAM-LABEL",
            transformationNote:
              "Excerpt is a vision-derived transcription linked to the original source locator — not the original file.",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "What labels are on the diagram?",
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
  const imgRec = glassImg.stages.find((s) => s.stage === "source_evidence")!.records[0];
  assert.equal(imgRec.sourceCardInformed, false);
  assert.equal(imgRec.extractionMethod, "vision_image_transcription");
  assert.match(imgRec.locator ?? "", /Image/i);
});

test("ingest + retrieve discloses vision method for diagram unit", async () => {
  setVisionProviderForTests(
    new MockVisionProvider("ok", "TOKEN-DIAGRAM-LABEL Box A visible text")
  );
  const state = {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    registry: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));
  await ingestSource({
    filename: "diagram-with-labels.png",
    bytes: fixture("image/diagram-with-labels.png"),
    ingestionMethod: "single_file",
  });
  const ranked = await retrieveKnowledgeUnits("TOKEN-DIAGRAM-LABEL");
  assert.ok(ranked.length >= 1);
  assert.match(ranked[0].transformationNote, /vision-derived transcription/i);
  assert.equal(ranked[0].sourceCardInformed, false);
  assert.equal(ranked[0].authorityDisplay, DEFAULT_AUTHORITY_DISPLAY);
  assert.match(ranked[0].whyRetrieved, /Source card informed: no/i);
});

test("sufficient native text threshold avoids vision on short noise", () => {
  assert.equal(hasSufficientNativeText("x"), false);
  assert.equal(
    hasSufficientNativeText("Build19 D hybrid page 1 native — TOKEN-HYBRID-NATIVE"),
    true
  );
});

test(
  "controlled live OpenAI vision run (Checkpoint D acceptance)",
  { skip: !runtimeConfig.openaiApiKey && "OPENAI_API_KEY not configured — Checkpoint D live vision blocker" },
  async () => {
    setVisionProviderForTests(null); // use real OpenAiVisionProvider
    const provider = new OpenAiVisionProvider();
    const result = await extractText({
      filename: "diagram-with-labels.png",
      bytes: fixture("image/diagram-with-labels.png"),
    });
    assert.equal(result.visionInvoked, true);
    assert.equal(result.status, "extracted");
    assert.ok(
      /TOKEN-DIAGRAM-LABEL|Box A|diagram/i.test(result.text ?? ""),
      `live vision text missing expected tokens: ${(result.text ?? "").slice(0, 400)}`
    );
    assert.ok(result.derivatives?.some((d) => d.representationKind === "vision_transcription"));
    assert.ok(
      result.derivatives?.some((d) => d.representationKind === "vision_visual_description")
    );
    assert.equal(result.providerName, "openai");
    assert.ok(result.providerModel);
    console.log(
      JSON.stringify(
        {
          liveVision: {
            ok: true,
            provider: result.providerName,
            model: result.providerModel,
            processVersion: VISION_PROCESS_VERSION,
            promptVersion: VISION_PROMPT_VERSION,
            transcriptionPreview: result.derivatives
              ?.find((d) => d.representationKind === "vision_transcription")
              ?.text.slice(0, 300),
            visualDescriptionPreview: result.derivatives
              ?.find((d) => d.representationKind === "vision_visual_description")
              ?.text.slice(0, 300),
          },
        },
        null,
        2
      )
    );
    assert.equal(provider.name, "openai");
  }
);
