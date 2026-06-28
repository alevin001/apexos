# ApexOS Migration Plan

## Strategy

Build 08 uses **forward-only, versioned SQL migrations** in `supabase/migrations/`. Migrations are idempotent where possible (storage bucket inserts use `ON CONFLICT DO NOTHING`).

## Principles

1. **Repository-first** — schema derives from repository templates, not invented entities.
2. **Incremental builds** — future builds add migrations; never rewrite applied history.
3. **No triggers** — business rules live in application layer (Build 09+).
4. **Portable Postgres** — enums and JSONB over Supabase-specific types.
5. **Test locally first** — `supabase db reset` before `supabase db push`.

## Migration Set (Build 08)

| File | Version | Description |
|------|---------|-------------|
| `20250628120000_apexos_schema.sql` | 1.0 | Extensions, enums, all tables, indexes, foreign keys |
| `20250628120001_apexos_storage_rls.sql` | 1.0 | Storage buckets, RLS enablement, policies, grants |

## Dependency Order Within Schema Migration

```
1. Extensions + enums
2. Foundations (executives, persons, relationships, situations, decisions, patterns)
3. Knowledge tables
4. Memory tables (depends on foundations)
5. Context tables (depends on situations)
6. Retrieval tables (depends on context_relevance_specs)
   - Deferred FKs: context_relevance_specs.retrieval_request_id
   - Deferred FKs: retrieval_requests.evidence_package_id, assembled_context_package_id
7. Inference (depends on assembled_context_packages)
8. Recommendation (depends on interpretation_packages)
9. Outcomes (depends on recommendation_packages)
   - Deferred FKs: outcome_references → outcome_captures
   - Deferred FKs: outcome_captures → validation_packages
   - Deferred FKs: validation_packages → learning_updates
10. Cross-cutting (artifact_registry, artifact_links)
11. Indexes
```

## Circular Reference Handling

The context ↔ retrieval handoff creates optional back-links:

- `context_relevance_specs.retrieval_request_id` — populated after retrieval request created
- `retrieval_requests.evidence_package_id` — populated after evidence assembly
- `retrieval_requests.assembled_context_package_id` — populated after package delivery

These are nullable and populated during workflow execution, not at insert time of the context spec.

## Applying Migrations

### Local

```bash
supabase start
supabase db reset
```

### Remote

```bash
supabase link --project-ref <ref>
supabase db push
```

### Verify

```bash
supabase migration list
psql -c "\dt"  # list tables
```

## Rollback Policy

Supabase migrations are forward-only. To rollback:

1. Create a new migration that reverses changes.
2. Never delete or edit applied migration files.

For Build 08 initial deployment, rollback = drop project or restore from backup.

## Future Migration Guidelines (Build 09+)

| Change Type | Approach |
|-------------|----------|
| New column | `ALTER TABLE ... ADD COLUMN` with default |
| New table | New migration file |
| Enum value | `ALTER TYPE ... ADD VALUE` (Postgres 15+) |
| Index | `CREATE INDEX CONCURRENTLY` in new migration |
| RLS policy change | New migration altering policies |
| Breaking change | New migration + data migration script in `supabase/scripts/` |

## Schema Versioning

- `schema_version` column on artifact tables tracks mapping version (default `1.0`).
- Increment when column semantics change, not for additive columns.
- Document changes in migration file header comments.

## Pre-Push Checklist

- [ ] `supabase db reset` succeeds locally
- [ ] All tables have RLS enabled
- [ ] Storage buckets created
- [ ] No triggers, functions, or vector extensions added
- [ ] `SCHEMA-MAP.md` updated if columns changed
- [ ] Architecture fidelity review passed

## Build 09 Expected Migrations

Build 09 may add:

- `20250629*_ingestion_helpers.sql` — views for pipeline queries (with `security_invoker`)
- Seed data migration (optional, may use `supabase/seed.sql` instead)
- Application-specific indexes based on query patterns

No schema redesign expected unless architecture documents change.
