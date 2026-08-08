# ApexOS Ingestion Workflow

## Purpose

Describe how repository markdown artifacts (Builds 02–07) are loaded into Supabase while preserving traceability and historical integrity.

Build 08 defines the schema. **Build 09 implements ingestion scripts.** This document specifies the workflow both builds follow.

## Principles

1. **Git remains source control** — Supabase is the runtime system of record.
2. **Frontmatter drives columns** — parse YAML; map per `SCHEMA-MAP.md`.
3. **Body → `body_md`** — markdown content below frontmatter.
4. **References → `artifact_links`** — resolve paths to UUIDs via `artifact_registry`.
5. **Append-only logs** — merge new entries into `transformation_log`, never silent overwrite.
6. **Idempotent upsert** — use `external_id` as natural key.

## Ingestion Order

Respect foreign key dependencies:

```
1. executives, persons, relationships, situations
2. knowledge_sources (+ storage upload for binaries)
3. frameworks, concepts, knowledge_references
4. decisions, patterns (foundation records)
5. observations
6. memory_artifacts (all categories)
7. promotion_records, outcome_references
8. context_evaluations, context_relevance_specs
9. retrieval_requests → evidence_packages → assembled_context_packages
10. interpretation_packages → inference_components
11. recommendation_packages → recommendation_components
12. outcome_captures → validation_packages → outcome_components
13. learning_updates, reinforcement_updates
14. artifact_links (resolve all reference arrays)
15. artifact_registry (register all ingested records)
```

## Per-Artifact Steps

### 1. Parse

```yaml
# Read file from repository path
# Split frontmatter (---) from body
# Parse YAML to dict
```

### 2. Map

Apply `SCHEMA-MAP.md` field mapping:

- Snake_case column names
- Enum validation (confidence, category, domain, component_type)
- Date fields → ISO date
- Arrays of paths → deferred link creation

### 3. Resolve Foundation FKs

| Frontmatter field | Resolution |
|-------------------|------------|
| `person_slug` | Lookup `persons.slug` |
| `related_situation` | Lookup `situations.slug` or external_id |
| `participants[]` | Lookup `persons.slug` → `relationship_participants` |

### 4. Upsert Record

```sql
INSERT INTO memory_artifacts (external_id, category, title, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (external_id) DO UPDATE SET
  updated_at = now(),
  -- only non-terminal fields if status allows
  body_md = EXCLUDED.body_md;
```

**Historical integrity:** If existing row has terminal status, skip update; create superseding row instead.

### 5. Register

```sql
INSERT INTO artifact_registry (external_id, title, architecture_layer, table_name, record_id, repository_path, status)
VALUES (...);
```

### 6. Create Links

For each reference in frontmatter arrays:

```sql
INSERT INTO artifact_links (source_table, source_id, target_table, target_id, link_type, tier)
VALUES ('memory_artifacts', $source_uuid, 'knowledge_sources', $target_uuid, 'originating_knowledge', NULL);
```

Resolve targets via `artifact_registry.external_id` or repository path.

### 7. Upload Binaries (Knowledge Only)

For `knowledge/source_material/` files:

1. Upload to `knowledge-source-material/{type}/{external_id}/{filename}`
2. Set `knowledge_sources.storage_object_path`

## Pipeline Ingestion

When ingesting a complete executive scenario, maintain FK chain:

```
context_relevance_specs.id
  → retrieval_requests.context_reference_id
  → evidence_packages.retrieval_request_id
  → assembled_context_packages.evidence_package_id
  → interpretation_packages.assembled_context_package_id
  → recommendation_packages.interpretation_package_id
  → outcome_captures.recommendation_package_id
  → validation_packages.outcome_capture_id
```

Back-populate optional links after child records exist:

- `context_relevance_specs.retrieval_request_id`
- `retrieval_requests.evidence_package_id`
- `retrieval_requests.assembled_context_package_id`
- `outcome_captures.related_validation_package_id`
- `validation_packages.learning_promoted_id`

## Transformation Log

On any derived or updated content:

```json
{
  "date": "2026-06-28",
  "action": "ingested_from_repository",
  "rationale": "Build 09 initial sync",
  "actor": "ingestion-script",
  "source_path": "memory/person/jane-smith.md"
}
```

Append to existing array; never replace silently (LAD-011).

## Validation After Ingestion

| Check | Query |
|-------|-------|
| Registry complete | Count `artifact_registry` vs repo INDEX files |
| Orphan links | `artifact_links` with missing target in registry |
| Pipeline chain | Join query from context spec to validation package |
| Storage linkage | `knowledge_sources.storage_object_path IS NOT NULL` for binaries |

## Build 09 Deliverables

- `scripts/ingest/` — TypeScript ingestion CLI (implemented)
- `scripts/loop/` — traceability, validation, and review engines
- `scenarios/leadership-conflict-q2/` — complete executive scenario
- `supabase/seed.sql` — optional foundation seed
- See `INGESTION-FLOW.md` for pipeline documentation

## Build 18 — Governed knowledge source ingestion

Build 09 syncs repository markdown artifacts into pipeline tables.  
Build 18 adds a separate governed path for **primary source files** (bulk folder/manifest, single file, ChatGPT attachment):

- Migration: `migrations/20260802120000_build18_knowledge_ingestion.sql`
- Runtime CLI: `cd runtime && npm run knowledge:ingest -- --dry-run --path <folder>`
- Spec: `build/build-18-knowledge-base-ingestion.md`

Originals go to Storage bucket `knowledge-source-material`. Extractions text and retrieval units are separate tables — never represented as the original source.

## Error Handling

| Error | Action |
|-------|--------|
| Missing FK target | Log warning; queue for second-pass link resolution |
| Duplicate external_id | Skip or supersede per historical integrity rules |
| Invalid enum value | Fail artifact; log for manual review |
| Terminal status conflict | Create new row with supersession link |

## Related Documentation

- `SCHEMA-MAP.md` — column mapping
- `SEEDING.md` — minimal seed data
- `governance/traceability/README.md` — traceability requirements
