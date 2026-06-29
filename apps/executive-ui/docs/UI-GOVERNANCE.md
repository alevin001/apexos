# UI Governance

## Doctrine Alignment

The executive interface follows ApexOS governance principles:

- **Explainability** — every reasoning layer visible, never collapsed
- **Transparency** — traceability chain displayed on every situation
- **Separation** — evidence categories and architectural layers never merged
- **Historical integrity** — terminal artifacts are read-only

## Category Boundaries

| View | Must Not Merge |
|------|----------------|
| Evidence Viewer | Executive / Person / Relationship memory, Knowledge, Patterns, Outcomes |
| Reasoning Viewer | Evidence, Interpretation, Assumptions, Blind Spots, Confidence, Recommendations |
| Decision Capture | Decision ≠ Recommendation (external reference only) |

## Decision Model

Per Outcomes Architecture:

- Recommendations are system-generated artifacts
- Executive decisions are **external references** (`executive_decision_reference`)
- UI maps Accepted → `followed`, Modified → `modified`, Rejected → `rejected`

## Outcome Model

Outcome capture fields match `outcome-capture-template.md`:

- `action_taken`
- `observed_outcome`
- `unexpected_consequences`
- `measurable_results`
- Learning notes appended to `body_md`

Validation and learning promotion remain repository workflows — not UI responsibilities in Build 10.

## Drift Controls

If UI implementation conflicts with:

1. Project Charter → preserve doctrine
2. Architecture documents → preserve architecture
3. Approved repository (`scripts/`, `supabase/`) → preserve implementation

Do not silently redefine authoritative documents.

## Build 10 Exclusions

Not implemented (by design):

- Authentication UI
- Analytics, dashboards, KPIs
- Notifications, permissions, multi-user
- Pipeline orchestration for new situations
- Background workers, AI agents

These are deferred to future builds per build plan.
