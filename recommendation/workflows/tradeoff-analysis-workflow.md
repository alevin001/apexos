# Workflow: Tradeoff Analysis

Explicitly identify tradeoffs in executive decisions.

## Architecture Reference

- Recommendation Architecture v1.0 — Tradeoff Analysis
- DOC-008 — Make tradeoffs visible, not eliminate them

## Prerequisites

- Option generation complete
- Risk assessment complete
- Opportunity assessment complete
- Template: `templates/tradeoff-analysis-template.md`

## Steps

### 1. Create tradeoff analysis artifact

Copy template to `tradeoffs/`.

Rename: `rec-trd-{short-slug}.md`

Populate frontmatter:

- `interpretation_package` — link to Interpretation Package
- `option_generation` — link to rec-opt artifact
- `risk_assessment` — link to rec-rsk artifact
- `opportunity_assessment` — link to rec-opp artifact
- `id` — assign registry ID (e.g., `REC-TRD-001`)

### 2. Identify tradeoff types

Evaluate common executive tradeoffs:

- Short-term gain versus long-term gain
- Speed versus relationship preservation
- Certainty versus flexibility
- Execution versus buy-in
- Accountability versus autonomy

Add situational tradeoffs as applicable.

### 3. Detail each tradeoff

For each significant tradeoff, document:

- Options compared
- Benefits gained
- Costs incurred
- Risks increased
- Opportunities increased
- Competing priorities

### 4. Profile options

Summarize tradeoff profile per option:

- Primary tradeoffs accepted
- Primary tradeoffs avoided
- Net assessment

### 5. Document unresolvable tradeoffs

Identify tradeoffs that cannot be eliminated — document for executive awareness.

Do not resolve on behalf of the executive.

### 6. Link and register

Link artifact in Recommendation Package `component_artifacts.tradeoff_analysis`.

Update `recommendation/INDEX.md` Component Artifacts table.

Set `status: complete`.

## Governance Checklist

- [ ] Tradeoffs explicitly identified
- [ ] Competing priorities documented
- [ ] Unresolvable tradeoffs flagged for executive
- [ ] No tradeoff elimination claimed
- [ ] Registered in `INDEX.md`

## Do Not

- Eliminate or hide tradeoffs
- Resolve tradeoffs on behalf of the executive
- Re-perform inference to justify tradeoff preferences
- Present tradeoff analysis as a decision

## Next Step

Proceed to `recommendation-confidence-workflow.md`.
