# Executive UI Architecture

## Layer Mapping

| UI Surface | Architecture Layer | Responsibility |
|------------|-------------------|----------------|
| Executive Home | Cross-layer read | Aggregate recent artifacts |
| Situation Workspace | Foundations | Situation CRUD, pipeline navigation |
| Evidence Viewer | Retrieval + Context + Memory | Display retrieval package by category |
| Reasoning Viewer | Inference + Recommendation | Display reasoning pipeline layers |
| Decision Capture | Outcomes (external decision) | Record executive_decision_reference |
| Outcome Capture | Outcomes | Record action, results, learning |

## Interface Responsibilities

**The UI may:**

- Read artifacts from Supabase via server services
- Create new situations (foundations layer)
- Archive situations
- Record executive decisions as external references on outcome captures
- Record outcome captures linked to recommendation packages
- Display traceability chains

**The UI may not:**

- Run inference or generate recommendations
- Assemble context or weight domains
- Retrieve or rank evidence
- Learn patterns or recalibrate confidence
- Modify terminal-status artifacts (historical integrity)

## Data Flow

```
Browser (React)
    ↓ fetch
API Routes (Next.js server)
    ↓
Services (src/services/)
    ↓
Supabase (Postgres) ← validated by scripts/ runtime
```

Build 09 runtime (`scripts/`) remains the authoritative ingestion and validation path. The UI does not replace `scripts/loop/executive-loop.ts`.

## Component Structure

```
apps/executive-ui/
  src/
    app/           # Pages and API routes
    components/    # Presentational UI
    hooks/         # Client-side utilities
    services/      # Supabase read/write (server-only)
    runtime/       # Runtime boundary declarations
    types/         # Executive domain types
  docs/            # Interface documentation
```

## Traceability

Every situation workspace displays the FK chain:

Context Spec → Retrieval Request → Evidence → Assembled Context → Interpretation → Recommendation → Outcome → Validation → Learning

Nothing is collapsed into a single answer. Evidence and reasoning remain in separate views.

## Portability

- No auth UI in Build 10 (per build spec)
- Service role used server-side only
- No framework-specific business logic in components
- Services map 1:1 to Supabase tables per SCHEMA-MAP.md
