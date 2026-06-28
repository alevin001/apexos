# Recommendation Governance

Layer-specific governance controls for Recommendation Architecture implementation.

## Architecture Reference

- Recommendation Architecture v1.0 (DOC-008) — Governance Controls, Executive Agency Principle
- Governance Architecture v1.0 (DOC-006) — LAD-010, LAD-011, LAD-014, LAD-015
- Architecture & Doctrine Index v2.0 — AF-014

## Scope

Applies to all content in `recommendation/`:

- Recommendation Packages (`decision-support/`)
- Component artifacts (`options/`, `recommendations/`, `tradeoffs/`, `decision-support/`)
- Recommendation reviews

Inference controls in `inference/governance/` govern interpretation. Outcome controls will govern validation in Build 07.

## Governance Principles (Recommendation Architecture)

| Principle | Requirement | Implementation |
|-----------|-------------|----------------|
| Evidence First | Recommendations grounded in evidence and interpretation | Operate only on handed-off Interpretation Package |
| Doctrine Supremacy | Recommendations aligned with Charter doctrine | Doctrine evaluation workflow and template |
| Perspective Neutrality (CP-008) | Competing perspectives evaluated fairly | Option generation and tradeoff analysis |
| Executive Agency (LAD-014, AF-014) | Executive remains responsible for decisions | No autonomous decision language |
| Transparency | Recommendations remain explainable | Category separation, traceability, cause-and-effect transparency |
| Outcome Validation (LAD-015) | Recommendations subject to future validation | Outcome tracking considerations — validation in `outcomes/` |
| No Silent Transformation (LAD-011) | No silent conversion of categories | Recommendation boundaries, review checklist |

## Recommendation Responsibilities

Recommendation is limited to the following — no responsibilities may move to Inference or Outcomes:

| Responsibility | Governed By |
|----------------|-------------|
| Objective alignment | `workflows/objective-alignment-workflow.md` |
| Option generation | `workflows/option-generation-workflow.md` |
| Doctrine evaluation | `workflows/doctrine-evaluation-workflow.md` |
| Risk evaluation | Risk assessment template, recommendation workflow |
| Opportunity evaluation | Opportunity assessment template, recommendation workflow |
| Tradeoff analysis | `workflows/tradeoff-analysis-workflow.md` |
| Recommendation confidence | `workflows/recommendation-confidence-workflow.md` |
| Recommendation package | Recommendation Package template |
| Executive decision support | Recommendation Package delivery |

## Category Governance

| Category | Rule | Violation Indicator |
|----------|------|---------------------|
| Evidence | Referenced from Interpretation Package — not duplicated or reinterpreted | New evidence interpretation in recommendation artifact |
| Findings | Referenced from Interpretation Package — not re-inferred | Finding stated without Interpretation Package reference |
| Hypotheses | Referenced — not promoted to recommendations without evaluation | Hypothesis presented as recommendation without option evaluation |
| Assumptions | Visible — challengeable — carried forward | Assumption hidden in recommendation rationale |
| Recommendations | Potential courses of action — not decisions | Decision language or autonomous action directives |
| Decisions | Not in recommendation layer | Executive choice recorded as recommendation |

## Uncertainty Governance

When information is insufficient:

- Declare insufficient information explicitly
- Do not force recommendations
- Document equally viable options where applicable
- Identify additional evidence requirements
- Return to inference/retrieval if interpretation gaps found — do not re-infer in recommendation
- Uncertainty is a valid output — not a failure

## Review Requirements

- Validate every Recommendation Package before executive delivery
- Re-validate when Interpretation Package is materially updated
- Review when outcome evidence contradicts recommendations
- Review when inference layer identifies recommendation operating on incomplete interpretation
- No recommendation workflow exempt from review (LAD-009)

## Checklists and Controls

| Control | Location |
|---------|----------|
| Pre-delivery validation | `recommendation-review-checklist.md` |
| Layer boundaries | `recommendation-boundaries.md` |
| Traceability | `recommendation-traceability.md` |
| Cross-layer fidelity | `governance/source-fidelity/recommendation-layer.md` |
| Architecture mapping | See Build 06 deliverable |

## Relationship to Inference

Recommendation operates upon Interpretation Package — it does not re-perform inference:

- Interpretive findings referenced — not re-derived
- Confidence assessed independently — not copied from inference
- Risks and opportunities evaluated at action level — not re-identified from evidence
- Synthesized interpretation is input — not a recommendation

If inference gaps are discovered, return to `inference/` — do not re-infer in recommendation.

## Relationship to Outcomes

Recommendation identifies outcome tracking considerations — it does not validate outcomes:

- Expected outcome windows identified
- Success and failure indicators documented
- Learning opportunities flagged
- Validation performed by `outcomes/`

## Recommendation Drift

Recommendation drift occurs when recommendations become decisions, re-perform inference, or present unsupported certainty (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Recommendations presented as decisions | Reclassify; preserve executive agency language |
| Evidence reinterpreted in recommendation | Return to inference; remove reinterpretation |
| Findings re-inferred | Reference Interpretation Package only |
| Confidence overstated | Re-run recommendation confidence workflow |
| Doctrine conflicts hidden | Re-run doctrine evaluation |
| Outcome validation performed in recommendation | Move to `outcomes/` |
| Autonomous decision language | Revise to decision-support language |

See `recommendation-review-checklist.md` and `recommendation-boundaries.md`.
