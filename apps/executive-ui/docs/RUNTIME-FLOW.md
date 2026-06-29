# Runtime Flow — Executive Interface

## Canonical Loop (Unchanged)

The validated Build 09 runtime performs the full executive loop. Build 10 adds visibility and capture — not processing.

```
Situation
    ↓
Context (context_relevance_specs)
    ↓
Retrieval (retrieval_requests)
    ↓
Evidence Assembly (evidence_packages, assembled_context_packages)
    ↓
Inference (interpretation_packages, inference_components)
    ↓
Recommendation (recommendation_packages, recommendation_components)
    ↓
Decision (executive_decision_reference — external)
    ↓
Outcome (outcome_captures)
    ↓
Learning (learning_updates)
```

## UI Interaction Points

### Read Path

1. Executive opens situation by slug
2. `pipeline-service` resolves traceability chain via `related_situation_id`
3. Layer-specific services fetch artifacts:
   - `evidence-service` — assembly tiers, memory categories, contradictions
   - `reasoning-service` — inference and recommendation components
4. Components render each layer separately

### Write Path — Decision

1. Executive selects Accepted / Modified / Rejected
2. `decision-service` maps to `recommendation_followed`: followed | modified | rejected
3. Generates `executive_decision_reference` (DEC-EXT-*)
4. Creates or updates draft `outcome_captures` row
5. Optional reason stored in `decisions` table

### Write Path — Outcome

1. Executive enters action, observed outcome, consequences, metrics, learning notes
2. `outcome-service` updates `outcome_captures`
3. Status set to `captured` (validation/learning remain repository workflow)

### Write Path — Situation

1. Executive creates situation via form
2. `situation-service` inserts into `situations` table
3. Pipeline processing requires ingestion (Build 09 scripts) — UI does not orchestrate

## Historical Integrity

Terminal statuses (validated, delivered, handed_off, etc.) are read-only in the UI. Matches `scripts/ingest/integrity.ts` behavior.

## Verification Command

```bash
cd scripts && npm run loop:scenario
```

Must pass unchanged after Build 10 deployment.
