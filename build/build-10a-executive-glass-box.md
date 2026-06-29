# Build 10A — Executive Glass Box

**Date:** 2026-06-29  
**Status:** Complete

---

## Purpose

Transform ApexOS from a black box into a **Glass Box** — every recommendation exposes its complete reasoning pipeline to the executive without overwhelming them.

---

## Implementation

### Route

`/situations/[slug]/provenance` — accessible via **Glass Box** tab in situation workspace

### Service

`apps/executive-ui/src/services/provenance-service.ts`

- `getDecisionProvenance(slug)` — assembles 9-stage provenance from existing Supabase artifacts
- `getRuntimeObservability(slug)` — computes executive-facing runtime metrics

### Components

| Component | File | Role |
|-----------|------|------|
| `DecisionProvenancePipeline` | `GlassBoxStage.tsx` | Full expandable pipeline |
| `GlassBoxStage` | `GlassBoxStage.tsx` | Individual stage with Q&A, artifacts, log |
| `RuntimeObservabilityBar` | `RuntimeObservabilityBar.tsx` | Metrics bar |

### Pipeline Stages

```
Situation → Context → Retrieval → Evidence → Interpretation → Recommendation → Decision → Outcome → Learning
```

Each stage provides:
- Summary (executive one-liner)
- Explainability Q&A (answers executive questions)
- Artifact content (body_md)
- Component artifacts (expandable)
- Transformation log (audit trail)
- Deep link to detailed viewer (Evidence, Reasoning, Decision, Outcome)

---

## Architecture Fidelity

- Reads existing FK chain via `queryTraceabilityChainForSituation`
- No inference, retrieval, or recommendation generation in UI
- No schema changes
- No doctrine or architecture modifications
- Faithfully reflects Build 08 schema and Build 09 runtime

See `build/build-10a-architecture-review.md` for full architecture review.

---

## Screenshots

| File | Description |
|------|-------------|
| `build/screenshots/10a/glass-box-provenance.png` | Glass Box with expanded Recommendation stage |
| `build/screenshots/10a/situation-overview-observability.png` | Overview with observability bar and pipeline |

---

## Related Documents

- `build/build-10a-operational-readiness-report.md`
- `build/build-10a-acceptance-checklist.md`
- `build/build-10a-product-experience.md`
- `apps/executive-ui/docs/README.md`
