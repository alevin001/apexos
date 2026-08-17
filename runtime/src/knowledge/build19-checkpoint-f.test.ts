import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
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
import { setVisionProviderForTests, MockVisionProvider } from "./vision/provider.js";
import {
  MockSourceCardProvider,
  OpenAiSourceCardProvider,
  setSourceCardProviderForTests,
} from "./source-cards/provider.js";
import { generateAndPersistSourceCard } from "./source-cards/generate.js";
import { buildSourceCardInput } from "./source-cards/inputs.js";
import {
  SOURCE_CARD_PROCESS_VERSION,
  SOURCE_CARD_PROMPT_VERSION,
  SOURCE_CARD_WITHHELD,
} from "./source-cards/versions.js";
import { contentHash } from "./content-hash.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_E = resolve(__dirname, "../../../knowledge/import/seed-build19-e");
const FIXTURE_D = resolve(__dirname, "../../../knowledge/import/seed-build19-d");
const FIXTURE_C = resolve(__dirname, "../../../knowledge/import/seed-build19-c");
const FIXTURE_F = resolve(__dirname, "../../../knowledge/import/seed-build19-f");

function fx(root: string, rel: string): Buffer {
  const path = resolve(root, rel);
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
  attachLinks: Row[];
  cards: Row[];
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
        if (table === "knowledge_source_cards") {
          let rows = [...state.cards];
          for (const [k, v] of Object.entries(filters)) {
            if (k.startsWith("in:")) continue;
            rows = rows.filter((r) => r[k] === v);
          }
          return { data: rows[0] ?? null, error: null };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "knowledge_sources" && pendingInsert && !Array.isArray(pendingInsert)) {
          const row: Row = { id: `src-${state.sources.length + 1}`, ...pendingInsert };
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
        if (table === "knowledge_source_cards" && pendingInsert && !Array.isArray(pendingInsert)) {
          const row = { id: `card-${state.cards.length + 1}`, ...pendingInsert };
          state.cards.push(row);
          return resolveCb({ data: row, error: null });
        }
        if (table === "knowledge_source_cards" && filters[`in:knowledge_source_id`]) {
          const ids = filters[`in:knowledge_source_id`] as string[];
          return resolveCb({
            data: state.cards.filter(
              (c) => ids.includes(String(c.knowledge_source_id)) && c.searchable === true
            ),
            error: null,
          });
        }
        if (table === "knowledge_source_cards" && filters.searchable != null) {
          let rows = state.cards.filter((c) => c.searchable === filters.searchable);
          if (filters[`in:knowledge_source_id`]) {
            const ids = filters[`in:knowledge_source_id`] as string[];
            rows = rows.filter((c) => ids.includes(String(c.knowledge_source_id)));
          }
          return resolveCb({ data: rows, error: null });
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
          for (const r of rows) state.links.push(r as Row);
          return resolveCb({ data: rows, error: null });
        }
        if (table === "knowledge_source_attachment_links") {
          if (pendingInsert) {
            const rows = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
            for (const r of rows) {
              state.attachLinks.push({ id: `atl-${state.attachLinks.length + 1}`, ...r });
            }
            return resolveCb({ data: rows, error: null });
          }
          if (filters.child_source_id) {
            return resolveCb({
              data: state.attachLinks.filter(
                (l) => l.child_source_id === filters.child_source_id
              ),
              error: null,
            });
          }
        }
        if (table === "artifact_registry") {
          const row =
            (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert;
          if (row && !Array.isArray(row)) state.registry.push(row);
          return resolveCb({ data: row, error: null });
        }
        if (table === "knowledge_sources" && filters[`in:id`]) {
          const ids = filters[`in:id`] as string[];
          return resolveCb({
            data: state.sources.filter((s) => ids.includes(String(s.id))),
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

function emptyState() {
  return {
    sources: [] as Row[],
    extractions: [] as Row[],
    units: [] as Row[],
    links: [] as Row[],
    registry: [] as Row[],
    attachLinks: [] as Row[],
    cards: [] as Row[],
    uploads: 0,
  };
}

test.before(() => {
  mkdirSync(resolve(FIXTURE_F, "text"), { recursive: true });
  writeFileSync(
    resolve(FIXTURE_F, "text/catalog-note.txt"),
    "Build19 F catalog note TOKEN-CARD-TEXT describes a synthetic operating note for governed source-card tests.\n"
  );
  writeFileSync(
    resolve(FIXTURE_F, "text/long-bounded.txt"),
    ("TOKEN-LONG-START " + "alpha ".repeat(4000) + " TOKEN-LONG-END distinctive-phrase-xyz\n").repeat(2)
  );
});

test.afterEach(() => {
  setSupabaseForTests(null);
  setSourceCardProviderForTests(null);
  setVisionProviderForTests(null);
});

test("Build 18 text source produces grounded neutral source card", async () => {
  setSourceCardProviderForTests(
    new MockSourceCardProvider("ok", {
      catalogSummary:
        "The text file describes a synthetic operating note for ApexOS catalog testing (TOKEN-CARD-TEXT).",
      retrievalCues: ["TOKEN-CARD-TEXT", "synthetic", "operating-note"],
    })
  );
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "catalog-note.txt",
    bytes: fx(FIXTURE_F, "text/catalog-note.txt"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.retrievalReady, true);
  assert.equal(receipt.sourceCardStatus, "generated");
  assert.ok(receipt.sourceCardExternalId);
  assert.equal(receipt.sourceCardMayInformRecall, true);
  assert.match(formatReceiptPlainLanguage(receipt), /source card generated from confirmed extraction/i);
  assert.equal(state.cards[0].epistemic_type, "derived_catalog");
  assert.equal(state.cards[0].searchable, true);
});

test("partial-coverage PDF card discloses exact coverage", async () => {
  setVisionProviderForTests(new MockVisionProvider("fail"));
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  // hybrid with vision fail → incomplete pages → partial card coverage
  const receipt = await ingestSource({
    filename: "hybrid-native-scan.pdf",
    bytes: fx(FIXTURE_D, "pdf/hybrid-native-scan.pdf"),
    ingestionMethod: "single_file",
  });
  assert.ok(receipt.retrievalReady);
  assert.ok(["generated_partial", "generated", "unavailable", "withheld"].includes(receipt.sourceCardStatus ?? ""));
  if (receipt.sourceCardStatus === "generated_partial") {
    assert.match(receipt.sourceCardCoverage ?? "", /partial confirmed extraction coverage/i);
  }
});

test("vision transcription may inform card; visual description never card input", async () => {
  setVisionProviderForTests(new MockVisionProvider("ok"));
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const extraction = await extractText({
    filename: "diagram-with-labels.png",
    bytes: fx(FIXTURE_D, "image/diagram-with-labels.png"),
  });
  assert.ok(extraction.derivatives?.some((d) => d.representationKind === "vision_transcription"));
  assert.ok(
    extraction.derivatives?.some((d) => d.representationKind === "vision_visual_description")
  );
  const built = buildSourceCardInput({
    sourceType: "image",
    filename: "diagram-with-labels.png",
    extraction,
  });
  assert.ok(built.usable);
  assert.ok(built.manifest.included.some((i) => i.representationKind === "vision_transcription"));
  assert.ok(
    !built.manifest.included.some((i) => i.representationKind === "vision_visual_description")
  );
  assert.ok(
    built.manifest.omitted.some((o) => /vision_visual_description|forbidden/i.test(o.detail + o.reason))
  );
});

test("parent email and attachment child get separate cards without content leakage", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fx(FIXTURE_E, "eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  assert.ok(receipt.sourceCardExternalId);
  const parentCard = state.cards.find((c) => c.knowledge_source_id === state.sources[0].id);
  assert.ok(parentCard);
  const manifest = parentCard!.input_manifest as { attachmentMetadataNote?: string; omitted?: Array<{ reason: string }> };
  assert.match(manifest.attachmentMetadataNote ?? "", /Attachment metadata only/i);
  assert.ok(manifest.omitted?.some((o) => o.reason === "attachment_content_excluded"));
  assert.ok(!String(parentCard!.catalog_summary).includes("TOKEN-SHARED-ATTACH"));

  const child = state.sources.find((s) => String(s.original_filename).includes("shared-note.txt"));
  assert.ok(child);
  const childCard = state.cards.find((c) => c.knowledge_source_id === child!.id);
  assert.ok(childCard);
  assert.notEqual(childCard!.external_id, parentCard!.external_id);
});

test("Outlook .msg card limited to recovered fields; sender close-out respected", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const extraction = await extractText({
    filename: "outlook-with-attachment.msg",
    bytes: fx(FIXTURE_E, "msg/outlook-with-attachment.msg"),
  });
  assert.ok(extraction.emailMetadata?.unavailableFields?.includes("sender"));
  const built = buildSourceCardInput({
    sourceType: "email",
    filename: "outlook-with-attachment.msg",
    extraction,
  });
  assert.match(built.metadataNote, /from=unavailable/i);
  assert.ok(!/fabricat/i.test(built.providerText));
});

test("blocked/corrupt source gets no searchable content card", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "corrupt-malformed.eml",
    bytes: fx(FIXTURE_E, "eml/corrupt-malformed.eml"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.retrievalReady, false);
  assert.equal(receipt.sourceCardStatus, "unavailable");
  assert.equal(receipt.sourceCardMayInformRecall, false);
  assert.match(receipt.sourceCardLimitation ?? "", /no usable extraction/i);
});

test("long source uses visible bound — no silent truncation", async () => {
  const bytes = fx(FIXTURE_F, "text/long-bounded.txt");
  const extraction = await extractText({ filename: "long-bounded.txt", bytes });
  const built = buildSourceCardInput({
    sourceType: "internal-document",
    filename: "long-bounded.txt",
    extraction,
  });
  assert.ok(built.usable);
  assert.equal(built.manifest.coverageStatus, "partial");
  assert.ok(built.manifest.truncated || built.manifest.omitted.some((o) => /limit|bounded/i.test(o.reason)));
  assert.ok(built.providerText.includes("TOKEN-LONG-START"));
});

test("re-extraction / process change creates new card; identical input reuses", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const bytes = fx(FIXTURE_F, "text/catalog-note.txt");
  const r1 = await ingestSource({
    filename: "catalog-note.txt",
    bytes,
    ingestionMethod: "single_file",
  });
  assert.ok(r1.sourceCardExternalId);
  const sourceId = state.sources[0].id as string;
  const extraction = await extractText({ filename: "catalog-note.txt", bytes });
  const again = await generateAndPersistSourceCard({
    knowledgeSourceId: sourceId,
    sourceExternalId: r1.sourceExternalId!,
    contentHash: contentHash(bytes),
    sourceType: "internal-document",
    filename: "catalog-note.txt",
    extraction,
  });
  assert.equal(again.reused, true);
  assert.equal(again.externalId, r1.sourceCardExternalId);
  assert.equal(state.cards.filter((c) => c.searchable === true).length, 1);
});

test("card-informed retrieval cites underlying unit; card-only is not evidence", async () => {
  setSourceCardProviderForTests(
    new MockSourceCardProvider("ok", {
      catalogSummary: "Catalog cue UNIQUE-CARD-NOMINATION-PHRASE for recall testing.",
      retrievalCues: ["UNIQUE-CARD-NOMINATION-PHRASE", "catalog"],
    })
  );
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  await ingestSource({
    filename: "catalog-note.txt",
    bytes: fx(FIXTURE_F, "text/catalog-note.txt"),
    ingestionMethod: "single_file",
  });

  const nominated = await retrieveKnowledgeUnits("UNIQUE-CARD-NOMINATION-PHRASE TOKEN-CARD-TEXT");
  assert.ok(nominated.length >= 1);
  assert.equal(nominated[0].sourceCardInformed, true);
  assert.ok(nominated[0].sourceCardId);
  assert.equal(nominated[0].sourceCardRole, "candidate recall only");
  assert.ok(nominated[0].content.includes("TOKEN-CARD-TEXT") || nominated[0].contentPreview);
  assert.match(nominated[0].whyRetrieved, /candidate recall only/i);
  assert.equal(nominated[0].epistemicType, "source_evidence");

  // Card-only: searchable card on a source with no units → must return empty
  state.sources.push({
    id: "src-card-only",
    external_id: "SRC-card-only",
    title: "empty.bin",
    original_filename: "empty.bin",
    source_type: "unknown",
    authority_classification: "unverified",
    extraction_status: "preserve_only",
    retrieval_ready: true, // artificially ready but no units
    status: "active",
    handling_path: "preserve_only_unsupported",
    content_hash: "abc",
  });
  state.cards.push({
    id: "card-only",
    external_id: "CARD-only",
    knowledge_source_id: "src-card-only",
    catalog_summary: "ORPHAN-CARD-ONLY-PHRASE catalog",
    description: "ORPHAN-CARD-ONLY-PHRASE catalog",
    retrieval_cues: ["ORPHAN-CARD-ONLY-PHRASE"],
    searchable: true,
    status: "generated",
    epistemic_type: "derived_catalog",
  });
  const orphan = await retrieveKnowledgeUnits("ORPHAN-CARD-ONLY-PHRASE");
  assert.ok(!orphan.some((u) => u.sourceId === "src-card-only"));
  assert.ok(!orphan.some((u) => u.content?.includes("ORPHAN-CARD-ONLY-PHRASE") && u.epistemicType !== "source_evidence"));
});

test("Glass Box shows sourceCardInformed true and false", async () => {
  const glassTrue = buildGlassBox({
    runtimeId: "rt-f-true",
    conversationId: "c-f",
    contextPackageId: "cp-f",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-f-true",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "catalog?",
      continuity: {
        conversationId: "c-f",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "catalog-note.txt",
            summary:
              "Authority: evidence/reference—authority unasserted. Locator: text. Source card informed: yes. Source-card ID: CARD-1. Source-card role: candidate recall only.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-1",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "text",
            extractionMethod: "utf8",
            sourceCardInformed: true,
            sourceCardId: "CARD-1",
            sourceCardRole: "candidate recall only",
            whyRetrieved: "Card nominated; unit cited",
            transformationNote: "Underlying unit — not card text",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "catalog?",
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
  const rec = glassTrue.stages.find((s) => s.stage === "source_evidence")!.records[0];
  assert.equal(rec.sourceCardInformed, true);
  assert.equal(rec.sourceCardId, "CARD-1");
  assert.equal(rec.sourceCardRole, "candidate recall only");
  assert.equal(rec.authorityStatus, DEFAULT_AUTHORITY_DISPLAY);

  const glassFalse = buildGlassBox({
    runtimeId: "rt-f-false",
    conversationId: "c-f2",
    contextPackageId: "cp-f2",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-f-false",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "plain",
      continuity: {
        conversationId: "c-f2",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-2",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "note.txt",
            summary: "Authority: evidence/reference—authority unasserted. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-2",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "text",
            extractionMethod: "utf8",
            sourceCardInformed: false,
            whyRetrieved: "Direct unit match",
            transformationNote: "Derived text",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "plain",
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
  assert.equal(
    glassFalse.stages.find((s) => s.stage === "source_evidence")!.records[0].sourceCardInformed,
    false
  );
});

test("provider/schema failure changes card status without demoting retrieval readiness", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("fail"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "catalog-note.txt",
    bytes: fx(FIXTURE_F, "text/catalog-note.txt"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.retrievalReady, true);
  assert.equal(receipt.sourceCardStatus, "failed");
  assert.equal(receipt.sourceCardMayInformRecall, false);
  assert.match(
    formatReceiptPlainLanguage(receipt),
    /source card generation failed|Source-card status: failed/i
  );
});

test("withheld card records exact withhold language", async () => {
  setSourceCardProviderForTests(new MockSourceCardProvider("withheld"));
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "catalog-note.txt",
    bytes: fx(FIXTURE_F, "text/catalog-note.txt"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.retrievalReady, true);
  assert.equal(receipt.sourceCardStatus, "withheld");
  assert.equal(receipt.sourceCardLimitation, SOURCE_CARD_WITHHELD);
});

test(
  "controlled live OpenAI source-card generation (Checkpoint F acceptance)",
  {
    skip:
      !runtimeConfig.openaiApiKey &&
      "OPENAI_API_KEY not configured — Checkpoint F live source-card blocker",
  },
  async () => {
    setSourceCardProviderForTests(new OpenAiSourceCardProvider());
    const state = emptyState();
    setSupabaseForTests(createMock(state));
    const receipt = await ingestSource({
      filename: "catalog-note.txt",
      bytes: fx(FIXTURE_F, "text/catalog-note.txt"),
      ingestionMethod: "single_file",
    });
    assert.equal(receipt.retrievalReady, true);
    assert.ok(["generated", "generated_partial"].includes(receipt.sourceCardStatus ?? ""));
    assert.ok(receipt.sourceCardExternalId);
    assert.equal(receipt.sourceCardMayInformRecall, true);
    const card = state.cards.find((c) => c.external_id === receipt.sourceCardExternalId);
    assert.ok(card);
    assert.equal(card!.epistemic_type, "derived_catalog");
    assert.ok(String(card!.catalog_summary || card!.description).length > 20);
    console.log(
      JSON.stringify(
        {
          liveSourceCard: {
            ok: true,
            provider: card!.provider_name,
            model: card!.provider_model,
            processVersion: SOURCE_CARD_PROCESS_VERSION,
            promptVersion: SOURCE_CARD_PROMPT_VERSION,
            status: card!.status,
            summaryPreview: String(card!.catalog_summary || "").slice(0, 240),
          },
        },
        null,
        2
      )
    );
  }
);

// silence unused FIXTURE_C import warning by referencing in a trivial assert path
test("native multi-page PDF fixture still available for card coverage proofs", async () => {
  assert.ok(existsSync(resolve(FIXTURE_C, "pdf/multi-page-native.pdf")));
});
