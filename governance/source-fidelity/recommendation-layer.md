# Recommendation Layer — Source Fidelity and Governance Controls

Recommendation-specific implementation of Governance Architecture principles for decision support generation.

## Architecture Reference

- **Recommendation Architecture v1.0 (DOC-008):** Objective Alignment, Doctrine Evaluation, Governance Controls, LAD-014
- **Inference Architecture v1.0 (DOC-007):** Interpretation Package handoff — recommendation operates upon interpretation
- **Governance Architecture v1.0 (DOC-006):** Fidelity Preservation, No Silent Transformation, LAD-010 through LAD-011
- **Index:** LAD-014, LAD-015, AF-014

## Scope

Applies to all content in `recommendation/`:

- Recommendation Packages (`decision-support/`)
- Objective alignment artifacts (`decision-support/`)
- Option generation artifacts (`options/`)
- Doctrine evaluation artifacts (`recommendations/`)
- Risk and opportunity assessment artifacts (`recommendations/`)
- Tradeoff analysis artifacts (`tradeoffs/`)
- Recommendation confidence artifacts (`decision-support/`)
- Recommendation reviews

Inference controls in `inference-layer.md` govern interpretation. Outcome controls in `outcome-layer.md` govern validation.

## Core Recommendation Governance Rules

### Operates Upon Interpretation (DOC-008)

| Rule | Requirement |
|------|-------------|
| Interpretation Package is the input | Operate only on validated handed-off package |
| No re-inference | Do not reinterpret evidence or re-derive findings |
| Reference findings — do not re-derive | Link to Interpretation Package sections |
| Inference gaps → return to inference | Do not re-infer in recommendation |

### Executive Agency (LAD-014, AF-014)

| Rule | Requirement |
|------|-------------|
| Recommendations support judgment | Decision-support language only |
| No autonomous decisions | Executive remains responsible |
| No decision recording | Executive choices are external |
| Tradeoffs visible — not resolved | Executive decides among tradeoffs |

### Doctrine Supremacy

| Rule | Requirement |
|------|-------------|
| Doctrine referenced — not duplicated | Link to `knowledge/doctrine/` |
| Doctrine evaluated per option | Doctrine evaluation required |
| Conflicts documented | No silent doctrine override |
| Doctrine influences confidence | Document impact transparently |

### Cause-And-Effect Transparency

| Rule | Requirement |
|------|-------------|
| Expected benefits explained | Not just "Do X" |
| Expected risks explained | Per option |
| Supporting evidence referenced | Through Interpretation Package chain |
| Assumptions visible | Carried forward from interpretation |
| Confidence explained | Independent assessment |

### Recommendation Confidence Independence

| Rule | Requirement |
|------|-------------|
| Independent from inference confidence | Separate assessment required |
| Outcome-validated confidence applied | Where historical evidence exists |
| No logical-appearance elevation | Observed outcomes influence confidence |
| Uncertainty declared when warranted | Insufficient information is valid |

## Fidelity Preservation (LAD-010) — Recommendation Context

When generating recommendations:

- Reference Interpretation Package findings — do not re-derive
- Reference evidence paths through interpretation chain — do not duplicate content
- Preserve inference confidence references — assess recommendation confidence separately
- Preserve doctrine meaning from source references — do not distort in evaluation

## No Silent Transformation (LAD-011) — Recommendation Context

| Transformation | Visibility requirement |
|----------------|----------------------|
| Finding → recommendation | Explicit option evaluation pathway |
| Hypothesis → recommendation | Forbidden without full evaluation |
| Assumption → fact | Forbidden without validation evidence |
| Inference confidence → recommendation confidence | Independent assessment required |
| Recommendation → decision | Executive action — external to ApexOS |
| Post-delivery modification | New recommendation cycle — do not silently edit delivered packages |
| Category conflation | Reclassify and document in transformation_log |

## Recommendation Drift

Recommendation drift occurs when recommendations become decisions, re-perform inference, or present unsupported certainty (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Recommendations presented as decisions | Revise language; preserve executive agency |
| Evidence reinterpreted | Return to inference; remove reinterpretation |
| Findings re-inferred | Reference Interpretation Package only |
| Confidence overstated | Re-run recommendation confidence workflow |
| Doctrine conflicts hidden | Re-run doctrine evaluation |
| Outcome validation in recommendation | Move to `outcomes/` |
| Autonomous action directives | Revise to decision-support language |

See `recommendation/governance/recommendation-review-checklist.md` and `recommendation/governance/recommendation-boundaries.md`.

## Review Requirements

- Validate every Recommendation Package before executive delivery
- Re-validate when Interpretation Package is materially updated
- Review when outcome evidence contradicts recommendations
- Review when inference layer identifies incomplete interpretation
- No recommendation workflow exempt from validation (LAD-009)

## Checklists and Workflows

| Control | Location |
|---------|----------|
| Pre-delivery | `recommendation/governance/recommendation-review-checklist.md` |
| Boundaries | `recommendation/governance/recommendation-boundaries.md` |
| Traceability | `recommendation/governance/recommendation-traceability.md` |
| Pipeline | `recommendation/workflows/recommendation-workflow.md` |

## Relationship to Inference

Receive Interpretation Package from inference. If recommendation requires additional interpretation, return to `inference/` — do not re-infer in recommendation.

## Relationship to Outcomes

Identify outcome tracking considerations in Recommendation Package. Outcome capture and validation remain the responsibility of `outcomes/`. Do not perform outcome validation in recommendation artifacts.
