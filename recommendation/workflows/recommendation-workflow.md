# Workflow: Recommendation Pipeline

End-to-end recommendation from Interpretation Package receipt through Recommendation Package delivery for executive decision support.

## Architecture Reference

- Recommendation Architecture v1.0 — Recommendation Model, Recommendation Outputs
- Inference Architecture v1.0 — Interpretation Package handoff
- LAD-014, AF-014 — Executive agency preserved
- DOC-008 — Recommendation operates upon Interpretation Package

## Prerequisites

- Interpretation Package delivered via `inference/workflows/interpretation-workflow.md`
- Inference review passed via `inference/governance/inference-review-checklist.md`
- Interpretation Package `status: handed_off`
- No recommendation performed during inference

## Steps

### 1. Receive Interpretation Package

Verify handoff from inference:

- Interpretation Package path documented
- Synthesized interpretation present
- Interpretive findings present
- Risks and opportunities evidence-based
- No recommendations in package
- Inference review passed

Register in `recommendation/INDEX.md`. Assign Recommendation Package ID (e.g., `REC-PKG-001`).

### 2. Align objectives

Execute `objective-alignment-workflow.md`.

Copy `templates/objective-alignment-template.md` to `decision-support/`.

Rename: `rec-obj-{short-slug}.md`

Link in Recommendation Package `component_artifacts.objective_alignment`.

### 3. Generate options

Execute `option-generation-workflow.md`.

Copy `templates/option-generation-template.md` to `options/`.

Rename: `rec-opt-{short-slug}.md`

Link in Recommendation Package `component_artifacts.option_generation`.

### 4. Evaluate doctrine alignment

Execute `doctrine-evaluation-workflow.md`.

Copy `templates/doctrine-evaluation-template.md` to `recommendations/`.

Rename: `rec-doc-{short-slug}.md`

Link in Recommendation Package `component_artifacts.doctrine_evaluation`.

### 5. Evaluate risks

Copy `templates/risk-assessment-template.md` to `recommendations/`.

Rename: `rec-rsk-{short-slug}.md`

Evaluate action-level risks for each option. Reference inference risks from Interpretation Package — do not re-infer from evidence.

Link in Recommendation Package `component_artifacts.risk_assessment`.

### 6. Evaluate opportunities

Copy `templates/opportunity-assessment-template.md` to `recommendations/`.

Rename: `rec-opp-{short-slug}.md`

Evaluate action-level opportunities for each option. Reference inference opportunities from Interpretation Package — do not re-infer from evidence.

Link in Recommendation Package `component_artifacts.opportunity_assessment`.

### 7. Analyze tradeoffs

Execute `tradeoff-analysis-workflow.md`.

Copy `templates/tradeoff-analysis-template.md` to `tradeoffs/`.

Rename: `rec-trd-{short-slug}.md`

Link in Recommendation Package `component_artifacts.tradeoff_analysis`.

### 8. Assess recommendation confidence

Execute `recommendation-confidence-workflow.md`.

Copy `templates/recommendation-confidence-template.md` to `decision-support/`.

Rename: `rec-con-{short-slug}.md`

Evaluate recommendation confidence independently from inference confidence.

Link in Recommendation Package `component_artifacts.recommendation_confidence`.

### 9. Assemble Recommendation Package

Copy `templates/recommendation-package-template.md` to `decision-support/`.

Rename: `rec-pkg-{short-slug}.md`

Consolidate component artifacts:

- Objective assessment
- Primary recommendation
- Alternative recommendations
- Doctrine alignment assessment
- Risk assessment
- Opportunity assessment
- Tradeoff analysis
- Supporting evidence and findings
- Assumptions
- Confidence assessment
- Expected consequences
- Uncertainty assessment
- Outcome tracking considerations
- Executive decision support summary

Set `status: complete`.

Link all `component_artifacts` in frontmatter.

### 10. Validate before delivery

Run `governance/recommendation-review-checklist.md`.

Do not deliver if checklist fails.

### 11. Deliver for executive decision support

Provide Recommendation Package to executive.

Update package `status: delivered`.

Document delivery date in package artifact.

**Decisions are executive responsibility.** Do not record executive decisions as recommendations.

### 12. Update registry

Update `recommendation/INDEX.md`:

- Recommendation Packages table
- Component Artifacts table

## Governance Checklist

- [ ] Interpretation Package verified — no inference gaps requiring return to inference
- [ ] All component artifacts created and linked
- [ ] Category separation maintained throughout
- [ ] Recommendation review checklist passed
- [ ] No re-inference or evidence reinterpretation
- [ ] Executive agency preserved
- [ ] `INDEX.md` updated at each stage

## Do Not

- Re-perform inference or reinterpret evidence
- Validate outcomes — defer to `outcomes/`
- Make or record executive decisions
- Present recommendations as decisions or facts
- Elevate confidence solely because options appear logical
- Skip doctrine evaluation or tradeoff analysis

## Next Steps

- Executive decision and action
- Outcome capture: `outcomes/workflows/outcome-pipeline-workflow.md`
- After outcomes: recommendation review cycle
- If inference gaps found: return to `inference/` — do not re-infer in recommendation
