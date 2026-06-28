# Schema Compatibility Report — Build 09 Acceptance

**Date:** 2026-06-28  
**Scope:** Compare Build 09 ingestion application against Build 08 Supabase schema  
**Schema source:** `supabase/migrations/20250628120000_apexos_schema.sql`, `supabase/SCHEMA-MAP.md`

## Executive Summary

All reported ingestion errors were caused by **application mapping mistakes**, not missing Build 08 columns. The hosted schema is correct. Minimum fixes were applied in `scripts/ingest/upsert.ts` only.

| Root cause category | Applies? |
|---------------------|----------|
| (1) Build 09 using incorrect column names | **Yes** |
| (2) Build 08 schema missing approved columns | **No** |
| (3) Mapping error between application and schema | **Yes** |

## Reported Errors vs Schema Truth

### 1. `executives.body_md`, `persons.body_md`, `relationships.body_md`, `situations.body_md`

| Table | Build 08 has `body_md`? | Application behavior (before fix) | Verdict |
|-------|-------------------------|-----------------------------------|---------|
| `executives` | No | Unconditionally set `body_md` in `mapRow()` | Incorrect column name |
| `persons` | No | Same | Incorrect column name |
| `relationships` | No | Same | Incorrect column name |
| `situations` | No | Same | Incorrect column name |

**Schema evidence:** Foundation tables (`executives`, `persons`, `relationships`, `situations`, `relationship_participants`, `artifact_registry`, `artifact_links`) store identity and linkage metadata only. Markdown bodies belong on pipeline, memory, and knowledge tables.

**SCHEMA-MAP.md:** Documents `body_md` as the markdown body column for tables that carry narrative content — not for foundation entities.

**Fix:** Gate `body_md` assignment behind `TABLES_WITH_BODY_MD` (25 tables that match Build 08).

### 2. `memory_artifacts.related_situation_id`

| Item | Build 08 column | Application behavior (before fix) | Verdict |
|------|-----------------|-----------------------------------|---------|
| Situation link on memory artifact | `situation_id` | Set `related_situation_id` from frontmatter `related_situation` | Mapping error |

**Schema evidence:**

```sql
-- memory_artifacts (Build 08)
situation_id uuid REFERENCES situations(id) ON DELETE SET NULL,
```

**SCHEMA-MAP.md (line 50):** `situation-memory.md` → `memory_artifacts` with `related_situation` frontmatter mapped to **`situation_id`**, not `related_situation_id`.

**Contrast:** `context_relevance_specs`, `context_evaluations`, and `observations` correctly use `related_situation_id` per schema.

**Fix:**
- Table-aware frontmatter resolution: `memory_artifacts` → `situation_id`; context/observation tables → `related_situation_id`.
- Added `memory_artifacts: { related_situation: "situation_id" }` to `resolveFkColumn()`.
- Removed incorrect `memory_artifacts` entry from `FK_FIELDS` that assumed `related_situation_id`.

## Tables Verified — No Schema Changes Required

| Area | Status |
|------|--------|
| Build 08 migration | Unchanged — 32 tables, approved columns intact |
| New migrations | None added |
| Architecture / doctrine | Unchanged |
| Repository structure | Unchanged |

## Post-Fix Compatibility

After fixes, live ingestion against hosted project `ahoabngdwnlcrdntmuqt`:

- **Ingested:** 5 new/updated rows (13 skipped — idempotent re-run)
- **Errors:** 0
- Foundation tables persist without `body_md`
- `memory_artifacts` situation link resolves to `situation_id`

## Conclusion

Build 08 schema implementation is complete and correct. Build 09 required two targeted mapping corrections in `upsert.ts` to align with approved column names documented in SCHEMA-MAP.md.
