# Workflow: Confidence Calibration

Explicitly evaluate and calibrate confidence in interpretive findings.

## Architecture Reference

- Inference Architecture v1.0 — Confidence Assessment, Uncertainty Handling, Insufficient Evidence Principle
- AF-013 — Uncertainty is a valid output
- Governance Architecture — Transparency Principle

## Prerequisites

- Evidence assessment complete
- Hypothesis evaluation complete or in progress
- Competing interpretations evaluated or in progress
- Template: `templates/confidence-assessment-template.md`

## Steps

### 1. Create confidence assessment artifact

Copy template to `reasoning/`.

Rename: `inf-con-{short-slug}.md`

Populate frontmatter:

- `context_package` — link to Context Package
- `id` — assign registry ID (e.g., `INF-CON-001`)

### 2. Assess confidence influencing factors

Evaluate each factor's impact on confidence:

| Factor | Assessment |
|--------|------------|
| Evidence quality | Strong / moderate / weak |
| Evidence quantity | Sufficient / limited / insufficient |
| Pattern strength | Validated / emerging / absent |
| Outcome validation | Validated / partial / none |
| Contradictory evidence | Present / minimal / absent |
| Missing information | Critical gaps / minor gaps / none |
| Strategic significance | High / medium / low |

### 3. Assign finding-level confidence

For each interpretive finding (not yet in Interpretation Package — draft findings from evidence assessment):

- Assign confidence: low / medium / high
- Document rationale
- Identify key evidence and key uncertainty

**Rule:** Higher confidence does not imply certainty. Lower confidence does not imply incorrectness.

### 4. Assign hypothesis-level confidence

For each hypothesis from hypothesis evaluation:

- Confidence separate from finding confidence
- Document what would increase confidence

### 5. Assess risk and opportunity confidence

For identified risks and opportunities:

- Confidence in each assessment
- Rationale tied to evidence strength

### 6. Determine overall interpretation confidence

Synthesize across all findings:

- Overall confidence: low / medium / high / insufficient
- Document integrated rationale

### 7. Apply insufficient evidence declaration (AF-013)

If evidence is incomplete, contradictory, unreliable, or insufficient, declare:

- More evidence is required, OR
- Confidence is insufficient, OR
- No reliable interpretation can currently be established

Set `insufficient_evidence: true` in frontmatter.

**Uncertainty is a valid output.** Prefer uncertainty over unsupported certainty.

If insufficient evidence declared:

- Document what evidence is needed
- Do not force conclusions
- Consider new retrieval request

### 8. Calibrate and document adjustments

Review initial confidence assignments:

- Were any adjusted during review?
- Document calibration rationale in template

### 9. Complete assessment

Set artifact `status: complete`.

Update `overall_confidence` in frontmatter.

Register in `inference/INDEX.md`.

## Insufficient Evidence Principle

ApexOS is not required to produce a conclusion. When evidence cannot support reliable interpretation:

1. Declare insufficient evidence explicitly
2. Document what is needed
3. Do not present low-confidence interpretation as high-confidence
4. Create retrieval request if additional evidence is required

## Governance Checklist

- [ ] Confidence explicitly evaluated — not assumed
- [ ] Per-finding confidence documented with rationale
- [ ] Influencing factors assessed
- [ ] Insufficient evidence declared if applicable (AF-013)
- [ ] Higher confidence not presented as certainty
- [ ] Calibration adjustments documented

## Do Not

- Assume confidence without evaluation
- Present insufficient evidence as sufficient
- Skip insufficient evidence declaration when warranted
- Use confidence as proxy for recommendations

## Next Step

Assemble Interpretation Package via `interpretation-workflow.md`.
