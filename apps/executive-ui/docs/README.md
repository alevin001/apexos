# ApexOS Executive UI

Build 10 executive interface — a thin web layer over the validated Supabase runtime.

## Purpose

Expose the executive loop without duplicating runtime logic:

```
Situation → Context → Retrieval → Evidence → Inference → Recommendation → Decision → Outcome → Learning
```

The UI reads pipeline artifacts from Supabase and captures executive decisions and outcomes. It does **not** perform inference, retrieval, context weighting, or recommendation generation.

## Quick Start

```bash
# From repo root — ensure .env.local has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
cd apps/executive-ui
npm install
npm run dev
```

Open http://localhost:3010

## Prerequisites

- Build 09 executive loop validated (`cd scripts && npm run loop:scenario`)
- Supabase migrations applied
- Repo root `.env.local` with Supabase credentials

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Executive Home — recent situations, follow ups, recommendations, outcomes |
| `/situations` | Create and list situations |
| `/situations/[slug]` | Situation workspace — pipeline overview and traceability |
| `/situations/[slug]/evidence` | Evidence viewer — layers displayed separately |
| `/situations/[slug]/reasoning` | Reasoning viewer — full inference pipeline |
| `/situations/[slug]/decision` | Decision capture — Accepted / Modified / Rejected |
| `/situations/[slug]/outcome` | Outcome capture |

## Architecture

See `docs/ARCHITECTURE.md`, `docs/RUNTIME-FLOW.md`, and `docs/UI-GOVERNANCE.md`.

## Runtime Boundary

Server-side API routes use the service role key (never exposed to the browser). All data access flows through `src/services/` — see `src/runtime/index.ts`.

## Reference Scenario

The leadership-conflict-q2 scenario (`scenarios/leadership-conflict-q2/`) provides end-to-end test data after ingestion.
