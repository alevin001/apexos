# Context Governance

Governance requirements for context layer artifacts.

## Architecture Reference

- Governance Architecture v1.0 (DOC-006) — Context Drift, Fidelity Preservation, No Silent Transformation
- Context Architecture v1.0 (DOC-004) — Core Principle (LAD-006)
- Architecture & Doctrine Index v2.0 — LAD-006, AF-004, AF-005

## Scope

Applies to all content in `context/`:

- Situation intake and evaluation artifacts
- Domain supplements
- Context reviews
- Weighting records

Cross-layer governance controls also apply via `governance/source-fidelity/context-layer.md`.

## Core Context Governance Rules

### Context Exists To Determine Relevance (LAD-006, AF-004)

Context artifacts document what matters for a situation — not stored intelligence, conclusions, or recommendations.

### Context Does Not Store Information

| Rule | Requirement |
|------|-------------|
| No distilled intelligence | Link to `memory/` — do not duplicate |
| No source duplication | Link to `knowledge/` — do not copy source content |
| No inference in context | Context evaluates relevance — inference occurs in `inference/` |
| No recommendations in context | Recommendations occur in `recommendation/` |

### Context Weighting Must Use Multiple Signals (AF-005)

- Document weighting rationale for every domain
- Do not weight by recency alone
- Record excluded domains with rationale

### Context Handoff Must Be Explicit

- Link context evaluation to retrieval request
- Do not silently expand or reduce retrieval scope during assembly without context review

## Context Drift

Context drift occurs when relevance decisions become inaccurate or distorted over time (Governance Architecture).

| Drift type | Indicator | Response |
|------------|-----------|----------|
| Over-weighting recency | Recent artifacts consistently prioritized without situation relevance | Re-weight using `context-weighting.md` signals |
| Domain neglect | Repeatedly excluded domains later prove critical | Document exclusion rationale; review in `context-review.md` |
| Memory substitution | Context artifacts contain duplicated memory content | Remove duplication; link to memory paths |
| Pre-inference bias | Context evaluation contains conclusions or recommendations | Separate evaluation from inference |
| Stale relevance | Active evaluation not refreshed as situation evolves | Execute `context-refresh.md` |

See `../governance/context-drift-detection.md`.

## Fidelity Preservation (LAD-010) — Context Context

When referencing memory or knowledge in context artifacts:

- Preserve the intent of referenced content — do not distort meaning in relevance summaries
- Distinguish relevance assessment from interpretation
- Log material changes in `transformation_log`

## No Silent Transformation (LAD-011) — Context Context

| Transformation | Visibility requirement |
|----------------|----------------------|
| Weight change | Log in evaluation artifact or refresh record |
| Domain inclusion/exclusion change | Document rationale |
| Handoff scope change | Update retrieval request link; context review if post-handoff |
| Evaluation refresh | `context-refresh.md` workflow with transformation log |

## Review Requirements

- Review context decisions after significant outcomes (see `workflows/context-review.md`)
- Periodic review of active evaluations not resolved within 30 days
- Review when retrieval validation identifies relevance gaps (see `retrieval/workflows/retrieval-validation.md`)

## Checklists

- `../governance/context-fidelity-checklist.md` — pre-handoff validation
- `../governance/context-drift-detection.md` — drift monitoring
- `../governance/architecture-mapping.md` — architecture traceability

## Relationship to Outcome Validation

Context relevance decisions are subject to outcome validation (LAD-009). No context workflow is exempt from review when outcome evidence is available.
