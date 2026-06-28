# ApexOS Ingestion Flow

Build 09 implements the repository → Supabase ingestion pipeline specified in `supabase/INGESTION.md`.

## Overview

```
Git Repository (markdown artifacts)
  ↓ parse-frontmatter.ts
YAML frontmatter + body_md
  ↓ map-artifact.ts
Table mapping + column values
  ↓ upsert.ts (with integrity.ts)
Supabase records
  ↓ resolve-links.ts
artifact_links + pipeline backfill
  ↓ register
artifact_registry
```

Git remains source control. Supabase is the runtime system of record.

## Ingestion Order

The scenario manifest (`scenarios/*/manifest.json`) defines dependency order:

```
1. Foundations (executives, persons, relationships, situations)
2. Knowledge sources (+ storage upload)
3. Memory artifacts
4. Context relevance specs
5. Retrieval (request → evidence → assembled context)
6. Inference (components → package)
7. Recommendation (components → package)
8. Outcomes (capture → validation components → validation → learning)
9. artifact_links (second pass)
10. artifact_registry
11. Pipeline backfill (parent FK columns)
```

## Per-Artifact Pipeline

### 1. Parse

`parse-frontmatter.ts` splits `---` YAML frontmatter from markdown body.

### 2. Detect Table

`map-artifact.ts` routes artifacts to tables by path pattern and frontmatter:

| Signal | Table |
|--------|-------|
| `foundations/executive.md` | `executives` |
| `*.meta.md` | `knowledge_sources` |
| `category: situation` | `memory_artifacts` |
| `domain_weights` | `context_relevance_specs` |
| `ret-req-*` | `retrieval_requests` |
| `inf-int-*` | `interpretation_packages` |
| `inf-evd-*` | `inference_components` |
| `rec-pkg-*` | `recommendation_packages` |
| `out-cap-*` | `outcome_captures` |
| `val-pkg-*` | `validation_packages` |

Full mapping: `supabase/SCHEMA-MAP.md`

### 3. Map Columns

- Frontmatter fields → snake_case columns
- Body → `body_md`
- Slug references → FK lookups (`persons.slug`, `situations.slug`)
- Path references → deferred UUID resolution

### 4. Integrity Check

`integrity.ts` enforces historical integrity before write:

| Existing status | Action |
|-----------------|--------|
| Not found | Insert |
| Non-terminal | Update with appended log |
| Terminal, same status | Skip (preserve history) |
| Terminal, different status | Supersede (new row required) |

### 5. Upsert

Idempotent upsert on `external_id`. Append to `transformation_log` — never replace silently.

### 6. Storage Upload

Knowledge sources with `source_file` upload to:

```
knowledge-source-material/{type}/{external_id}/{filename}
```

Sets `knowledge_sources.storage_object_path`.

### 7. Link Resolution

Reference arrays in frontmatter become `artifact_links` rows. Unresolved targets queue for second pass after all artifacts ingested.

### 8. Pipeline Backfill

Parent tables receive back-links after child records exist:

- `context_relevance_specs.retrieval_request_id`
- `retrieval_requests.evidence_package_id`
- `retrieval_requests.assembled_context_package_id`
- `outcome_captures.related_validation_package_id`
- `validation_packages.learning_promoted_id`

## CLI Usage

```bash
cd scripts
npm install
npm run ingest:scenario                    # default: leadership-conflict-q2
npm run ingest -- --scenario my-scenario   # custom scenario
```

## Validation After Ingestion

| Check | Command |
|-------|---------|
| Pipeline chain | `npm run trace` |
| Full validation | `npm run validate` |
| Complete loop | `npm run loop:scenario` |

## Error Handling

| Error | Action |
|-------|--------|
| Missing FK target | Log warning; queue for second-pass link resolution |
| Duplicate external_id | Skip or supersede per integrity rules |
| Invalid enum value | Fail artifact; log for manual review |
| Terminal status conflict | Skip update; log supersession requirement |

## Related Files

| File | Purpose |
|------|---------|
| `scripts/ingest/index.ts` | CLI entry point |
| `scripts/ingest/pipeline.ts` | Scenario ingestion orchestrator |
| `scripts/ingest/parse-frontmatter.ts` | Markdown parser |
| `scripts/ingest/map-artifact.ts` | Table routing |
| `scripts/ingest/upsert.ts` | Database writes |
| `scripts/ingest/integrity.ts` | Historical integrity |
| `scripts/ingest/resolve-links.ts` | Link resolution + backfill |
| `supabase/SCHEMA-MAP.md` | Column mapping reference |
| `supabase/INGESTION.md` | Canonical ingestion specification |
