# Context Layer — Source Fidelity and Governance Controls

Context-specific implementation of Governance Architecture principles for relevance determination.

## Architecture Reference

- **Context Architecture v1.0 (DOC-004):** Context Domains, Situation-Centered Model, Context Weighting, LAD-006
- **Governance Architecture v1.0 (DOC-006):** Context Drift, Fidelity Preservation, No Silent Transformation
- **Retrieval Architecture v1.0 (DOC-005):** Context determines relevance; retrieval executes assembly
- **Index:** LAD-006, AF-004, AF-005

## Scope

Applies to all content in `context/`:

- Situation intake and evaluation artifacts (`situation/`, domain folders)
- Context weighting records
- Context reviews
- Relevance specifications for retrieval handoff

Retrieval controls in `governance/source-fidelity/retrieval-layer.md` govern evidence assembly. Memory controls in `memory-layer.md` govern distilled intelligence storage.

## Core Context Governance Rules

### Context Exists To Determine Relevance (LAD-006, AF-004)

Context artifacts document what matters for a situation — not stored intelligence, evidence, inference, or recommendations.

### Context Does Not Store Information

| Rule | Requirement |
|------|-------------|
| No distilled intelligence | Link to `memory/` — do not duplicate |
| No source duplication | Link to `knowledge/` — do not copy source content |
| No evidence assembly | Evidence assembly is retrieval responsibility |
| No inference | Context evaluates relevance — inference occurs in `inference/` |
| No recommendations | Recommendations occur in `recommendation/` |

### Context Weighting Must Use Multiple Signals (AF-005)

- Document weighting rationale for every domain
- Do not weight by recency alone
- Record excluded domains with rationale

### Context Handoff Must Be Explicit

- Link context evaluation to retrieval request
- Run `context/governance/context-fidelity-checklist.md` before handoff
- Do not silently expand or reduce retrieval scope

## Fidelity Preservation (LAD-010) — Context Context

When referencing memory or knowledge in context artifacts:

- Preserve the intent of referenced content in relevance summaries
- Distinguish relevance assessment from interpretation
- Log material changes in `transformation_log`

## No Silent Transformation (LAD-011) — Context Context

| Transformation | Visibility requirement |
|----------------|----------------------|
| Weight change | Log in evaluation artifact or refresh record |
| Domain inclusion/exclusion change | Document rationale |
| Handoff scope change | Update retrieval request link; context review if post-handoff |
| Evaluation refresh | `workflows/context-refresh.md` with transformation log |

## Context Drift

Context drift occurs when relevance decisions become inaccurate or distorted (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Recency bias in weights | Re-weight using multi-signal assessment |
| Domain neglect | Context review with outcome evidence |
| Memory substitution in context artifacts | Remove duplication; link to memory |
| Pre-inference contamination | Remove conclusions; separate layers |
| Stale active evaluations | Execute context refresh workflow |

See `context/governance/context-drift-detection.md` and `context/workflows/context-review.md`.

## Review Requirements

- Review context decisions after significant outcomes
- Review when retrieval validation identifies relevance gaps
- Periodic review of active evaluations exceeding 30 days
- No context workflow exempt from validation (LAD-009)

## Checklists and Workflows

| Control | Location |
|---------|----------|
| Pre-handoff fidelity | `context/governance/context-fidelity-checklist.md` |
| Drift detection | `context/governance/context-drift-detection.md` |
| Context review | `context/workflows/context-review.md` |
| Architecture mapping | `context/governance/architecture-mapping.md` |

## Relationship to Memory Promotion

If context evaluation surfaces insights worth retaining, use `context/workflows/context-promotion.md` to create a memory observation — never store distilled intelligence in context artifacts.
