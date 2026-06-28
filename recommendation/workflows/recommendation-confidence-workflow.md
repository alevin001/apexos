# Workflow: Recommendation Confidence

Evaluate recommendation confidence independently from inference confidence.

## Architecture Reference

- Recommendation Architecture v1.0 — Recommendation Confidence Assessment, Outcome-Validated Recommendation Principle, Uncertainty Handling
- AF-014 — Transparency over unsupported certainty

## Prerequisites

- Doctrine evaluation complete
- Risk assessment complete
- Opportunity assessment complete
- Tradeoff analysis complete
- Template: `templates/recommendation-confidence-template.md`

## Steps

### 1. Create recommendation confidence artifact

Copy template to `decision-support/`.

Rename: `rec-con-{short-slug}.md`

Populate frontmatter:

- `interpretation_package` — link to Interpretation Package
- `inference_confidence` — reference from Interpretation Package
- `component_artifacts` — links to doctrine, risk, opportunity, tradeoff artifacts
- `id` — assign registry ID (e.g., `REC-CON-001`)

### 2. Reference inference confidence

Document inference confidence from Interpretation Package.

**Rule:** Recommendation confidence is related to but independent from inference confidence. A recommendation may have lower confidence than the underlying finding.

### 3. Assess confidence influencing factors

Evaluate each factor:

| Factor | Assessment |
|--------|------------|
| Inference confidence | From Interpretation Package |
| Doctrine alignment | From doctrine evaluation |
| Historical outcome validation | From memory/pattern references via interpretation |
| Pattern strength | From Interpretation Package references |
| Situational similarity | Assessment |
| Risk profile | From risk assessment |
| Outcome evidence | From available outcome references |
| Evidence quality | From Interpretation Package |
| Environmental uncertainty | Assessment |

### 4. Assign option-level confidence

For primary and alternative options:

- Assign confidence: low / medium / high / insufficient
- Document rationale
- Identify key uncertainty

**Rule:** Do not elevate confidence solely because options appear logical.

### 5. Apply outcome-validated confidence

Where validated patterns and historical outcomes support options:

- Document validated pattern support
- Document historical outcome support
- Adjust confidence accordingly

### 6. Assign overall package confidence

Summarize overall Recommendation Package confidence with rationale.

### 7. Declare insufficient information if applicable

When warranted, declare:

- Insufficient information exists
- Recommendation confidence is low
- Multiple options are equally viable
- Additional evidence is required

Uncertainty is a valid output.

### 8. Link and register

Link artifact in Recommendation Package `component_artifacts.recommendation_confidence`.

Update `recommendation/INDEX.md` Component Artifacts table.

Set `status: complete`.

Populate `confidence_summary` and `uncertainty_flags` in frontmatter.

## Governance Checklist

- [ ] Recommendation confidence independent from inference confidence
- [ ] All options assessed
- [ ] Outcome-validated confidence applied where applicable
- [ ] Insufficient information declared if applicable
- [ ] No confidence overstated
- [ ] Registered in `INDEX.md`

## Do Not

- Equate inference confidence with recommendation confidence
- Elevate confidence for persuasive effect
- Hide uncertainty behind confident language
- Validate outcomes in this workflow

## Next Step

Proceed to Recommendation Package assembly in `recommendation-workflow.md`.
