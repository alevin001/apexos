# Workflow: Confidence Recalibration

Dynamically adjust confidence for recommendations, assumptions, and patterns based on outcome evidence.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Confidence Recalibration
- LAD-017, AF-016 — Dynamic confidence; continuous calibration

## Prerequisites

- Recommendation validation complete (when applicable)
- Assumption validation complete (when applicable)
- Pattern evaluation complete (when applicable)
- Outcome evidence documented

## Steps

### 1. Collect recalibration inputs

| Source | Validation result |
|--------|-------------------|
| Recommendation validation | |
| Assumption validation | |
| Pattern evaluation | |

### 2. Apply recalibration rules

| Condition | Confidence direction |
|-----------|---------------------|
| Recommendations repeatedly succeed | May increase |
| Recommendations repeatedly fail | May decrease |
| Assumptions repeatedly validate | May increase |
| Assumptions repeatedly fail | May decrease |
| Patterns repeatedly validate | Reinforcement |
| Patterns repeatedly fail | Weakening |
| Single instance | Limited recalibration |
| Inconclusive outcome | Unchanged or slight decrease |

### 3. Document confidence changes

For each target:

- Prior confidence (from source artifact)
- Updated confidence
- Direction and rationale
- Outcome evidence basis

### 4. Preserve historical integrity

- Reference prior artifacts — do not modify them
- Append recalibration as new record
- Document in `transformation_log`

### 5. Create artifact

Copy `templates/confidence-recalibration-template.md` to `reinforcement/`.

Rename: `out-con-recal-{short-slug}.md`

Link all validation component artifacts.

### 6. Update registry

Update `outcomes/INDEX.md` Component Artifacts and Reinforcement Updates tables.

## Do Not

- Rewrite confidence in Recommendation Package or Interpretation Package
- Apply maximum swing from single instance
- Re-perform inference confidence calibration
- Use recalibration to generate recommendations

## Next Steps

- `reinforcement-workflow.md` for pattern targets
- Recommendation review in `recommendation/` when recommendation confidence materially changes
