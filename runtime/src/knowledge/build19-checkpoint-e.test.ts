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
import { retrieveKnowledgeUnits } from "./retrieve.js";
import { contentHash } from "./content-hash.js";
import { DEFAULT_AUTHORITY_DISPLAY } from "./types.js";
import { extractionSupport, defaultHandlingPath } from "./mime.js";
import { EML_PROCESS_VERSION, MSG_PROCESS_VERSION } from "./extractors/email-shared.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = resolve(__dirname, "../../../knowledge/import/seed-build19-e");

function fixture(rel: string): Buffer {
  const path = resolve(FIXTURE_ROOT, rel);
  assert.ok(existsSync(path), `missing fixture ${path} — run npm run knowledge:fixtures-e`);
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
        if (
          table === "knowledge_source_attachment_links" &&
          pendingInsert &&
          !Array.isArray(pendingInsert)
        ) {
          const row = { id: `atl-${state.attachLinks.length + 1}`, ...pendingInsert };
          state.attachLinks.push(row);
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
          for (const r of rows) state.links.push(r as Row);
          return resolveCb({ data: rows, error: null });
        }
        if (table === "knowledge_source_attachment_links" && pendingInsert) {
          const rows = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
          for (const r of rows) state.attachLinks.push({ id: `atl-${state.attachLinks.length + 1}`, ...r });
          return resolveCb({ data: rows, error: null });
        }
        if (table === "artifact_registry") {
          const row =
            (Array.isArray(upsertPayload) ? upsertPayload[0] : upsertPayload) ?? pendingInsert;
          if (row && !Array.isArray(row)) state.registry.push(row);
          return resolveCb({ data: row, error: null });
        }
        if (table === "knowledge_source_attachment_links" && filters.child_source_id) {
          return resolveCb({
            data: state.attachLinks.filter(
              (l) => l.child_source_id === filters.child_source_id
            ),
            error: null,
          });
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
    uploads: 0,
  };
}

test.afterEach(() => {
  setSupabaseForTests(null);
});

test("email extensions use email_message handling", () => {
  assert.equal(extractionSupport("a.eml"), "email_message");
  assert.equal(extractionSupport("a.msg"), "email_message");
  assert.equal(defaultHandlingPath("a.eml"), "email_message");
  assert.equal(defaultHandlingPath("mailbox.pst"), "deferred_mailbox_container");
});

test("multipart .eml separates plain, HTML-derived, quoted, headers, attachments", async () => {
  const result = await extractText({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
  });
  assert.equal(result.status, "extracted");
  assert.equal(result.method, "deterministic_eml");
  assert.equal(result.processVersion, EML_PROCESS_VERSION);
  assert.ok(result.units?.some((u) => u.locator?.label === "EML headers"));
  assert.ok(result.units?.some((u) => /EML plain-text body/.test(u.locator?.label ?? "")));
  assert.ok(result.units?.some((u) => /EML HTML-derived text/.test(u.locator?.label ?? "")));
  assert.ok(result.units?.some((u) => /EML quoted correspondence/.test(u.locator?.label ?? "")));
  assert.ok(result.derivatives?.some((d) => d.representationKind === "email_html"));
  assert.ok(result.derivatives?.some((d) => d.representationKind === "email_plain_text"));
  assert.equal(result.attachments?.length, 2);
  assert.ok(result.emailMetadata?.externalUrlsNoted?.length);
  assert.match(result.limitation ?? "", /not fetched/i);
});

test("exact duplicate .eml does not create second parent source", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const bytes = fixture("eml/multipart-with-attachments.eml");
  const r1 = await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes,
    ingestionMethod: "single_file",
  });
  const r2 = await ingestSource({
    filename: "multipart-with-attachments-duplicate.eml",
    bytes: fixture("eml/multipart-with-attachments-duplicate.eml"),
    ingestionMethod: "single_file",
  });
  assert.equal(r1.durableKnowledgeConfirmed, true);
  assert.equal(r2.claim, "duplicate");
  assert.equal(state.sources.filter((s) => s.source_type === "email").length, 1);
});

