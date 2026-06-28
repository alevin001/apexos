# Workflow: Complete Outcome Pipeline

End-to-end outcome validation from Recommendation Package and observed results through Validation Package delivery and learning promotion.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Outcome Model, Validation Outputs, Learning Loop
- Recommendation Architecture v1.0 — Recommendation Package handoff; outcome tracking considerations
- LAD-004, LAD-015, LAD-016, LAD-017 — Outcome validation, separation, correlation, confidence
- AF-015, AF-016, AF-017 — Measured learning, pattern reinforcement, action-to-outcome correlation

## Prerequisites

- Recommendation Package delivered via `recommendation/workflows/recommendation-workflow.md`
- Recommendation Package `status: delivered`
- Executive decision made (external)
- Action taken (observable or documentable)
- Observed outcome available or follow-up scheduled
- No outcome validation performed during recommendation

## Steps

### 1. Receive inputs

Verify handoff from recommendation:

- Recommendation Package path documented
- Outcome tracking considerations present in package
- No validation performed in recommendation artifact
- Executive decision reference available (external)
- Action taken documented or obtainable

Register in `outcomes/INDEX.md`. Assign Validation Package ID (e.g., `OUT-VAL-001`).

### 2. Capture outcome

Execute `outcome-capture-workflow.md`.

Copy `templates/outcome-capture-template.md` to `outcome-tracking/`.

Rename: `out-cap-{short-slug}.md`

Document full action-to-outcome correlation: Recommendation → Decision → Action → Outcome.

Link in Validation Package `outcome_capture`.

### 3. Validate recommendation

Execute `recommendation-validation-workflow.md`.

Copy `templates/recommendation-validation-template.md` to `validation/`.

Rename: `out-rec-val-{short-slug}.md`

Link in Validation Package `component_artifacts.recommendation_validation`.

### 4. Validate decision

Copy `templates/decision-validation-template.md` to `validation/`.

Rename: `out-dec-val-{short-slug}.md`

Assess executive decision effectiveness against observed outcomes. Do not override or re-record decision.

Link in Validation Package `component_artifacts.decision_validation`.

### 5. Validate assumptions

Execute `assumption-validation-workflow.md`.

Copy `templates/assumption-validation-template.md` to `assumptions/`.

Rename: `out-asm-val-{short-slug}.md`

Link in Validation Package `component_artifacts.assumption_validation`.

### 6. Evaluate patterns

Execute `pattern-evaluation-workflow.md`.

Copy `templates/pattern-validation-template.md` to `validation/`.

Rename: `out-pat-val-{short-slug}.md`

Link in Validation Package `component_artifacts.pattern_validation`.

### 7. Recalibrate confidence

Execute `confidence-recalibration-workflow.md`.

Copy `templates/confidence-recalibration-template.md` to `reinforcement/`.

Rename: `out-con-recal-{short-slug}.md`

Link in Validation Package `component_artifacts.confidence_recalibration`.

### 8. Update reinforcement

Execute `reinforcement-workflow.md`.

Copy `templates/reinforcement-update-template.md` to `reinforcement/`.

Rename: `out-rnf-{short-slug}.md`

Link in Validation Package `component_artifacts.reinforcement_update`.

### 9. Create learning update

Copy `templates/learning-update-template.md` to `learning/`.

Rename: `out-lrn-{short-slug}.md`

Document validated learning only — not speculation.

Link in Validation Package `component_artifacts.learning_update`.

### 10. Assemble Validation Package

Copy `templates/validation-package-template.md` to `validation/`.

Rename: `val-pkg-{short-slug}.md`

Consolidate component artifacts:

- Outcome assessment
- Outcome attribution
- Recommendation validation
- Decision validation
- Assumption validation
- Pattern validation
- Confidence recalibration
- Reinforcement updates
- Learning updates
- Follow-up findings (if applicable)
- Validated historical context

Set `status: complete`.

Link all `component_artifacts` in frontmatter.

### 11. Validate before promotion

Run `governance/outcome-review-checklist.md`.

Do not promote learning if checklist fails.

### 12. Promote validated learning

Execute `learning-promotion-workflow.md` when learning meets promotion criteria.

Update Validation Package `learning_promoted` and `status: validated`.

### 13. Schedule follow-up (if warranted)

Execute `executive-follow-up-workflow.md` when:

- Outcomes not yet fully observable
- High learning value warrants scheduled re-validation
- Recommendation Package flagged high-importance follow-up

### 14. Update registry

Update `outcomes/INDEX.md`:

- Validation Packages table
- Outcome Capture table
- Component Artifacts table
- Learning Updates table
- Reinforcement Updates table

## Governance Checklist

- [ ] Recommendation Package verified — no validation gaps requiring return to recommendation
- [ ] All component artifacts created and linked
- [ ] Category separation maintained throughout
- [ ] Outcome review checklist passed
- [ ] No new recommendations generated
- [ ] No inference re-performed
- [ ] Historical records preserved — not rewritten
- [ ] `INDEX.md` updated at each stage

## Do Not

- Generate recommendations or decision support
- Re-perform inference or reinterpret evidence
- Modify historical evidence, interpretation, or recommendation artifacts
- Rewrite memory artifacts directly — use memory promotion workflows
- Override executive decisions
- Promote unvalidated learning

## Next Steps

- Memory promotion: `memory/workflows/promote-to-memory.md`
- Pattern review: `memory/workflows/review-memory.md`
- Context review: `context/workflows/context-review.md`
- Recommendation review: update recommendation confidence via outcomes evidence
- If recommendation gaps found: return to `recommendation/` — do not generate recommendations in outcomes
