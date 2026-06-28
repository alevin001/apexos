# Workflow: Doctrine Evaluation

Evaluate recommendation options against Charter doctrine.

## Architecture Reference

- Recommendation Architecture v1.0 — Doctrine Evaluation, Doctrine Alignment Principle
- Project Charter v1.0 (DOC-001) — Doctrine supremacy
- `knowledge/doctrine/` — Doctrine references

## Prerequisites

- Option generation complete
- Template: `templates/doctrine-evaluation-template.md`

## Steps

### 1. Create doctrine evaluation artifact

Copy template to `recommendations/`.

Rename: `rec-doc-{short-slug}.md`

Populate frontmatter:

- `interpretation_package` — link to Interpretation Package
- `option_generation` — link to rec-opt artifact
- `doctrine_references` — links to doctrine indices in `knowledge/doctrine/`
- `id` — assign registry ID (e.g., `REC-DOC-001`)

### 2. Reference doctrine sources

Link to Charter and doctrine indices in `knowledge/doctrine/` — do not duplicate doctrine content.

See `knowledge/doctrine/prime-doctrines-index.md` for entry points.

### 3. Evaluate each option

For each option from option generation, assess alignment with:

- Trust
- Alignment
- Communication effectiveness
- Leadership effectiveness
- Understanding
- Strategic clarity
- Measurable outcomes/results

Answer evaluative questions per option.

### 4. Document conflicts

Where alignment is partial or conflicting:

- Document conflict area and severity
- Identify mitigations or alternatives
- Do not silently override doctrine conflicts

### 5. Assess doctrine impact on confidence

Document how doctrine alignment influences recommendation confidence per option.

### 6. Link and register

Link artifact in Recommendation Package `component_artifacts.doctrine_evaluation`.

Update `recommendation/INDEX.md` Component Artifacts table.

Set `status: complete`.

## Governance Checklist

- [ ] Doctrine referenced — not duplicated
- [ ] All options evaluated
- [ ] Conflicts documented transparently
- [ ] Doctrine impact on confidence documented
- [ ] Registered in `INDEX.md`

## Do Not

- Reinterpret or modify doctrine
- Hide doctrine conflicts
- Use doctrine evaluation to re-perform inference
- Recommend options that unnecessarily conflict with established doctrine without documentation

## Next Step

Proceed to risk and opportunity assessment in `recommendation-workflow.md`, then `tradeoff-analysis-workflow.md`.
