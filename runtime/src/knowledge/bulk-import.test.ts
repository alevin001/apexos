import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseForTests } from "../shared/supabase.js";
import { formatBulkSummary, runBulkImport } from "./bulk-import.js";
import { contentHash } from "./content-hash.js";

type Row = Record<string, unknown>;

function createBulkMock(state: {
  sources: Row[];
  runs: Row[];
  runItems: Row[];
  uploads: number;
}) {
  function from(table: string) {
    const filters: Record<string, unknown> = {};
    let pendingInsert: Row | Row[] | null = null;
    let pendingUpdate: Row | null = null;
    let upsertPayload: Row | Row[] | null = null;
    const api: Record<string, unknown> = {
      select() {
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
      in() {
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
        if (table === "knowledge_source_extractions" && pendingInsert && !Array.isArray(pendingInsert)) {
          return { data: { id: "ext-1" }, error: null };
        }
        return { data: null, error: { message: "unexpected" } };
      },
      then(resolve: (v: unknown) => void) {
        if (table === "ingestion_run_items") {
          const row = (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ??
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

test("bulk dry-run reports would_ingest without writing knowledge sources", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-bulk-"));
  await mkdir(join(dir, "docs"));
  await writeFile(join(dir, "docs", "a.md"), "# A\n\nhello");
  await writeFile(join(dir, "docs", "b.txt"), "build18-token");

  const state = {
    sources: [] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createBulkMock(state));

  const summary = await runBulkImport({ rootPath: dir, dryRun: true });
  assert.equal(summary.dryRun, true);
  assert.equal(summary.zeroWrites, true);
  assert.equal(summary.filesDiscovered, 2);
  assert.equal(summary.filesPending, 2);
  assert.equal(summary.filesIngested, 0);
  assert.equal(state.sources.length, 0);
  assert.equal(state.runs.length, 0);
  assert.equal(state.runItems.length, 0);
  assert.equal(state.uploads, 0);
  assert.ok(summary.items.every((i) => i.disposition === "would_ingest"));
  assert.match(formatBulkSummary(summary), /DRY RUN/);
  assert.match(formatBulkSummary(summary), /zero ApexOS writes/i);

  setSupabaseForTests(null);
});

test("bulk execute is resumable — completed items are skipped", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-bulk-resume-"));
  await writeFile(join(dir, "one.md"), "# One");
  await writeFile(join(dir, "two.md"), "# Two");

  const state = {
    sources: [] as Row[],
    runs: [
      {
        id: "run-1",
        external_id: "ING-resume-test",
        status: "running",
      },
    ] as Row[],
    runItems: [
      {
        run_id: "run-1",
        source_path: "one.md",
        disposition: "ingested",
      },
    ] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createBulkMock(state));

  const summary = await runBulkImport({
    rootPath: dir,
    dryRun: false,
    resumeRunExternalId: "ING-resume-test",
  });

  assert.ok(summary.filesSkipped >= 1);
  assert.ok(summary.items.some((i) => i.path === "one.md" && i.disposition === "skipped"));

  setSupabaseForTests(null);
});

test("bulk execute detects duplicates without deleting", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apexos-bulk-dup-"));
  const body = "duplicate-body";
  await writeFile(join(dir, "dup.md"), body);
  const hash = contentHash(Buffer.from(body));

  const state = {
    sources: [
      {
        id: "src-1",
        external_id: "SRC-dup",
        title: "Prior",
        content_hash: hash,
      },
    ] as Row[],
    runs: [] as Row[],
    runItems: [] as Row[],
    uploads: 0,
  };
  setSupabaseForTests(createBulkMock(state));

  const summary = await runBulkImport({ rootPath: dir, dryRun: false });
  assert.equal(summary.filesDuplicate, 1);
  assert.equal(summary.filesIngested, 0);
  assert.equal(state.sources.length, 1);

  setSupabaseForTests(null);
});