test("two parents share one child attachment via two visible links", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const r1 = await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  const r2 = await ingestSource({
    filename: "second-parent-shared-attachment.eml",
    bytes: fixture("eml/second-parent-shared-attachment.eml"),
    ingestionMethod: "single_file",
  });
  assert.equal(r1.durableKnowledgeConfirmed, true);
  assert.equal(r2.durableKnowledgeConfirmed, true);
  const sharedHash = contentHash(fixture("attachments/shared-note.txt"));
  const sharedChildren = state.sources.filter(
    (s) => s.content_hash === sharedHash && s.handling_path === "email_attachment_child"
  );
  assert.equal(sharedChildren.length, 1);
  const sharedLinks = state.attachLinks.filter((l) => l.content_hash === sharedHash);
  assert.equal(sharedLinks.length, 2);
  assert.ok(sharedLinks.some((l) => l.child_was_duplicate === true));
  assert.match(r2.attachmentCoverage?.summary ?? "", /exact-duplicate link/i);
});

test("same-named changed attachment creates a new child source", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  await ingestSource({
    filename: "changed-attachment-same-name.eml",
    bytes: fixture("eml/changed-attachment-same-name.eml"),
    ingestionMethod: "single_file",
  });
  const named = state.sources.filter((s) =>
    String(s.original_filename).includes("shared-note.txt")
  );
  assert.ok(named.length >= 2, "changed bytes must create a new child source");
  const hashes = new Set(named.map((s) => s.content_hash));
  assert.ok(hashes.size >= 2);
});

test("corrupt .eml is preserve-first blocked", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "corrupt-malformed.eml",
    bytes: fixture("eml/corrupt-malformed.eml"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.originalStored, true);
  assert.equal(receipt.retrievalReady, false);
  assert.match(
    formatReceiptPlainLanguage(receipt),
    /email extraction blocked; not retrieval-ready/i
  );
});

test("Outlook .msg sender is recovered or visibly unavailable (never fabricated)", async () => {
  const result = await extractText({
    filename: "outlook-with-attachment.msg",
    bytes: fixture("msg/outlook-with-attachment.msg"),
  });
  assert.equal(result.status, "extracted");
  const from = result.emailMetadata?.from;
  const unavailable = result.emailMetadata?.unavailableFields ?? [];
  if (from) {
    assert.ok(from.length > 0);
    assert.ok(!unavailable.includes("sender"));
  } else {
    assert.ok(unavailable.includes("sender"));
    assert.match(result.limitation ?? "", /sender unavailable/i);
    assert.match(
      result.units?.find((u) => u.locator?.label === "MSG properties")?.content ?? "",
      /From:\s*unavailable/i
    );
  }
});

test("Outlook .msg recovers body, recipients, and attachment lineage", async () => {
  const result = await extractText({
    filename: "outlook-with-attachment.msg",
    bytes: fixture("msg/outlook-with-attachment.msg"),
  });
  assert.equal(result.status, "extracted");
  assert.equal(result.processVersion, MSG_PROCESS_VERSION);
  assert.ok(result.units?.some((u) => u.locator?.label === "MSG properties"));
  assert.ok(result.units?.some((u) => /MSG body/.test(u.locator?.label ?? "")));
  assert.ok(result.units?.some((u) => u.content.includes("TOKEN-MSG-BODY")));
  assert.ok((result.attachments?.length ?? 0) >= 1);
  assert.ok(result.attachments?.[0]?.bytes.length);
  assert.ok(result.emailMetadata?.unavailableFields?.includes("html_body"));
  assert.match(result.limitation ?? "", /not fetched|URL/i);

  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "outlook-with-attachment.msg",
    bytes: fixture("msg/outlook-with-attachment.msg"),
    ingestionMethod: "single_file",
  });
  assert.equal(receipt.durableKnowledgeConfirmed, true);
  assert.equal(receipt.retrievalReady, true);
  assert.ok(state.attachLinks.length >= 1);
  assert.ok(state.sources.some((s) => s.handling_path === "email_attachment_child"));
  assert.match(
    formatReceiptPlainLanguage(receipt),
    /deterministic email extraction confirmed; retrieval-ready for confirmed email units/i
  );
});

