# Workflow: Recommendation Validation

Validate whether recommendations produced intended outcomes — without generating new recommendations.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Recommendation Validation
- LAD-015 — Validation separate from recommendation

## Prerequisites

- Outcome capture complete
- Recommendation Package linked in outcome capture
- Observed outcome documented

## Steps

### 1. Reference Recommendation Package

Link Recommendation Package — do not re-evaluate as decision support:

- Primary recommendation
- Expected benefits, risks, consequences
- Outcome tracking considerations (success/failure indicators)

### 2. Apply validation questions

| Question | Source evidence |
|----------|-----------------|
| Was the desired outcome achieved? | Outcome capture |
| Did unintended outcomes occur? | Outcome capture unexpected consequences |
| Did the action influence the outcome? | Outcome capture attribution |
| Did the recommendation improve results? | Comparison to baseline or alternatives |
| Were outcome tracking considerations met? | Success/failure indicators from recommendation |

### 3. Validate primary recommendation

Compare observed outcome to:

- Expected benefits
- Expected risks
- Success indicators from outcome tracking considerations
- Failure indicators from outcome tracking considerations

Assign validation result: `validated`, `partially_validated`, `invalidated`, `not_applicable`, or `inconclusive`.

### 4. Note alternative comparison (validation only)

If evidence suggests an alternative would have performed differently — document as validation observation only. Do not generate new recommendation.

### 5. Assess confidence impact

Document impact on recommendation confidence for recalibration workflow.

### 6. Create artifact

Copy `templates/recommendation-validation-template.md` to `validation/`.

Rename: `out-rec-val-{short-slug}.md`

Link `outcome_capture` and `recommendation_package`.

### 7. Update registry

Update `outcomes/INDEX.md` Component Artifacts table.

## Do Not

- Generate new recommendations
- Re-run recommendation workflow
- Present validation as decision support
- Modify Recommendation Package — reference only

## Next Steps

- `confidence-recalibration-workflow.md`
- Recommendation review cycle in `recommendation/` when confidence materially changes
