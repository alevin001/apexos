# Runtime Fix Report — Build 09 Schema Compatibility

**Date:** 2026-06-28  
**Verification command:** `cd scripts && npm run loop:scenario`  
**Result:** **PASS** (exit code 0)

## Problem

Executive loop started successfully but ingestion failed with PostgREST/schema errors on:

- `executives.body_md`
- `persons.body_md`
- `relationships.body_md`
- `situations.body_md`
- `memory_artifacts.related_situation_id`

## Root Cause

`scripts/ingest/upsert.ts` `mapRow()` applied a one-size-fits-all row shape:

1. **`body_md` on every table** — foundation tables in Build 08 do not define this column.
2. **`related_situation_id` on every table with `related_situation` frontmatter** — `memory_artifacts` uses `situation_id` per SCHEMA-MAP.md.

## Changes Made

**File:** `scripts/ingest/upsert.ts` (minimum diff only)

| Change | Purpose |
|--------|---------|
| Added `TABLES_WITH_BODY_MD` set (25 tables) | Only persist markdown body where Build 08 defines `body_md` |
| Conditional `row.body_md = artifact.body` | Skip foundation tables (`executives`, `persons`, `relationships`, `situations`) |
| Table-aware `related_situation` resolution | `memory_artifacts` → `situation_id`; context/observation tables → `related_situation_id` |
| `resolveFkColumn` entry for `memory_artifacts` | `related_situation` → `situation_id` |
| Removed `memory_artifacts` from `FK_FIELDS` | Prevent default `${fmKey}_id` → `related_situation_id` |

No other files modified for this fix pass.

## Verification Run

```
[1/4] Ingestion — repository → Supabase
  Ingested: 5, Skipped: 13, Errors: 0

[2/4] Traceability — verify FK chain
  Chain: CTX-PKG-001 → ... → OUT-LRN-001

[3/4] Validation — executive loop checks
  All validations PASSED

[4/4] Reviews — architecture fidelity and build acceptance
  Architecture Fidelity: PASS
  Technical Review: PASS
  Executive Loop Validation: PASS
  Build Acceptance: PASS

EXECUTIVE LOOP: PASS
```

### Validation highlights

- Full pipeline chain complete through `OUT-LRN-001`
- 18 artifacts in `artifact_registry`, 0 orphan links
- Executive decision external reference `DEC-EXT-2026-Q2-001` preserved
- Learning update pending promotion (historical integrity intact)
- Knowledge storage linked: `transcript/SRC-001/sample-leadership-meeting.vtt`

## Environment Notes

- Hosted Supabase project `ahoabngdwnlcrdntmuqt` — online, schema applied
- TLS: scripts use `node --use-system-ca`; on Windows, ensure `NODE_OPTIONS=--use-system-ca` if child fetch calls fail (see `build/tls-diagnosis.md`)
- Service role key configured in `.env.local` (gitignored)

## What Was Not Changed

- No schema migrations
- No architecture or doctrine changes
- No repository structure changes
- No new concepts or tables

## Outcome

Schema compatibility restored. Executive scenario completes end-to-end against hosted Supabase.
