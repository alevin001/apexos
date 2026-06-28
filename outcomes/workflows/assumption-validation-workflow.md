# Workflow: Assumption Validation

Validate assumptions from recommendation and inference against observed outcomes.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Assumption Validation
- Inference Architecture v1.0 — Assumption Transparency (AF-012)

## Prerequisites

- Outcome capture complete
- Recommendation Package and/or Interpretation Package linked
- Assumptions documented in source artifacts

## Steps

### 1. Collect assumptions

Reference assumptions from:

- Recommendation Package assumptions section
- Interpretation Package assumption assessment
- `inference/reasoning/` assumption register artifacts

Do not generate new assumptions.

### 2. Validate each assumption

For each assumption:

| Result | Criteria |
|--------|----------|
| Validated | Observed outcomes support assumption |
| Failed | Observed outcomes contradict assumption |
| Partially | Mixed or incomplete evidence |
| Inconclusive | Insufficient outcome evidence |

Document evidence from outcome capture.

### 3. Assess confidence impact

Failed assumptions reduce confidence. Validated assumptions may increase confidence within recalibration rules.

### 4. Identify downstream actions

| Failed assumption | Action |
|-------------------|--------|
| Influenced recommendation | Flag for confidence recalibration |
| Influenced pattern | Flag for pattern evaluation |
| Material learning | Flag for learning update |

### 5. Create artifact

Copy `templates/assumption-validation-template.md` to `assumptions/`.

Rename: `out-asm-val-{short-slug}.md`

Link `outcome_capture`, `recommendation_package`, and `interpretation_package`.

### 6. Update registry

Update `outcomes/INDEX.md` Component Artifacts table.

## Do Not

- Generate new assumptions
- Re-perform inference assumption identification
- Hide failed assumptions
- Modify source assumption registers — reference only

## Next Steps

- `confidence-recalibration-workflow.md`
- `learning-promotion-workflow.md` when assumption failures yield validated learning
