# Inference Governance

Layer-specific governance controls for Inference Architecture implementation.

## Architecture Reference

- Inference Architecture v1.0 (DOC-007) — Governance Controls
- Governance Architecture v1.0 (DOC-006) — LAD-008 through LAD-011, LAD-013
- Architecture & Doctrine Index v2.0 — AF-007, AF-011, AF-012, AF-013, CP-008

## Scope

Applies to all content in `inference/`:

- Interpretation Packages (`interpretation/`)
- Component artifacts (`reasoning/`, `hypothesis-generation/`)
- Inference reviews

Retrieval controls in `governance/source-fidelity/retrieval-layer.md` govern evidence assembly. Recommendation controls in `governance/source-fidelity/recommendation-layer.md` govern decision support.

## Governance Principles (Inference Architecture)

| Principle | Requirement | Implementation |
|-----------|-------------|----------------|
| Evidence First (LAD-008, AF-007) | Evidence precedes inference | Operate only on assembled Context Package |
| Perspective Neutrality (CP-008) | No perspective receives automatic authority | Evidence evaluation and competing interpretation workflows |
| Reflection Principle | All assumptions remain challengeable | Assumption review workflow and register |
| Transparency Principle | Interpretations remain explainable | Category separation, traceability, component artifacts |
| Outcome Validation Principle | Outcomes validate inference | Inference review after outcomes available |
| No Silent Transformation (LAD-011) | No silent conversion of categories | Interpretation boundaries, review checklist |

## Inference Responsibilities

Inference is limited to the following — no responsibilities may move to Recommendation:

| Responsibility | Governed By |
|----------------|-------------|
| Evidence evaluation | `workflows/evidence-evaluation-workflow.md` |
| Perspective evaluation | Evidence evaluation workflow |
| Assumption identification | `workflows/assumption-review-workflow.md` |
| Blind spot identification | `workflows/blind-spot-workflow.md` |
| Hypothesis generation | Hypothesis evaluation template |
| Confidence assessment | `workflows/confidence-calibration-workflow.md` |
| Competing interpretation evaluation | `workflows/competing-interpretation-workflow.md` |
| Interpretive findings | Interpretation Package |
| Synthesized interpretation | Interpretation Package |

## Category Governance

| Category | Rule | Violation Indicator |
|----------|------|---------------------|
| Evidence | Referenced from Context Package — not duplicated or reinterpreted as finding | Finding stated without evidence path |
| Findings | Strongly supported by evidence — distinct from hypotheses | Hypothesis presented as finding |
| Hypotheses | Plausible — not validated — not conclusions | Hypothesis without supporting/contradicting evidence |
| Assumptions | Visible — challengeable — not evidence | Assumption hidden in findings |
| Unknowns | Explicitly documented when evidence insufficient | Forced conclusion despite gaps |
| Recommendations | Not in inference layer | Action guidance in inference artifact |

## Uncertainty Governance (AF-013)

When evidence is insufficient:

- Declare insufficient evidence explicitly
- Do not force conclusions
- Document information needed
- Create new retrieval request if additional evidence required
- Uncertainty is a valid output — not a failure

## Review Requirements

- Validate every Interpretation Package before recommendation handoff
- Re-validate when Context Package is materially updated
- Review when outcome evidence contradicts interpretation
- Review when recommendation layer identifies inference gaps
- No inference workflow exempt from review (LAD-009)

## Checklists and Controls

| Control | Location |
|---------|----------|
| Pre-handoff validation | `inference-review-checklist.md` |
| Layer boundaries | `interpretation-boundaries.md` |
| Traceability | `inference-traceability.md` |
| Cross-layer fidelity | `governance/source-fidelity/inference-layer.md` |
| Architecture mapping | See Build 05 deliverable |

## Relationship to Recommendation

Inference produces recommendation inputs — not recommendations:

- Interpretive findings
- Confidence assessments
- Assumptions
- Blind spots
- Risks and opportunities (evidence-based)
- Competing interpretations
- Strategic considerations
- Unknowns

Recommendation layer operates upon Interpretation Package. Recommendation should not re-perform inference.

## Inference Drift

Inference drift occurs when interpretation becomes unsupported certainty, hidden assumptions, or category confusion (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Hypotheses presented as findings | Reclassify; update artifact |
| Assumptions hidden in conclusions | Extract to assumption register |
| Confidence overstated | Re-run confidence calibration |
| Contradictory evidence ignored | Re-run evidence evaluation |
| Recommendations in inference artifacts | Remove; move to recommendation layer |
| Evidence selection influenced by expected conclusion | New retrieval request; re-infer from clean package |

See `inference-review-checklist.md` and `interpretation-boundaries.md`.