test("truncated .msg reports honest parser failure limitations", async () => {
  const result = await extractText({
    filename: "truncated-corrupt.msg",
    bytes: fixture("msg/truncated-corrupt.msg"),
  });
  assert.ok(["failed", "blocked_corrupt"].includes(result.status));
  assert.match(result.limitation ?? "", /blocked|failed|unreadable|preserved/i);
});

test("external URL in email is noted and never fetched", async () => {
  const fetches: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetches.push(String(input));
    throw new Error("fetch must not be called during email extract");
  }) as typeof fetch;
  try {
    const result = await extractText({
      filename: "url-no-fetch.eml",
      bytes: fixture("eml/url-no-fetch.eml"),
    });
    assert.equal(result.status, "extracted");
    assert.ok(
      result.emailMetadata?.externalUrlsNoted?.some((u) =>
        u.includes("must-not-be-fetched-by-apexos")
      )
    );
    assert.equal(fetches.length, 0);
    assert.match(result.limitation ?? "", /not fetched/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("blocked unsupported attachment child has independent receipt language", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  const receipt = await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  assert.match(receipt.attachmentCoverage?.summary ?? "", /blocked/i);
  const unsupported = state.sources.find((s) =>
    String(s.original_filename).includes("unsupported.xyz")
  );
  assert.ok(unsupported);
  assert.equal(unsupported!.retrieval_ready, false);
  assert.equal(unsupported!.handling_path, "email_attachment_child");
});

test("retrieval + Glass Box for eml body, msg body, and attachment child", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  await ingestSource({
    filename: "outlook-with-attachment.msg",
    bytes: fixture("msg/outlook-with-attachment.msg"),
    ingestionMethod: "single_file",
  });

  const emlUnits = await retrieveKnowledgeUnits("TOKEN-EML-BODY-1 TOKEN-QUOTE-EML");
  assert.ok(emlUnits.length >= 1);
  assert.match(emlUnits[0].transformationNote, /deterministic email parsing/i);
  assert.equal(emlUnits[0].sourceCardInformed, false);
  assert.equal(emlUnits[0].authorityDisplay, DEFAULT_AUTHORITY_DISPLAY);

  const msgUnits = await retrieveKnowledgeUnits("TOKEN-MSG-BODY");
  assert.ok(msgUnits.length >= 1);
  assert.match(msgUnits[0].whyRetrieved, /Source card informed: no/i);

  const attUnits = await retrieveKnowledgeUnits("TOKEN-SHARED-ATTACH");
  assert.ok(attUnits.length >= 1);
  assert.ok((attUnits[0].parentEmailExternalIds?.length ?? 0) >= 1);
  assert.match(attUnits[0].transformationNote, /attachment child source|attachment links/i);

  const glass = buildGlassBox({
    runtimeId: "rt-e",
    conversationId: "c-e",
    contextPackageId: "cp-e",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-e",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "What did the email say?",
      continuity: {
        conversationId: "c-e",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-eml-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "multipart-with-attachments.eml",
            summary:
              "Authority: evidence/reference—authority unasserted. Locator: EML plain-text body, part 1.1, block 1. Extraction method: deterministic_eml_plain. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-eml",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "EML plain-text body, part 1.1, block 1",
            extractionMethod: "deterministic_eml_plain",
            materialLimitation: "Original plain-text body part — not HTML.",
            sourceCardInformed: false,
            whyRetrieved: "Matched TOKEN-EML-BODY-1",
            transformationNote: "Deterministic email plain text — not a finding.",
          },
          {
            id: "ru-att-1",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_subordinate",
            title: "shared-note.txt",
            summary:
              "Authority: evidence/reference—authority unasserted. Locator: text. Parent email(s) via attachment links: SRC-eml. Attachment relationship: child source (canonical junction). Extraction method: utf8. Source card informed: no.",
            epistemicType: "source_evidence",
            sourceExternalId: "SRC-att",
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "text offset / file",
            extractionMethod: "utf8",
            materialLimitation: "Attachment child of email; filename is metadata only.",
            sourceCardInformed: false,
            whyRetrieved: "Matched TOKEN-SHARED-ATTACH",
            transformationNote:
              "Excerpt is from attachment child source linked via knowledge_source_attachment_links.",
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "What did the email say?",
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
  const src = glass.stages.find((s) => s.stage === "source_evidence");
  assert.ok(src && src.count >= 2);
  const emlRec = src!.records.find((r) => r.id === "ru-eml-1");
  const attRec = src!.records.find((r) => r.id === "ru-att-1");
  assert.equal(emlRec?.sourceCardInformed, false);
  assert.equal(emlRec?.authorityStatus, DEFAULT_AUTHORITY_DISPLAY);
  assert.match(emlRec?.locator ?? "", /EML plain-text body/);
  assert.equal(attRec?.sourceCardInformed, false);
  assert.match(attRec?.summary ?? "", /attachment links|Parent email/i);
});

test("canonical junction returns both parent emails for one hash-deduplicated child", async () => {
  const state = emptyState();
  setSupabaseForTests(createMock(state));
  await ingestSource({
    filename: "multipart-with-attachments.eml",
    bytes: fixture("eml/multipart-with-attachments.eml"),
    ingestionMethod: "single_file",
  });
  await ingestSource({
    filename: "second-parent-shared-attachment.eml",
    bytes: fixture("eml/second-parent-shared-attachment.eml"),
    ingestionMethod: "single_file",
  });
  const sharedHash = contentHash(fixture("attachments/shared-note.txt"));
  const child = state.sources.find(
    (s) => s.content_hash === sharedHash && s.handling_path === "email_attachment_child"
  );
  assert.ok(child);
  const links = state.attachLinks.filter((l) => l.child_source_id === child!.id);
  assert.equal(links.length, 2);
  const parentExts = new Set(
    links.map((l) => {
      const p = state.sources.find((s) => s.id === l.parent_source_id);
      return p?.external_id as string;
    })
  );
  assert.equal(parentExts.size, 2);

  const ranked = await retrieveKnowledgeUnits("TOKEN-SHARED-ATTACH");
  assert.ok(ranked.length >= 1);
  assert.equal(ranked[0].parentEmailExternalIds?.length, 2);
  assert.match(
    ranked[0].transformationNote,
    /knowledge_source_attachment_links|parent email\(s\)/i
  );

  const glass = buildGlassBox({
    runtimeId: "rt-e-junction",
    conversationId: "c-ej",
    contextPackageId: "cp-ej",
    contextPackage: {
      version: "1.0",
      assembledAt: new Date().toISOString(),
      requestId: "rt-e-junction",
      executive: { slug: "primary-executive", displayName: "Andrew" },
      situation: null,
      executiveMessage: "Who attached the shared note?",
      continuity: {
        conversationId: "c-ej",
        priorMessages: [],
        priorSourceEvidence: [
          {
            id: "ru-shared",
            table: "knowledge_retrieval_units",
            type: "knowledge_source_excerpt_primary",
            title: "shared-note.txt",
            summary: `Authority: evidence/reference—authority unasserted. Parent email(s) via attachment links: ${[...parentExts].join(", ")}. Attachment relationship: child source (canonical junction). Source card informed: no.`,
            epistemicType: "source_evidence",
            sourceExternalId: String(child!.external_id),
            authorityDisplay: DEFAULT_AUTHORITY_DISPLAY,
            locatorLabel: "attachment child text",
            extractionMethod: "utf8",
            sourceCardInformed: false,
            whyRetrieved: "Matched TOKEN-SHARED-ATTACH",
            transformationNote: `linked via knowledge_source_attachment_links to parent email(s): ${[...parentExts].join(", ")}`,
          },
        ],
        savedObservations: [],
        findingsHypotheses: [],
        recommendations: [],
        people: [],
        currentMessage: "Who attached the shared note?",
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
  const rec = glass.stages.find((s) => s.stage === "source_evidence")?.records[0];
  assert.ok(rec);
  assert.match(rec!.summary ?? "", /Parent email\(s\) via attachment links/);
  for (const ext of parentExts) {
    assert.match(rec!.summary ?? "", new RegExp(String(ext).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
