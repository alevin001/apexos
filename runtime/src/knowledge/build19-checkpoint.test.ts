import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../shared/supabase.js";
import { classifyFile } from "./classify.js";
import { runBulkImport } from "./bulk-import.js";
import { contentHash } from "./content-hash.js";
import { ingestSource } from "./ingest.js";
import { buildManifest, verifyManifestHashes } from "./manifest.js";
import { inventoryAndClassify } from "./inventory.js";
import { DEFAULT_AUTHORITY_DISPLAY } from "./types.js";
import { extractionSupport } from "./mime.js";

type Row = Record<string, unknown>;

function createMock(state: {
  sources: Row[];
  runs: Row[];
  runItems: Row[];
  uploads: number;
  selects?: number;
}) {
  state.selects = state.selects ?? 0;
  function from(table: string) {
    const filters: Record<string, unknown> = {};
    let pendingInsert: Row | Row[] | null = null;
    let pendingUpdate: Row | null = null;
    let upsertPayload: Row | Row[] | null = null;
    const api: Record<string, unknown> = {
      select() {
        state.selects! += 1;
        return api;
      },
      insert(payload: Row | Row[]) {
        pendingInsert = payload;
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
          const found =
            state.sources.find((s) => s.content_hash === filters.content_hash) ?? null;
          return { data: found, error: null };
        }
        if (table === "ingestion_runs" && filters.external_id) {
          return {
            data: state.runs.find((r) => r.external_id === filters.external_id) ?? null,
            error: null,
          };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "ingestion_runs" && pendingInsert && !Array.isArray(pendingInsert)) {
          const row = { id: `run-${state.runs.length + 1}`, ...pendingInsert };
          state.runs.push(row);
          return { data: { id: row.id }, error: null };
        }
        if (table === "knowledge_sources" && pendingInsert && !Array.isArray(pendingInsert)) {
          const row = {
            id: `src-${state.sources.length + 1}`,
            external_id: pendingInsert.external_id,
            ...pendingInsert,
          };
          state.sources.push(row);
          return { data: { id: row.id, external_id: row.external_id }, error: null };
        }
        if (
          table === "knowledge_source_extractions" &&
          pendingInsert &&
          !Array.isArray(pendingInsert)
        ) {
          return { data: { id: "ext-1" }, error: null };
        }
        return { data: null, error: { message: "unexpected" } };
      },
      then(resolve: (v: unknown) => void) {
        if (table === "knowledge_sources" && filters[`in:content_hash`]) {
          return resolve({
            data: state.sources.filter((s) =>
              (filters[`in:content_hash`] as string[]).includes(String(s.content_hash))
            ),
            error: null,
          });
        }
        if (table === "ingestion_run_items") {
          const row =
            (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ??
            (Array.isArray(pendingInsert) ? pendingInsert[0] : pendingInsert);
          if (row) {
            state.runItems.push(row as Row);
            return resolve({ data: row, error: null });
          }
          if (filters.run_id) {
            return resolve({
              data: state.runItems.filter((i) => i.run_id === filters.run_id),
              error: null,
            });
          }
          return resolve({ data: state.runItems, error: null });
        }
        if (table === "ingestion_runs" && pendingUpdate) {
          Object.assign(state.runs[0] ?? {}, pendingUpdate);
          return resolve({ data: state.runs[0], error: null });
        }
        if (table === "knowledge_retrieval_units" && Array.isArray(pendingInsert)) {
          return resolve({
            data: pendingInsert.map((_, i) => ({ id: `ru-${i}` })),
            error: null,
          });
        }
        if (table === "artifact_links" || table === "artifact_registry") {
          return resolve({ data: null, error: null });
        }
        return resolve({ data: [], error: null });
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

test("legacy .doc/.xls are preserve-only, not extractable", () => {
  assert.equal(extractionSupport("memo.doc"), "legacy_office");
  assert.equal(extractionSupport("book.xls"), "legacy_office");
  const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, ...Buffer.alloc(520)]);
  const classified = classifyFile({
    relativePath: "legacy/memo.doc",
    filename: "memo.doc",
    bytes: ole,
  });
  assert.equal(classified.handlingPath, "preserve_only_legacy_office");
});

test("unsupported files classify as preserve-only, not inventory-only", () => {
  const classified = classifyFile({
    relativePath: "x/note.xyz",
    filename: "note.xyz",
    bytes: Buffer.from("still preserve me"),
  });
  assert.equal(classified.handlingPath, "preserve_only_unsupported");
  assert.match(classified.classificationReason, /preserve/i);
});

test("dry-run makes zero ApexOS writes (no runs, sources, uploads)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-b19-dry-"));
  await writeFile(join(dir, "a.md"), "# A\n\nhello");
  await writeFile(join(dir, "note.xyz"), "unsupported");

  const state = {
    sources: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
    selects: 0,
  };
  setSupabaseForTests(createMock(state));

  const manifestPath = join(dir, "dry.manifest.json");
  const summary = await runBulkImport({
    rootPath: dir,
    dryRun: true,
    writeManifestPath: manifestPath,
  });

  assert.equal(summary.dryRun, true);
  assert.equal(summary.zeroWrites, true);
  assert.equal(state.sources.length, 0);
  assert.equal(state.runs.length, 0);
  assert.equal(state.runItems.length, 0);
  assert.equal(state.uploads, 0);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.schemaVersion, "build19-manifest-1.0");
  assert.equal(manifest.reconciled, false);
  assert.ok(manifest.items.length >= 2);

  setSupabaseForTests(null);
});

