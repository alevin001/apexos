# Workflow: Interpretation Pipeline

End-to-end inference from Context Package receipt through Interpretation Package delivery to recommendation.

## Architecture Reference

- Inference Architecture v1.0 — Interpretation Model, Inference Outputs
- Retrieval Architecture v1.0 — Inference operates upon assembled evidence
- LAD-013, AF-011 — Inference converts evidence into interpretation
- LAD-008, AF-007 — Evidence precedes inference

## Prerequisites

- Context Package delivered via `retrieval/workflows/package-delivery.md`
- Retrieval validation passed
- Context Package `status: delivered`
- No inference performed during retrieval

## Steps

### 1. Receive Context Package

Verify handoff from retrieval:

- Context Package path documented in retrieval artifact
- Contradictory evidence section present
- Gaps documented
- No inference or recommendations in package

Register in `inference/INDEX.md`. Assign Interpretation Package ID (e.g., `INF-INT-001`).

### 2. Evaluate evidence

Execute `evidence-evaluation-workflow.md`.

Copy `templates/evidence-assessment-template.md` to `reasoning/`.

Rename: `inf-evd-{short-slug}.md`

Link in Interpretation Package `component_artifacts.evidence_assessment`.

### 3. Review assumptions

Execute `assumption-review-workflow.md`.

Copy `templates/assumption-register-template.md` to `reasoning/`.

Rename: `inf-asm-{short-slug}.md`

### 4. Review blind spots

Execute `blind-spot-workflow.md`.

Copy `templates/blind-spot-review-template.md` to `reasoning/`.

Rename: `inf-bls-{short-slug}.md`

### 5. Evaluate hypotheses

Within evidence assessment or as separate step:

Copy `templates/hypothesis-evaluation-template.md` to `hypothesis-generation/`.

Rename: `inf-hyp-{short-slug}.md`

Document plausible explanations — not conclusions.

### 6. Calibrate confidence

Execute `confidence-calibration-workflow.md`.

Copy `templates/confidence-assessment-template.md` to `reasoning/`.

Rename: `inf-con-{short-slug}.md`

Declare insufficient evidence if applicable (AF-013).

### 7. Evaluate competing interpretations

Execute `competing-interpretation-workflow.md`.

Copy `templates/competing-interpretations-template.md` to `reasoning/`.

Rename: `inf-cmp-{short-slug}.md`

### 8. Assemble Interpretation Package

Copy `templates/interpretation-package-template.md` to `interpretation/`.

Rename: `inf-int-{short-slug}.md`

Consolidate component artifacts:

- Evidence and perspective assessment
- Assumption assessment
- Blind spot assessment
- Hypotheses
- Confidence assessments
- Risks and opportunities (evidence-based)
- Competing interpretations
- Unknowns
- Interpretive findings
- Synthesized interpretation

Set `status: complete`.

Link all `component_artifacts` in frontmatter.

### 9. Validate before handoff

Run `governance/inference-review-checklist.md`.

Do not hand off if checklist fails.

### 10. Hand off to recommendation

Provide Interpretation Package path to `recommendation/`.

Update package `status: handed_off`.

Document handoff date in package artifact.

**Recommendation is a separate layer.** Do not generate recommendations in this workflow.

### 11. Update registry

Update `inference/INDEX.md`:

- Interpretation Packages table
- Component Artifacts table

## Governance Checklist

- [ ] Context Package verified — no inference contamination from retrieval
- [ ] All component artifacts created and linked
- [ ] Category separation maintained throughout
- [ ] Inference review checklist passed
- [ ] No recommendations in Interpretation Package
- [ ] `INDEX.md` updated at each stage

## Do Not

- Influence evidence selection — request new retrieval if evidence insufficient
- Present hypotheses or assumptions as findings
- Generate recommendations or decision support
- Resolve contradictory evidence — evaluate and document
- Skip confidence calibration or competing interpretation evaluation

## Next Steps

- Recommendation: `recommendation/` (future build)
- After outcomes: inference review cycle
- If evidence gaps found: new retrieval request via `retrieval/`
