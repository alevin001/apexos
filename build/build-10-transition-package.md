# Build 10 Transition Package — Application Layer & Executive Interface

**From:** Build 09 — End-to-End Executive Loop (Complete)  
**To:** Build 10 — Application Layer & Executive Interface

## Build 09 Summary

Build 09 delivered:

- Complete ingestion pipeline (`scripts/ingest/`)
- Traceability, validation, and review engines (`scripts/loop/`)
- One complete executive scenario (`scenarios/leadership-conflict-q2/`)
- Full documentation (`EXECUTIVE-LOOP.md`, `TRACEABILITY.md`, `INGESTION-FLOW.md`)
- Historical integrity enforcement in application layer
- Knowledge source storage integration

**Verified flow:** Situation → Context → Retrieval → Evidence → Inference → Recommendation → Decision (external) → Outcome → Validation → Learning

## Build 10 Objectives

1. **Executive interface** — minimal web UI or CLI for executive interaction
2. **Pipeline orchestration** — trigger context → retrieval → inference → recommendation programmatically
3. **Auth integration** — connect Supabase Auth to executive user
4. **Real-time scenario execution** — run new situations through the loop without manual artifact creation
5. **Memory promotion workflow** — implement learning → memory promotion from `OUT-LRN-001` pattern
6. **CI/CD** — GitHub Actions for migration push and ingestion validation

## Prerequisites

- Build 09 executive loop passing locally (`npm run loop:scenario`)
- Supabase project with migrations applied
- Executive user in Supabase Auth
- Node.js 18+ installed

## Key Files to Reference

| File | Purpose |
|------|---------|
| `EXECUTIVE-LOOP.md` | Executive loop architecture |
| `TRACEABILITY.md` | Traceability requirements |
| `INGESTION-FLOW.md` | Ingestion pipeline |
| `scripts/loop/executive-loop.ts` | Loop runner pattern |
| `scenarios/leadership-conflict-q2/` | Reference scenario |
| `supabase/SECURITY.md` | RLS and auth model |
| `technical_architecture/` | Technical architecture v0.1 |

## Suggested Build 10 Structure

```
app/                          # Next.js or similar executive interface
  src/
    lib/supabase.ts           # Browser client (anon key)
    services/
      context-service.ts      # Context assembly
      retrieval-service.ts    # Evidence retrieval orchestration
      inference-service.ts    # Interpretation generation
      recommendation-service.ts
      outcome-service.ts
    pages/ or app/            # Executive views
.github/workflows/
  apexos-ci.yml               # Migration + validation CI
```

## Acceptance Criteria (Build 10)

- [ ] Executive can view current situation context via UI
- [ ] Pipeline can be triggered for a new situation (not just pre-built scenario)
- [ ] Auth gates access to executive data (RLS + authenticated user)
- [ ] Learning promotion workflow creates new memory artifact from validated learning
- [ ] CI runs ingestion + validation on pull request
- [ ] Build outcome document and Build 11 transition package generated

---

## ChatGPT Prompt — Build 10

Copy and paste the following prompt to continue the implementation sequence:

```
# ApexOS Build 10 — Application Layer & Executive Interface

You are implementing **Build 10** of the ApexOS MVP.

Build 09 (End-to-End Executive Loop) is complete. The ingestion pipeline, traceability engine, validation engine, and one complete executive scenario exist and are documented.

## Source of Truth Hierarchy

1. Project Charter
2. Architecture Documents
3. Approved Repository Implementation (Builds 01–09)
4. Technical Implementation (`supabase/` — Build 08, `scripts/` — Build 09)

If implementation conflicts with architecture, preserve architecture.
If architecture conflicts with doctrine, preserve doctrine.

The canonical processing flow must remain:
Knowledge → Memory → Context → Retrieval → Inference → Recommendation → Decision (external) → Outcome → Validation → Learning.

## Objectives

1. **Executive interface** — minimal web UI for viewing situations, recommendations, and outcomes
2. **Pipeline orchestration services** — programmatic layer services that wrap ingestion patterns for live execution
3. **Supabase Auth integration** — executive user authentication with RLS
4. **Memory promotion workflow** — implement learning → memory promotion per `memory/workflows/promote-to-memory.md`
5. **CI/CD** — GitHub Actions validating migrations and executive loop on PR

## Repository Deliverables

Create:
- `app/` — executive interface (Next.js recommended with @supabase/ssr)
- `.github/workflows/apexos-ci.yml` — CI pipeline
- `build/build-10-application-layer.md` — build outcome document

Update:
- `readme.md` — Build 10 status
- `supabase/SECURITY.md` — if auth patterns change

## Constraints

- Do not redesign schema unless blocking gap found
- Do not merge architectural layers in UI (separate views per layer)
- Preserve historical integrity — UI read-only for terminal-status artifacts
- Executive decisions remain external references
- Use anon key in browser; service_role only in server/CI
- Reuse `scripts/loop/validation.ts` checks in CI

## Reference Scenario

Use `scenarios/leadership-conflict-q2/` as the test case. CI must run:
```
cd scripts && npm install && npm run loop:scenario
```

## Required Reviews

After implementation completes, automatically perform:
1. Architecture Fidelity Review
2. Security Review (RLS, key exposure)
3. Executive Loop Validation (CI + manual)
4. Build Acceptance

Only recommend committing if every review passes.

Finally, generate the transition package for Build 11, including the next ChatGPT prompt that continues the implementation sequence automatically.

## Key Reference Files

- `EXECUTIVE-LOOP.md`
- `TRACEABILITY.md`
- `INGESTION-FLOW.md`
- `build/build-09-end-to-end.md`
- `scripts/loop/executive-loop.ts`
- `supabase/SECURITY.md`
- `supabase/ENVIRONMENT.md`
- `memory/workflows/promote-to-memory.md`
- `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx`
```

---

## Cursor Prompt — Build 10

```
Implement Build 10 of ApexOS MVP: Application Layer & Executive Interface.

Build 09 is complete — ingestion pipeline, validation engine, and leadership-conflict-q2 scenario exist in scripts/ and scenarios/.

Deliver:
1. Minimal executive web UI (Next.js + Supabase SSR)
2. Pipeline orchestration services wrapping the canonical flow
3. Auth integration with existing RLS policies
4. Memory promotion workflow for learning updates
5. GitHub Actions CI running npm run loop:scenario
6. build/build-10-application-layer.md and build/build-11-transition-package.md

Preserve: doctrine, architecture layers, historical integrity, traceability.
Do not redesign schema. Do not merge layers.

Reference: EXECUTIVE-LOOP.md, build/build-10-transition-package.md
Run all four required reviews before recommending commit.
```

## Notes for Build 10 Agent

- Start by running `cd scripts && npm install && npm run loop:scenario` to verify Build 09 baseline.
- The ApexOS Supabase project may need to be resumed from inactive state in Supabase dashboard.
- RLS policies from Build 08 assume single-executive MVP — extend carefully for auth.
- UI should display traceability chain but not allow editing terminal-status artifacts.
