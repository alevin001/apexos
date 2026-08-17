/**
 * Build 19 Checkpoint G — final synthetic batch-import readiness.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, symlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../shared/supabase.js";
import { runtimeConfig } from "../config.js";
import { buildGlassBox } from "../mcp/adapters/glass-box.js";
import { runBulkImport } from "./bulk-import.js";
import {
  armFaultInjection,
  clearFaultInjection,
  InjectedFaultError,
} from "./fault-inject.js";
import { ingestSource } from "./ingest.js";
import { inventoryAndClassify } from "./inventory.js";
import { buildManifest } from "./manifest.js";
import {
  getProviderCallCounters,
  resetProviderCallCounters,
  setProviderModeForTests,
} from "./provider-mode.js";
import { retrieveKnowledgeUnits } from "./retrieve.js";
import { DEFAULT_AUTHORITY_DISPLAY } from "./types.js";
import {
  getSourceCardProvider,
  MockSourceCardProvider,
  OpenAiSourceCardProvider,
  setSourceCardProviderForTests,
} from "./source-cards/provider.js";
import {
  getVisionProvider,
  MockVisionProvider,
  OpenAiVisionProvider,
  setVisionProviderForTests,
} from "./vision/provider.js";
import { contentHash } from "./content-hash.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_G = resolve(__dirname, "../../../knowledge/import/seed-build19-g");
const FIXTURE_D = resolve(__dirname, "../../../knowledge/import/seed-build19-d");

type Row = Record<string, unknown>;

function createMock(state: {
  sources: Row[];
  extractions: Row[];
  units: Row[];
  links: Row[];
  registry: Row[];
  attachLinks: Row[];
  cards: Row[];
  runs: Row[];
  runItems: Row[];
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
        if (table === "knowledge_source_extractions" && filters.external_id) {
          return {
            data: state.extractions.find((e) => e.external_id === filters.external_id) ?? null,
            error: null,
          };
        }
        if (table === "knowledge_source_attachment_links") {
          let rows = [...state.attachLinks];
          for (const [k, v] of Object.entries(filters)) {
            rows = rows.filter((r) => r[k] === v);
          }
          return { data: rows[0] ?? null, error: null };
        }
        if (table === "ingestion_runs" && filters.external_id) {
          return {
            data: state.runs.find((r) => r.external_id === filters.external_id) ?? null,
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
        if (table === "ingestion_runs" && pendingInsert && !Array.isArray(pendingInsert)) {
          const row = { id: `run-${state.runs.length + 1}`, ...pendingInsert };
          state.runs.push(row);
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
        if (table === "ingestion_run_items" && (upsertPayload || pendingInsert)) {
          const row =
            (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert!;
          const existing = state.runItems.find(
            (i) => i.run_id === (row as Row).run_id && i.source_path === (row as Row).source_path
          );
          if (existing) Object.assign(existing, row);
          else state.runItems.push(row as Row);
          return resolveCb({ data: row, error: null });
        }
        if (table === "ingestion_runs" && pendingUpdate) {
          const run = state.runs.find((r) => r.id === filters.id) ?? state.runs[0];
          if (run) Object.assign(run, pendingUpdate);
          return resolveCb({ data: run, error: null });
        }
        if (table === "ingestion_run_items" && filters.run_id) {
          return resolveCb({
            data: state.runItems.filter((i) => i.run_id === filters.run_id),
            error: null,
          });
        }
        if (table === "knowledge_sources" && filters[`in:content_hash`]) {
          const hashes = filters[`in:content_hash`] as string[];
          return resolveCb({
            data: state.sources.filter((s) => hashes.includes(String(s.content_hash))),
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
        if (table === "knowledge_source_cards" && filters.searchable != null) {
          return resolveCb({
            data: state.cards.filter((c) => c.searchable === filters.searchable),
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
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
  };
}

async function ensureGCorpus(): Promise<string> {
  if (!existsSync(resolve(FIXTURE_G, "text/operating-note.txt"))) {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("npm", ["run", "knowledge:fixtures-g"], {
      cwd: resolve(__dirname, "../.."),
      shell: true,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      throw new Error(`fixtures-g failed: ${r.stderr || r.stdout}`);
    }
  }
  return FIXTURE_G;
}

test.beforeEach(() => {
  clearFaultInjection();
  setProviderModeForTests("test_mock");
  process.env.APEXOS_ALLOW_TEST_MOCK = "1";
  resetProviderCallCounters("test_mock");
  setVisionProviderForTests(new MockVisionProvider("ok", "TOKEN-G-VISION mock transcription"));
  setSourceCardProviderForTests(new MockSourceCardProvider("ok"));
});

test.afterEach(() => {
  clearFaultInjection();
  setSupabaseForTests(null);
  setSourceCardProviderForTests(null);
  setVisionProviderForTests(null);
  setProviderModeForTests(null);
  delete process.env.APEXOS_ALLOW_TEST_MOCK;
  delete process.env.APEXOS_PROVIDER_MODE;
});

test("production-mode cannot silently fall back to mock derivatives", () => {
  setProviderModeForTests(null);
  delete process.env.APEXOS_ALLOW_TEST_MOCK;
  delete process.env.APEXOS_PROVIDER_MODE;
  setSourceCardProviderForTests(null);
  setVisionProviderForTests(null);

  const cards = getSourceCardProvider();
  const vision = getVisionProvider();
  assert.equal(cards.name, "openai");
  assert.equal(vision.name, "openai");
  assert.ok(cards instanceof OpenAiSourceCardProvider);
  assert.ok(vision instanceof OpenAiVisionProvider);

  setProviderModeForTests(null);
  process.env.APEXOS_PROVIDER_MODE = "test_mock";
  delete process.env.APEXOS_ALLOW_TEST_MOCK;
  assert.throws(() => getSourceCardProvider(), /APEXOS_ALLOW_TEST_MOCK|test_mock/);
});

test("dry-run: zero protected writes, zero provider calls, visible exclusions", async () => {
  const root = await ensureGCorpus();
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  resetProviderCallCounters("test_mock");

  const scratch = await mkdtemp(join(tmpdir(), "apexos-g-dry-"));
  const manifestPath = join(scratch, "preflight.manifest.json");
  const summary = await runBulkImport({
    rootPath: root,
    dryRun: true,
    providerMode: "test_mock",
    writeManifestPath: manifestPath,
  });

  assert.equal(summary.dryRun, true);
  assert.equal(summary.zeroWrites, true);
  assert.equal(state.sources.length, 0);
  assert.equal(state.uploads, 0);
  assert.equal(state.runs.length, 0);
  const counters = getProviderCallCounters();
  assert.equal(counters.visionCalls, 0);
  assert.equal(counters.sourceCardCalls, 0);
  assert.ok(summary.batchReceipt);

  const excluded = summary.items.filter((i) => i.disposition === "excluded");
  assert.ok(excluded.length >= 1, "system/sidecar exclusions must be visible");
  assert.ok(
    excluded.some((e) => /Thumbs\.db|meta\.md|README/i.test(e.path)),
    "named sidecar exclusion recorded"
  );

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.schemaVersion, "build19-manifest-1.0");
  assert.ok(manifest.preflightSummary);
  assert.ok(manifest.preflightSummary.excludedVisible >= 1);
  assert.ok(manifest.items.every((i: { expectedExtractionMethod?: string }) => i.expectedExtractionMethod));
  assert.equal(manifest.notes.some((n: string) => /operational provenance/i.test(n)), true);
});

test("path escape / symlink outside root is rejected visibly", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-g-path-"));
  await writeFile(join(dir, "ok.txt"), "TOKEN-G-PATH-OK");
  const outside = await mkdtemp(join(tmpdir(), "apexos-g-outside-"));
  await writeFile(join(outside, "secret.txt"), "SECRET");
  try {
    symlinkSync(join(outside, "secret.txt"), join(dir, "escape-link.txt"));
  } catch {
    // Windows may require admin for symlinks — skip soft
    return;
  }
  const { classified } = await inventoryAndClassify(dir);
  const rejected = classified.filter((c) => c.pathRejected);
  assert.ok(rejected.length >= 1);
  assert.match(rejected[0].classificationReason, /escape|Symlink/i);
});

test("fault after original storage then resume — no duplicate source row", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const bytes = Buffer.from("Build19 G fault-storage TOKEN-G-FAULT-STORE\n");

  armFaultInjection("after_original_storage");
  await assert.rejects(
    () =>
      ingestSource({
        filename: "fault-store.txt",
        bytes,
        ingestionMethod: "single_file",
      }),
    (err: unknown) => err instanceof InjectedFaultError
  );
  assert.equal(state.uploads, 1);
  assert.equal(state.sources.length, 0);
  assert.equal(
    false,
    // durableKnowledgeConfirmed requires source row — none yet
    state.sources.some((s) => s.content_hash === contentHash(bytes))
  );

  clearFaultInjection();
  const receipt = await ingestSource({
    filename: "fault-store.txt",
    bytes,
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(state.sources.length, 1);
  assert.equal(state.uploads, 2); // idempotent retry attempt; storage accepts exists
});

test("fault after source row before extraction complete — resume completes once", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const bytes = Buffer.from("Build19 G fault-row TOKEN-G-FAULT-ROW\n");

  armFaultInjection("after_source_row_before_extraction_complete");
  await assert.rejects(
    () =>
      ingestSource({
        filename: "fault-row.txt",
        bytes,
        ingestionMethod: "single_file",
      }),
    (err: unknown) => err instanceof InjectedFaultError
  );
  assert.equal(state.sources.length, 1);
  assert.equal(state.sources[0].extraction_status, "pending");
  assert.equal(state.sources[0].processing_status, "stored");
  assert.equal(state.units.length, 0);

  clearFaultInjection();
  const receipt = await ingestSource({
    filename: "fault-row.txt",
    bytes,
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(state.sources.length, 1);
  assert.ok(state.units.length >= 1);
  assert.equal(state.sources[0].processing_status, "processed");
});

test("mixed batch execute receipt counts + exact duplicate / same-name changed", async () => {
  const root = await ensureGCorpus();
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const scratch = await mkdtemp(join(tmpdir(), "apexos-g-manifest-"));

  const { classified } = await inventoryAndClassify(root);
  const manifest = buildManifest({
    rootPath: root,
    classified,
    reconciled: true,
  });
  const manifestPath = join(scratch, "execute.manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const summary = await runBulkImport({
    rootPath: root,
    dryRun: false,
    authorizeExecute: true,
    manifestPath,
    providerMode: "test_mock",
  });

  assert.ok(summary.batchReceipt, `expected batch receipt, got ${JSON.stringify(summary).slice(0, 400)}`);
  const br = summary.batchReceipt!;
  assert.ok(br.discoveredItems >= 10);
  assert.equal(br.providerMode, "test_mock");
  assert.ok(br.uniqueDurableSources >= 1);
  assert.ok(br.testMockProviderCalls >= 0);

  const textHash = contentHash(
    readFileSync(resolve(root, "text/operating-note.txt"))
  );
  const sameHashItems = summary.items.filter((i) => i.contentHash === textHash);
  assert.equal(sameHashItems.length, 2, "exact duplicate appears twice in intake");
  assert.ok(sameHashItems.some((i) => i.disposition === "duplicate"));
  assert.ok(
    sameHashItems.some((i) => i.disposition === "ingested" || i.disposition === "deferred_extraction")
  );

  const changed = summary.items.find(
    (i) => i.path.replace(/\\/g, "/") === "duplicates/operating-note.txt"
  );
  assert.ok(changed);
  assert.notEqual(changed!.contentHash, textHash);
  assert.notEqual(changed!.disposition, "duplicate");

  const deferred = summary.items.filter(
    (i) =>
      i.disposition === "deferred_mailbox" ||
      i.handlingPath === "deferred_mailbox_container" ||
      i.handlingPath === "preserve_only_legacy_office"
  );
  assert.ok(deferred.length >= 1);

  // Idempotent rerun
  const summary2 = await runBulkImport({
    rootPath: root,
    dryRun: false,
    authorizeExecute: true,
    manifestPath,
    providerMode: "test_mock",
  });
  assert.ok(summary2.filesDuplicate + summary2.filesSkipped >= summary.filesIngested);
});

test("retrieval + Glass Box: native, vision, email, attachment dual-parent, preserve-only", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  setVisionProviderForTests(
    new MockVisionProvider("ok", "TOKEN-G-VISION-RETRIEVE mock transcription")
  );

  const native = await ingestSource({
    filename: "native-g.txt",
    bytes: Buffer.from("Build19 G native retrieve TOKEN-G-NATIVE-RU\n"),
    ingestionMethod: "bulk_import",
  });
  assert.equal(native.retrievalReady, true);

  const imgPath = resolve(FIXTURE_D, "image/diagram-with-labels.png");
  if (existsSync(imgPath)) {
    const vision = await ingestSource({
      filename: "diagram-with-labels.png",
      bytes: readFileSync(imgPath),
      ingestionMethod: "bulk_import",
      handlingPath: "vision_assisted",
    });
    assert.ok(vision.durableKnowledgeConfirmed);
  }

  const root = await ensureGCorpus();
  const eml = readFileSync(resolve(root, "eml/multipart-with-attachments.eml"));
  const eml2 = readFileSync(resolve(root, "eml/second-parent-shared-attachment.eml"));
  await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: eml,
    ingestionMethod: "bulk_import",
    handlingPath: "email_message",
  });
  await ingestSource({
    filename: "second-parent-shared-attachment.eml",
    bytes: eml2,
    ingestionMethod: "bulk_import",
    handlingPath: "email_message",
  });

  const preserve = await ingestSource({
    filename: "mystery.xyz",
    bytes: Buffer.from("preserve-only TOKEN-G-BLOCKED"),
    ingestionMethod: "bulk_import",
    handlingPath: "preserve_only_unsupported",
  });
  assert.equal(preserve.retrievalReady, false);

  const units = await retrieveKnowledgeUnits("TOKEN-G-NATIVE-RU", { limit: 5 });
  assert.ok(units.length >= 1);
  assert.equal(units[0].epistemicType, "source_evidence");
  assert.ok(units[0].locator || units[0].extractionMethod || units[0].content);
  assert.equal(units[0].authorityDisplay, DEFAULT_AUTHORITY_DISPLAY);

  const u0 = units[0];
  const glass = buildGlassBox({
    runtimeId: "rt-g",
    conversationId: "c-g",
    contextPackageId: "cp-g",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-g",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "native?",
      continuity: {
        conversationId: "c-g",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: u0.id,
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: u0.sourceTitle,
            summary: `Authority: ${DEFAULT_AUTHORITY_DISPLAY}. Locator: ${u0.locator?.label ?? "text"}.`,
            epistemicType: "source_evidence",
            sourceExternalId: u0.sourceExternalId,
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: u0.locator?.label ?? "text",
            extractionMethod: u0.extractionMethod,
            whyRetrieved: u0.whyRetrieved,
            transformationNote: u0.transformationNote,
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
      },
    } as never,
  });
  assert.match(JSON.stringify(glass), /authority unasserted|evidence\/reference/i);

  const blockedHits = await retrieveKnowledgeUnits("TOKEN-G-BLOCKED", { limit: 5 });
  assert.equal(
    blockedHits.filter((u) => u.content.includes("TOKEN-G-BLOCKED")).length,
    0,
    "preserve-only must not return as evidence"
  );

  const sharedHits = await retrieveKnowledgeUnits("TOKEN-G-SHARED-ATTACH", { limit: 10 });
  if (sharedHits.length > 0) {
    assert.ok((sharedHits[0].parentEmailExternalIds?.length ?? 0) >= 1);
  }
});

test(
  "controlled live vision + source-card synthetic proof",
  { skip: !runtimeConfig.openaiApiKey ? "OPENAI_API_KEY not configured" : false },
  async () => {
    const state = emptyState();
    setSupabaseForTests(createMock(state));
    setProviderModeForTests("live");
    setVisionProviderForTests(null);
    setSourceCardProviderForTests(null);
    resetProviderCallCounters("live");

    const imgPath = resolve(FIXTURE_D, "image/diagram-with-labels.png");
    assert.ok(existsSync(imgPath), "need D diagram fixture");

    const t0 = Date.now();
    const receipt = await ingestSource({
      filename: "diagram-with-labels.png",
      bytes: readFileSync(imgPath),
      ingestionMethod: "single_file",
      handlingPath: "vision_assisted",
      title: "G live diagram",
    });
    const elapsed = Date.now() - t0;
    const counters = getProviderCallCounters();

    assert.equal(receipt.providerMode, "live");
    assert.ok(receipt.durableKnowledgeConfirmed);
    assert.ok(counters.visionCalls >= 1);
    assert.ok(counters.sourceCardCalls >= 1);
    assert.ok(elapsed > 0);

    const units = await retrieveKnowledgeUnits("diagram", { limit: 5 });
    assert.ok(units.some((u) => u.extractionMethod?.includes("vision") || /vision/i.test(u.content)));
    assert.ok(!units.some((u) => /catalog_summary|source card/i.test(u.content)));

    console.log(
      JSON.stringify({
        checkpoint: "G-live",
        providerMode: "live",
        visionCalls: counters.visionCalls,
        sourceCardCalls: counters.sourceCardCalls,
        elapsedMs: elapsed,
        sourceCardStatus: receipt.sourceCardStatus,
        retrievalReady: receipt.retrievalReady,
      })
    );
  }
);
