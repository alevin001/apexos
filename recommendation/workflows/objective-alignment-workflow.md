# Workflow: Objective Alignment

Clarify desired outcomes before option generation.

## Architecture Reference

- Recommendation Architecture v1.0 — Objective Alignment
- DOC-008 — Recommendations aligned with desired outcomes rather than isolated actions

## Prerequisites

- Interpretation Package received with `status: handed_off`
- Inference review passed
- Template: `templates/objective-alignment-template.md`

## Steps

### 1. Create objective alignment artifact

Copy template to `decision-support/`.

Rename: `rec-obj-{short-slug}.md`

Populate frontmatter:

- `interpretation_package` — link to Interpretation Package
- `id` — assign registry ID (e.g., `REC-OBJ-001`)

### 2. Review Interpretation Package context

From Interpretation Package — do not re-infer:

- Synthesized interpretation
- Interpretive findings
- Unknowns that may affect objectives

### 3. Define desired outcomes

Answer evaluative questions:

- What outcome is being pursued?
- What problem is being solved?
- What opportunity is being pursued?
- What strategic objective is involved?
- What relationship objective exists?
- What organizational objective exists?

### 4. Assess alignment

Verify recommendations will remain aligned with desired outcomes rather than isolated actions.

Document gaps where objectives are unclear — flag for executive clarification if needed.

### 5. Link and register

Link artifact in Recommendation Package `component_artifacts.objective_alignment`.

Update `recommendation/INDEX.md` Component Artifacts table.

Set `status: complete`.

## Governance Checklist

- [ ] Objectives derived from Interpretation Package — not re-inferred
- [ ] No recommendations in this artifact
- [ ] Alignment gaps documented where objectives unclear
- [ ] Registered in `INDEX.md`

## Do Not

- Re-interpret evidence or generate new findings
- Generate options or recommendations in this workflow
- Make executive decisions about objectives without executive input when unclear

## Next Step

Proceed to `option-generation-workflow.md`.
