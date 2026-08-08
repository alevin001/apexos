# Build 18 — ApexOS Knowledge Base, Ingestion, and Daily Learning Workflow

**Status:** Implemented — local tests green; ChatGPT upload path requires live host validation  
**Date:** 2026-08-02  
**Depends on:** Build 17 executive interface & Glass Box  
**MCP version:** `0.18.0`  
**ChatGPT tools:** `apexos_conversation` (executive work) + `apexos_ingest_source` (governed ingestion)

## Intent

Create the simplest governed knowledge-base capability that lets ApexOS:

1. Ingest a large existing library efficiently (bulk dry-run + execute).
2. Ingest individual files into the durable system of record.
3. Work day to day when Andrew uploads or discusses new material in ChatGPT — without unsupported promises.
4. Preserve source fidelity, authority, traceability, and separation of evidence / interpretation / recommendations / decisions / outcomes.

This is **not** a generic RAG dump. Doctrine is not redefined.

## What Build 18 implemented

1. **One governed ingestion pipeline** (`runtime/src/knowledge/ingest.ts`) for bulk, single-file, and ChatGPT paths.
2. **Schema/storage additions** for source metadata, extractions, retrieval units, and ingestion runs.
3. **Bulk importer** with dry-run, duplicate detection (no deletes), failure reporting, and resumability.
4. **Single-file ingestion** with plain-language receipt.
5. **ChatGPT upload path** via `apexos_ingest_source` + `openai/fileParams`, with honest fallbacks.
6. **Knowledge retrieval stage** integrated into the runtime pipeline.
7. **Glass Box source display** for knowledge excerpts (authority, why retrieved, transformation note).
8. **Controlled seed set** under `knowledge/import/seed-controlled/` (not auto-ingested).

## Schema / storage changes

Migration: `supabase/migrations/20260802120000_build18_knowledge_ingestion.sql`

| Change | Purpose |
|--------|---------|
| Extend `knowledge_sources` | ingestion method/date, owner, authority, scope, extraction/processing/integrity status, content hash, original availability, retrieval ready, replaces link |
| `knowledge_source_extractions` | Derived extracted text — never the original |
| `knowledge_retrieval_units` | Chunked retrieval units with provenance (`derived_from` → source) |
| `ingestion_runs` / `ingestion_run_items` | Dry-run + execute receipts, resumability |
| Storage MIME allowlist | CSV, JSON, Excel added to `knowledge-source-material` |

Bucket remains private: `knowledge-source-material`.

## Supported and deferred source types

| Class | Types | Behavior |
|-------|-------|----------|
| **Extractable (v1)** | `.txt`, `.md`, `.markdown`, `.vtt`, `.csv`, `.json` | Store original + extract UTF-8 + create retrieval units |
| **Store + deferred extraction** | `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, images (png/jpeg/webp) | Original stored; extraction_status=`deferred` |
| **Unsupported** | other extensions / MIME | Failed with reason; no false “ingested” claim |

Deferred for later builds: PDF/DOCX/XLSX text extraction, OCR, embeddings/vectors, automatic authority promotion beyond `unverified`.

## Exact operator commands

Apply migration first (Supabase CLI or dashboard), then:

```powershell
cd runtime

# 1) Dry-run controlled seed set
npm run knowledge:ingest -- --dry-run --path ../knowledge/import/seed-controlled

# 2) Review the printed report (discovered / would_ingest / duplicates / failed)

# 3) Approved execute
npm run knowledge:ingest -- --execute --path ../knowledge/import/seed-controlled

# Single file
npm run knowledge:ingest-file -- --file ..\knowledge\import\seed-controlled\internal-documents\build18-ingestion-smoke.txt

# Resume a prior execute run
npm run knowledge:ingest -- --execute --path ../knowledge/import/seed-controlled --resume ING-YYYY-MM-DD-xxxxxxxx
```

Architecture documents are **not** auto-ingested. Optional deliberate seed: copy/edit `knowledge/import/architecture-seed.manifest.example.json`, point `--path` at `architecture/`, `--manifest` at the file, use `--authority architecture`, dry-run first.

## Day-to-day workflow (Andrew)

| Situation | Behavior |
|-----------|----------|
| Upload a new file in an ApexOS chat | ChatGPT **should** call `apexos_ingest_source` when ApexOS is selected; **not guaranteed** by the host. If no receipt appears, say **“Add this uploaded file to ApexOS.”** |
| Say “add this to ApexOS” | Ingest tool runs; return plain-language receipt + Glass Box hint |
| Discuss a situation without a file | Continue Build 17 `apexos_conversation` path |
| Ask about an ingested source | Runtime retrieves relevant units; Glass Box shows source-level trace |
| Correct / replace a source | Prior source preserved (`superseded`); new source linked |
| Source cannot be processed | Preserve what is safe; report limitation; no silent success |

**Hard rule:** ChatGPT project memory and transient chat attachments are **not** durable ApexOS knowledge unless `durableKnowledgeConfirmed=true` on an ingestion receipt.

## Confirmed ChatGPT-upload behavior / platform limits

| Question | Answer |
|----------|--------|
| Can MCP receive a ChatGPT-uploaded file? | **Yes, when the host injects** `file` via `_meta["openai/fileParams"]` with `download_url` + `file_id` (Apps / Developer Mode extension). |
| Automatic on upload? | **No.** Selecting ApexOS + attaching a file does not force a tool call. |
| Original vs text? | Original bytes when `download_url` is reachable; otherwise optional `textContent` fallback marked as derived. |
| If ChatGPT does not call the tool? | File is **not** in ApexOS. Use explicit phrase: “Add this uploaded file to ApexOS.” |
| If attachment inaccessible / too large / unsupported? | Receipt reports failure/limitation; no false ingested claim. |

## Tests

```powershell
cd runtime
npm test
npm run typecheck
```

Focused coverage:

- source/original persistence
- provenance links (extraction/units → source)
- duplicate detection
- failed storage / truthful status
- bulk dry-run, resume, duplicate reporting
- single-file receipt
- Glass Box source display
- separation of evidence vs derived content
- no unverified “ingested” claim
- ChatGPT attachment fallback behavior (controlled)

## Remaining limitations / recommended next build

- Live ChatGPT proof that `openai/fileParams` injects `download_url` for this connector (host-dependent).
- PDF/DOCX/XLSX extractors.
- Richer authority governance workflow (human review → elevate beyond `unverified`).
- Conflict inspection UI beyond Glass Box records.
- Optional operator diagnostic view with raw IDs.

**Recommended Build 19:** document extractors + authority review loop + live ChatGPT attachment certification checklist.
