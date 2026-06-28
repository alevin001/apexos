# ApexOS Supabase Implementation Guide

## Overview

Build 08 translates the ApexOS markdown repository into Supabase Postgres. The schema mirrors repository templates and frontmatter fields without redesigning architecture.

## Design Principles

1. **Repository fidelity** — YAML frontmatter fields map to columns; markdown body stored in `body_md`.
2. **Reference, don't duplicate** — cross-artifact links use `artifact_links` and foreign keys, not copied content.
3. **Append-only traceability** — `transformation_log` (JSONB array) records all derivations; historical records supersede via `artifact_registry.superseded_by_id`.
4. **Category separation** — distinct tables per pipeline stage; recommendations ≠ decisions ≠ outcomes.
5. **Portability** — standard Postgres types; minimal Supabase-specific features beyond Auth, Storage, and RLS.

## Deployment

### Local Development

```bash
cd /path/to/ApexOS
supabase start
supabase db reset
```

Verify:

```bash
supabase db diff   # should show no drift after reset
```

### Remote Deployment

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Link: `supabase link --project-ref <ref>`
3. Push migrations: `supabase db push`
4. Configure environment variables (see `ENVIRONMENT.md`).
5. Create storage buckets if not applied by migration (migration `20250628120001` inserts them).

### Migration Order

| Migration | Contents |
|-----------|----------|
| `20250628120000_apexos_schema.sql` | Enums, tables, indexes, FKs |
| `20250628120001_apexos_storage_rls.sql` | Storage buckets, RLS policies |

## Table Organization

### Foundations (core objects)

- `executives`, `persons`, `relationships`, `relationship_participants`
- `situations`, `decisions`, `patterns`

### Knowledge

- `knowledge_sources`, `frameworks`, `concepts`, `knowledge_references`

### Memory

- `observations`, `memory_artifacts`, `promotion_records`, `outcome_references`

### Context

- `context_evaluations`, `context_relevance_specs`

### Retrieval

- `retrieval_requests`, `evidence_packages`, `contradictory_evidence_records`, `assembled_context_packages`

### Inference

- `interpretation_packages`, `inference_components`

### Recommendation

- `recommendation_packages`, `recommendation_components`

### Outcomes

- `outcome_captures`, `validation_packages`, `outcome_components`, `learning_updates`, `reinforcement_updates`

### Cross-cutting

- `artifact_registry` — replaces layer `INDEX.md` files digitally
- `artifact_links` — polymorphic traceability junction

## Traceability Columns

Every persistent artifact table includes:

| Column | Purpose |
|--------|---------|
| `architecture_layer` | Layer name (knowledge, memory, context, etc.) |
| `repository_path` | Template or artifact path in Git repo |
| `source_document` | Authoritative architecture document |
| `schema_version` | Schema mapping version (default `1.0`) |
| `transformation_log` | Append-only JSONB audit trail |
| `external_id` | Human-readable ID (e.g. `MEM-PER-001`, `REC-PKG-001`) |
| `created_at` / `updated_at` | Timestamps |

Confidence-bearing tables also include `confidence` or `confidence_summary` where templates specify it.

## Historical Integrity

The database does not enforce immutability with triggers. Application logic (Build 09+) must:

1. Refuse updates to rows with terminal status (`complete`, `delivered`, `validated`, `archived`).
2. Create new rows and set `artifact_registry.superseded_by_id` for corrections.
3. Append to `transformation_log` on any permitted change.

## Component Artifacts

Inference, recommendation, and outcome components share a pattern:

- Parent package table holds the primary artifact.
- `*_components` child tables hold typed components (`component_type` enum).
- `artifact_links` connects components to evidence, doctrine, and memory references.

## Querying the Pipeline

Example: full traceability chain for a validation package:

```sql
SELECT
  vp.external_id AS validation,
  oc.external_id AS outcome_capture,
  rp.external_id AS recommendation,
  ip.external_id AS interpretation,
  acp.external_id AS context_package,
  rr.external_id AS retrieval_request,
  crs.external_id AS context_spec
FROM validation_packages vp
JOIN outcome_captures oc ON oc.id = vp.outcome_capture_id
JOIN recommendation_packages rp ON rp.id = vp.recommendation_package_id
JOIN interpretation_packages ip ON ip.id = rp.interpretation_package_id
JOIN assembled_context_packages acp ON acp.id = ip.assembled_context_package_id
JOIN retrieval_requests rr ON rr.id = acp.retrieval_request_id
JOIN context_relevance_specs crs ON crs.id = rr.context_reference_id
WHERE vp.external_id = 'OUT-VAL-001';
```

## What Build 09 Adds

- Ingestion scripts (markdown → database)
- Application services for the executive loop
- Historical integrity enforcement in application layer
- First end-to-end scenario execution

## References

- `SCHEMA-MAP.md` — field-level mapping
- `MIGRATION-PLAN.md` — migration strategy
- `INGESTION.md` — ingestion workflow
- `SECURITY.md` — RLS model
- `governance/traceability/README.md` — traceability requirements
