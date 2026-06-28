# Retrieval Layer — Source Fidelity and Governance Controls

Retrieval-specific implementation of Governance Architecture principles for evidence assembly.

## Architecture Reference

- **Retrieval Architecture v1.0 (DOC-005):** Evidence Assembly, Contradictory Evidence, Context Package Assembly, LAD-007, LAD-008
- **Context Architecture v1.0 (DOC-004):** Context determines relevance
- **Governance Architecture v1.0 (DOC-006):** Retrieval Drift, Fidelity Preservation, No Silent Transformation
- **Index:** LAD-007, LAD-008, AF-006, AF-007, AF-008

## Scope

Applies to all content in `retrieval/`:

- Retrieval requests (`requests/`)
- Evidence packages (`evidence/`)
- Contradictory evidence records (`evidence/`)
- Context Packages (`context-package/`)
- Retrieval reviews

Context controls in `governance/source-fidelity/context-layer.md` govern relevance determination. Knowledge and memory controls govern source content in their respective layers.

## Core Retrieval Governance Rules

### Retrieval Executes Context Relevance (LAD-007, AF-006)

Retrieval assembles evidence according to context relevance specifications. Retrieval does not redefine what matters.

If evidence suggests relevance should change, trigger context review — do not silently override context weights.

### Evidence First (LAD-008, AF-007)

| Rule | Requirement |
|------|-------------|
| Evidence precedes inference | Validate assembly before delivery |
| No inference in retrieval | Packages contain evidence — not conclusions |
| Maximize evidence quality | Document gaps explicitly |
| No preliminary conclusions | Evidence selection not influenced by expected inference |

### Contradictory Evidence Required (AF-008)

| Rule | Requirement |
|------|-------------|
| Include supporting evidence | Always |
| Include contradictory evidence | When conflicts exist or are plausible |
| Document absence | Search scope when none found |
| Do not resolve conflicts | Inference reconciles — retrieval presents |

### Smallest Effective Set

- Optimize for executive effectiveness — not completeness
- Document exclusions with rationale
- Do not treat retrieval as search or maximum recall

## Fidelity Preservation (LAD-010) — Retrieval Context

When assembling evidence:

- Link to source paths — do not duplicate content
- Preserve confidence levels from source artifact frontmatter
- Preserve meaning in relevance summaries — do not distort source intent
- Prefer primary sources when traceability matters

## No Silent Transformation (LAD-011) — Retrieval Context

| Transformation | Visibility requirement |
|----------------|----------------------|
| Tier reassignment | Context review required |
| Scope expansion | New retrieval request or context review |
| Evidence exclusion change | Update evidence package with rationale |
| Post-delivery modification | New retrieval request — do not silently edit delivered packages |

## Retrieval Drift

Retrieval drift occurs when evidence assembly becomes biased, incomplete, or disconnected from context specifications (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Confirmation bias — no contradictory evidence | Re-run contradictory evidence workflow |
| Tier mismatch with context | Context review or re-assembly |
| Recency-dominated ranking | Re-rank using multi-signal assessment |
| Scope creep beyond context | Context review |
| Inference contamination in packages | Remove; re-validate |
| Undocumented gaps | Document search scope and impact |

See `retrieval/governance/retrieval-fidelity-checklist.md` and `retrieval/workflows/retrieval-validation.md`.

## Review Requirements

- Validate every Context Package before inference handoff
- Re-validate when evidence package is materially updated
- Review when inference feedback indicates retrieval gaps
- Review when outcome evidence contradicts retrieval scope
- No retrieval workflow exempt from validation (LAD-009)

## Checklists and Workflows

| Control | Location |
|---------|----------|
| Pre-assembly | `retrieval/governance/evidence-first-checklist.md` |
| Pre-delivery | `retrieval/governance/retrieval-fidelity-checklist.md` |
| Validation | `retrieval/workflows/retrieval-validation.md` |
| Architecture mapping | `retrieval/governance/architecture-mapping.md` |

## Relationship to Inference

Deliver Context Package to inference. Inference operates upon assembled evidence — it does not influence evidence selection during retrieval.

If inference requires additional evidence, create a new retrieval request.
