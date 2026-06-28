# Workflow: Competing Interpretation Evaluation

Actively evaluate competing explanations of the evidence.

## Architecture Reference

- Inference Architecture v1.0 — Competing Interpretations
- Retrieval Architecture v1.0 — AF-008 Contradictory Evidence (evaluated here, not resolved)
- CP-008 — Perspective Neutrality

## Prerequisites

- Evidence assessment complete
- Assumption register complete or in progress
- Blind spot review complete or in progress
- Template: `templates/competing-interpretations-template.md`

## Steps

### 1. Create competing interpretations artifact

Copy template to `reasoning/`.

Rename: `inf-cmp-{short-slug}.md`

Populate frontmatter:

- `context_package` — link to Context Package
- `id` — assign registry ID (e.g., `INF-CMP-001`)

### 2. Identify competing interpretations

Generate multiple plausible interpretations of the evidence:

- At minimum two competing interpretations when evidence permits
- Include interpretations from different perspectives
- Include alternative explanations from blind spot review

Multiple interpretations may be simultaneously plausible.

### 3. Document each interpretation

For each interpretation:

- Interpretation statement — what the evidence means under this view
- Evidence supporting — with source paths
- Evidence contradicting — with source paths
- Assumptions influencing — link to assumption register
- Blind spots within — link to blind spot review

### 4. Build comparison matrix

Compare interpretations across:

- Evidence support strength
- Contradictory evidence burden
- Assumption load
- Blind spot exposure
- Outcome improvement likelihood

### 5. Identify most supported interpretation

Determine which interpretation is most supported by evidence:

- Document rationale
- **Objective:** Not eliminate competing interpretations — understand them
- Most supported informs synthesized interpretation — it is not a recommendation

Update `most_supported` in frontmatter.

### 6. Document unresolved competition

When interpretations remain genuinely competing:

- Document why unresolved
- Identify information needed to distinguish them
- Flag in Interpretation Package `uncertainty_flags`

### 7. Complete evaluation

Set artifact `status: complete`.

Update `interpretation_count` in frontmatter.

Register in `inference/INDEX.md`.

## Evaluative Questions (Architecture)

- What competing interpretations exist?
- What evidence supports each interpretation?
- What evidence contradicts each interpretation?
- What assumptions influence each interpretation?
- Which interpretation is most supported?

## Governance Checklist

- [ ] Multiple plausible interpretations identified
- [ ] Evidence support and contradiction documented for each
- [ ] Assumptions and blind spots per interpretation identified
- [ ] Most supported interpretation identified with rationale
- [ ] Unresolved competition documented where applicable
- [ ] No premature elimination of plausible alternatives
- [ ] No recommendations generated

## Do Not

- Eliminate competing interpretations without evaluation
- Resolve contradictory evidence — evaluate competing views
- Grant automatic authority to any single interpretation
- Present most supported interpretation as the only valid view
- Generate recommendations from interpretation comparison

## Next Step

`confidence-calibration-workflow.md` or assemble Interpretation Package via `interpretation-workflow.md`.
