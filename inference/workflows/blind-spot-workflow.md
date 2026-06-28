# Workflow: Blind Spot Review

Actively search for blind spots in interpretation.

## Architecture Reference

- Inference Architecture v1.0 — Blind Spot Evaluation
- Governance Architecture — Reflection Principle
- CP-008 — Perspective Neutrality

## Prerequisites

- Evidence assessment complete or in progress
- Assumption register complete or in progress
- Context Package available
- Template: `templates/blind-spot-review-template.md`

## Steps

### 1. Create blind spot review artifact

Copy template to `reasoning/`.

Rename: `inf-bls-{short-slug}.md`

Populate frontmatter:

- `context_package` — link to Context Package
- `id` — assign registry ID (e.g., `INF-BLS-001`)
- `blind_spot_areas_reviewed` — list areas evaluated

### 2. Evaluate executive interpretation blind spots

Ask:

- What may the executive be overlooking?
- What evidence has not been considered from the executive perspective?
- What alternative explanation exists?
- What assumptions may be distorting executive interpretation?

### 3. Evaluate stakeholder blind spots

For each relevant stakeholder or group:

- What perspective may be underrepresented?
- What evidence gap exists for this stakeholder view?
- What may stakeholders be overlooking?

### 4. Evaluate organizational blind spots

Ask:

- What organizational dynamics may be missed?
- What systemic factors are not represented in evidence?
- What historical patterns may be overlooked?

Link to `memory/pattern/` artifacts when relevant — reference paths only.

### 5. Evaluate historical pattern blind spots

Review Context Package for pattern evidence:

- What prior validated learning may apply but was not considered?
- What recurring situation patterns may be missed?

Distinguish from `pattern-recognition/` inferential process — reference pattern memory paths.

### 6. Evaluate system-generated conclusion blind spots

Assess ApexOS inference risks:

| Risk | Check |
|------|-------|
| Confirmation bias | Am I overweighting supporting evidence? |
| Anchoring | Am I locked on first interpretation? |
| Contradictory evidence neglect | Did I fully evaluate contradictions? |
| Recency bias | Am I overweighting recent evidence? |
| Perspective favoritism | Am I granting automatic authority to any perspective? |

### 7. Document alternative explanations

Identify explanations not yet evaluated:

- Why were they not initial focus?
- What evidence supports or contradicts them?

These may feed `competing-interpretation-workflow.md`.

### 8. Complete review

Set artifact `status: complete`.

Register in `inference/INDEX.md`.

## Evaluative Questions (Architecture)

- What may be overlooked?
- What evidence has not been considered?
- What alternative explanation exists?
- What assumptions may be distorting interpretation?
- What perspective may be underrepresented?

## Governance Checklist

- [ ] Executive blind spots evaluated
- [ ] Stakeholder blind spots evaluated
- [ ] Organizational blind spots evaluated
- [ ] Historical patterns considered
- [ ] System-generated conclusion risks assessed
- [ ] Underrepresented perspectives identified
- [ ] Alternative explanations documented

## Do Not

- Skip reflection on ApexOS own inference risks
- Favor executive perspective automatically
- Treat blind spot identification as optional
- Generate recommendations from blind spot findings

## Next Step

`competing-interpretation-workflow.md` or `confidence-calibration-workflow.md`.
