# Workflow: Option Generation

Generate multiple viable courses of action to support executive judgment.

## Architecture Reference

- Recommendation Architecture v1.0 — Option Generation, Alternative Courses Of Action
- DOC-008 — Support executive judgment through comparison and evaluation

## Prerequisites

- Objective alignment complete
- Interpretation Package available
- Template: `templates/option-generation-template.md`

## Steps

### 1. Create option generation artifact

Copy template to `options/`.

Rename: `rec-opt-{short-slug}.md`

Populate frontmatter:

- `interpretation_package` — link to Interpretation Package
- `objective_alignment` — link to rec-obj artifact
- `id` — assign registry ID (e.g., `REC-OPT-001`)

### 2. Review objective alignment

Confirm desired outcomes from objective alignment artifact.

### 3. Generate options by type

Generate multiple viable options whenever practical across:

- Communication options
- Leadership options
- Organizational options
- Relationship options
- Strategic options
- Operational options

Each option must be supported by Interpretation Package findings — not re-inferred from evidence.

### 4. Identify primary recommendation candidate

Select the option most supported by:

- Evidence (via Interpretation Package)
- Doctrine (preliminary — full evaluation in doctrine workflow)
- Interpretation
- Historical learning (via Interpretation Package references)

Document rationale.

### 5. Identify alternative recommendation candidates

Document additional viable options with advantages and disadvantages.

### 6. Compare options

Create option comparison summary across evidence support, doctrine fit, risk profile, and opportunity profile.

### 7. Link and register

Link artifact in Recommendation Package `component_artifacts.option_generation`.

Update `recommendation/INDEX.md` Component Artifacts table.

Set `status: complete`.

## Governance Checklist

- [ ] Multiple options generated when practical
- [ ] Options supported by Interpretation Package — not re-inferred
- [ ] Primary and alternative candidates identified
- [ ] No final Recommendation Package assembly in this workflow
- [ ] Registered in `INDEX.md`

## Do Not

- Force a single path when multiple viable options exist
- Re-perform inference to support options
- Present options as decisions
- Skip alternatives when evidence supports multiple paths

## Next Step

Proceed to `doctrine-evaluation-workflow.md`.