test("manifest hash mismatch blocks execute", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-b19-chg-"));
  const filePath = join(dir, "doc.md");
  await writeFile(filePath, "version-one");
  const { classified } = await inventoryAndClassify(dir);
  const manifest = buildManifest({
    rootPath: dir,
    classified,
    reconciled: true,
  });
  // Change file after manifest
  await writeFile(filePath, "version-two-changed");

  const verified = await verifyManifestHashes(manifest, (p) => readFile(p));
  assert.equal(verified.ok, false);
  if (!verified.ok) {
    assert.ok(verified.mismatches.length >= 1);
  }
});

test("same filename different hash creates new source without inferred replaces link", async () => {
  const state = {
    sources: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));

  const r1 = await ingestSource({
    filename: "report.md",
    bytes: Buffer.from("content-a"),
    ingestionMethod: "single_file",
  });
  const r2 = await ingestSource({
    filename: "report.md",
    bytes: Buffer.from("content-b"),
    ingestionMethod: "single_file",
  });

  assert.equal(r1.durableKnowledgeConfirmed, true);
  assert.equal(r2.durableKnowledgeConfirmed, true);
  assert.notEqual(r1.sourceExternalId, r2.sourceExternalId);
  assert.equal(state.sources.length, 2);
  assert.equal(state.sources[0].replaces_source_id, null);
  assert.equal(state.sources[1].replaces_source_id, null);
  assert.equal(r1.authorityDisplay, DEFAULT_AUTHORITY_DISPLAY);

  setSupabaseForTests(null);
});

test("preserve-only unsupported file can be stored when bytes present", async () => {
  const state = {
    sources: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createMock(state));

  const receipt = await ingestSource({
    filename: "mystery.xyz",
    bytes: Buffer.from("preserve-me-bytes"),
    ingestionMethod: "single_file",
    handlingPath: "preserve_only_unsupported",
  });

  assert.equal(receipt.originalStored, true);
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.retrievalReady, false);
  assert.equal(receipt.extractionStatus, "preserve_only");
  assert.equal(state.uploads, 1);
  assert.equal(state.sources.length, 1);

  setSupabaseForTests(null);
});

test("content hash helper remains stable", () => {
  assert.equal(contentHash(Buffer.from("x")), contentHash(Buffer.from("x")));
});
