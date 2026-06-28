# Build 09 Transition Package — End-to-End Executive Loop

**From:** Build 08 — Supabase Integration (Complete)  
**To:** Build 09 — End-to-End Executive Loop

## Build 08 Summary

Build 08 delivered:

- Complete Supabase schema (31 tables, 2 migrations)
- Storage buckets for knowledge source material
- RLS policies for single-executive MVP
- Full implementation documentation in `supabase/`
- Repository-to-schema mapping in `SCHEMA-MAP.md`

**Not yet implemented:** Ingestion scripts, application services, UI, or a runnable executive scenario.

## Build 09 Objectives

1. Implement repository → Supabase ingestion CLI
2. Enforce historical integrity in application layer
3. Execute one complete executive loop end-to-end:
   - Situation → Context → Retrieval → Inference → Recommendation → Decision (external) → Outcome → Validation → Learning
4. Verify full traceability chain in database
5. Seed minimal test scenario

## Prerequisites

- Supabase project (local or remote) with Build 08 migrations applied
- Environment configured per `supabase/ENVIRONMENT.md`
- At least one executive user in Supabase Auth

## Key Files to Reference

| File | Purpose |
|------|---------|
| `supabase/SCHEMA-MAP.md` | Field mapping for ingestion |
| `supabase/INGESTION.md` | Ingestion workflow and order |
| `supabase/SEEDING.md` | Minimal seed data |
| `governance/traceability/README.md` | Traceability chain requirements |
| `outcomes/governance/historical-integrity.md` | Immutability rules |
| `context/workflows/` | Context pipeline |
| `retrieval/workflows/` | Retrieval pipeline |
| `inference/workflows/` | Inference pipeline |
| `recommendation/workflows/` | Recommendation pipeline |
| `outcomes/workflows/outcome-pipeline-workflow.md` | Outcome pipeline |

## Suggested Build 09 Structure

```
scripts/
  ingest/
    index.ts              # CLI entry point
    parse-frontmatter.ts  # YAML + body parser
    map-artifact.ts       # Template → table mapper
    resolve-links.ts      # artifact_links resolver
    upsert.ts             # Idempotent database writes
    integrity.ts          # Historical integrity checks
  package.json
build/
  build-09-executive-loop.md
```

## Acceptance Criteria (Build 09)

- [ ] Ingestion CLI loads markdown artifacts from repository into Supabase
- [ ] One complete pipeline scenario exists in database with verifiable FK chain
- [ ] `artifact_registry` reflects ingested artifacts
- [ ] `artifact_links` resolve all frontmatter reference arrays
- [ ] Historical integrity enforced (terminal status rows not silently updated)
- [ ] Traceability query returns full chain from context spec to validation package
- [ ] Knowledge source binary uploaded to Storage with DB linkage
- [ ] Build outcome document and Build 10 transition package generated

---

## ChatGPT Prompt — Build 09

Copy and paste the following prompt to continue the implementation sequence:

```
# ApexOS Build 09 — End-to-End Executive Loop

You are implementing **Build 09** of the ApexOS MVP.

Build 08 (Supabase Integration) is complete. The schema, migrations, storage buckets, RLS policies, and implementation documentation exist in `supabase/`.

## Source of Truth Hierarchy

1. Project Charter
2. Architecture Documents
3. Approved Repository Implementation (Builds 01–07)
4. Technical Implementation (`supabase/` — Build 08)

If implementation conflicts with architecture, preserve architecture.
If architecture conflicts with doctrine, preserve doctrine.

The canonical processing flow must remain:
Knowledge → Memory → Context → Retrieval → Inference → Recommendation → Outcomes.

## Objectives

Implement the first runnable end-to-end executive loop:

1. **Ingestion CLI** — scripts that load repository markdown artifacts into Supabase per `supabase/INGESTION.md` and `supabase/SCHEMA-MAP.md`
2. **Historical integrity** — application-layer enforcement per `outcomes/governance/historical-integrity.md` (no silent updates to terminal-status rows; supersession via new rows)
3. **Test scenario** — one complete pipeline from situation through validation with verifiable traceability chain
4. **Storage integration** — upload at least one knowledge source binary to `knowledge-source-material` bucket
5. **Verification** — SQL queries proving full FK chain from `context_relevance_specs` to `validation_packages`

## Repository Deliverables

Create:
- `scripts/ingest/` — ingestion CLI (TypeScript preferred, use `@supabase/supabase-js`)
- `scripts/package.json` — dependencies
- `supabase/seed.sql` — optional minimal seed (or ingest from repo examples)
- `build/build-09-executive-loop.md` — build outcome document

Update:
- `readme.md` — Build 09 status
- `supabase/INGESTION.md` — if workflow details change during implementation

## Constraints

- Do not redesign schema unless a blocking gap is found (document and minimize changes)
- Do not add triggers, vectors, edge functions, or background jobs
- Use `service_role` key only in server-side ingestion scripts
- Preserve category separation: recommendations ≠ decisions ≠ outcomes
- Executive decisions remain external references only
- Append to `transformation_log`; never silent transformation (LAD-011)

## Ingestion Order

Follow dependency order in `supabase/INGESTION.md`:
Foundations → Knowledge → Memory → Context → Retrieval → Inference → Recommendation → Outcomes → artifact_links → artifact_registry

## Test Scenario

Create or ingest a minimal executive scenario (can use template content):
1. Situation: leadership conflict
2. Context relevance spec with domain weights
3. Retrieval request → evidence package → assembled context package
4. Interpretation package with at least one component
5. Recommendation package with at least one component
6. Outcome capture (action + observed outcome)
7. Validation package with learning update

## Required Reviews

After implementation completes, automatically perform:
1. Architecture Fidelity Review
2. Pipeline Integrity Review (full FK chain)
3. Ingestion Fidelity Review (frontmatter → columns)
4. Build Acceptance

Only recommend committing if every review passes.

Finally, generate the transition package for Build 10, including the next ChatGPT prompt that continues the implementation sequence automatically.

## Key Reference Files

- `supabase/SCHEMA-MAP.md`
- `supabase/INGESTION.md`
- `supabase/IMPLEMENTATION-GUIDE.md`
- `supabase/ENVIRONMENT.md`
- `build/build-08-supabase.md`
- `governance/traceability/README.md`
- `outcomes/governance/historical-integrity.md`
- All `*/templates/` for frontmatter field definitions
- All `*/workflows/` for pipeline execution order
```

---

## Notes for Build 09 Agent

- Run `supabase db reset` locally to verify migrations before ingestion development.
- Use `external_id` as the natural key for all upserts.
- Second-pass link resolution is expected for reference arrays that point to not-yet-ingested artifacts.
- The pipeline back-links (`context_relevance_specs.retrieval_request_id`, etc.) must be populated after child records exist.
