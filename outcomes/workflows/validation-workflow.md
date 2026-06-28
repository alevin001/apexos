# Workflow: Validation

Assemble outcome validation component artifacts and Validation Package from outcome capture.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Outcome Validation, Outcome Attribution, Validation Package
- LAD-015 — Validation separate from recommendation

## Prerequisites

- Outcome capture complete via `outcome-capture-workflow.md`
- Outcome capture `status: complete`
- Recommendation Package linked

## Steps

### 1. Verify outcome capture

Confirm:

- Action taken documented
- Observed outcome documented
- Action-to-outcome correlation chain complete
- Recommendation and decision referenced — not re-evaluated

### 2. Run component validations

Execute as applicable:

| Component | Workflow | Required when |
|-----------|----------|---------------|
| Recommendation validation | `recommendation-validation-workflow.md` | Recommendation was followed or modified |
| Decision validation | *(template only)* | Executive decision reference available |
| Assumption validation | `assumption-validation-workflow.md` | Assumptions influenced recommendation |
| Pattern evaluation | `pattern-evaluation-workflow.md` | Relevant patterns in memory |

### 3. Assess outcome attribution

Document in Validation Package:

- Did action influence outcome?
- What external factors contributed?
- Attribution confidence level

### 4. Assemble Validation Package

Copy `templates/validation-package-template.md` to `validation/`.

Consolidate all component artifacts.

Link `outcome_capture` and all `component_artifacts`.

### 5. Review before validation

Run `governance/outcome-review-checklist.md`.

Set `status: validated` only after checklist passes.

### 6. Update registry

Update `outcomes/INDEX.md` Validation Packages and Component Artifacts tables.

## Do Not

- Generate recommendations during validation
- Rewrite outcome capture after validation — append corrections via new capture if needed
- Mark validated without review checklist
