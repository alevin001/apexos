# Context Drift Detection

Indicators and responses for context drift — when relevance decisions become inaccurate or distorted.

## Architecture Reference

- Governance Architecture v1.0 (DOC-006) — Context Drift
- Context Architecture v1.0 (DOC-004)
- `docs/context-governance.md`

## What Is Context Drift

Context drift occurs when the Context Layer's relevance determinations diverge from what the situation actually requires — reducing executive effectiveness without visible correction.

Drift often begins through seemingly harmless simplification: default equal weights, recency bias, neglected domains, or context artifacts that accumulate inference over time.

## Drift Indicators

| Indicator | Detection method | Severity |
|-----------|------------------|----------|
| Recency bias | Weights correlate with artifact date, not situation relevance | Medium |
| Domain neglect | Same domains repeatedly excluded; later prove critical in outcomes | High |
| Memory substitution | Context artifacts contain duplicated memory content | High |
| Pre-inference contamination | Context evaluations contain conclusions or recommendations | High |
| Scope creep | Retrieval scope expands without context review | Medium |
| Scope shrink | Critical domains excluded without rationale | High |
| Stale evaluations | Active evaluations not refreshed as situation evolves | Medium |
| Orphan evaluations | Evaluations handed off without outcome review | Low |
| Weight without rationale | Domain weights assigned without documented signals | Medium |

## Monitoring Triggers

Monitor for drift during:

- `workflows/context-review.md` — primary drift detection workflow
- `retrieval/workflows/retrieval-validation.md` — retrieval-side validation
- Outcome capture in `outcomes/` — when available (Build 06)
- Quarterly audit of active evaluations in `INDEX.md`

## Response Protocol

| Severity | Response |
|----------|----------|
| High | Immediate context review; adjust or supersede evaluation; log in transformation log |
| Medium | Schedule context review; refresh weights if situation active |
| Low | Note in next scheduled review; archive if situation resolved |

## Drift vs Valid Change

| Valid change | Drift |
|--------------|-------|
| Documented weight adjustment after new evidence | Silent weight change |
| Domain excluded with rationale | Domain neglected without rationale |
| Refresh workflow with transformation log | Stale evaluation without update |
| Context review confirms original weights | Weights persist despite contradictory outcomes |

## Prevention

- Run `context-fidelity-checklist.md` before every retrieval handoff
- Document exclusion rationale for every excluded domain
- Review context after outcomes — no component exempt from validation (LAD-009)
- Separate context evaluation from inference — enforce layer boundaries

## Escalation

If drift indicates systemic issues (repeated recency bias, consistent domain neglect):

1. Document pattern in context review artifact
2. Consider memory observation if organizational learning is needed (`context-promotion.md`)
3. Reference in governance review controls — do not amend architecture without amendment controls
