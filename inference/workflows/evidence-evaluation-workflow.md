# Workflow: Evidence Evaluation

Evaluate assembled evidence and perspectives from the Context Package.

## Architecture Reference

- Inference Architecture v1.0 — Evidence Evaluation, Perspective Evaluation, Evidence Versus Inference Principle
- CP-008 — Perspective Neutrality
- LAD-013 — Inference operates upon evidence

## Prerequisites

- Context Package received from retrieval
- Context Package validation passed
- Template: `templates/evidence-assessment-template.md`

## Steps

### 1. Create evidence assessment artifact

Copy template to `reasoning/`.

Rename: `inf-evd-{short-slug}.md`

Populate frontmatter:

- `context_package` — link to Context Package
- `id` — assign registry ID (e.g., `INF-EVD-001`)

### 2. Inventory evidence

From Context Package tiers, document:

- What evidence exists?
- What evidence is strongest?
- What evidence is weakest?
- What evidence is missing?
- What evidence may be unreliable?

Reference source paths — do not duplicate content.

### 3. Evaluate contradictory evidence

From Context Package contradictory evidence section:

- What evidence contradicts the emerging interpretation?
- Do not resolve conflicts — document implications

### 4. Apply evidence weighting

Weight evidence according to Inference Architecture signals:

| Signal | Application |
|--------|-------------|
| Outcome/results validation | Higher weight for outcome-validated evidence |
| Pattern strength | Higher weight for validated patterns |
| Repetition of observation | Higher weight for repeated observations |
| Strategic significance | Higher weight for mission-aligned evidence |
| Relationship significance | Higher weight for relationship-critical evidence |
| Source credibility | Note reliability concerns |

Do not assume all evidence carries equal weight.

### 5. Evaluate perspectives

For each perspective type, document:

- Executive perspectives
- Stakeholder perspectives
- Organizational perspectives
- System-generated perspectives

For each perspective:

- What evidence supports it?
- What evidence contradicts it?
- What assumptions exist within it?
- What blind spots may exist within it?

**Objective:** Not who is right — what is most supported by evidence and most likely to improve outcomes/results.

### 6. Evaluate pattern strength

If pattern evidence is present in Context Package:

- Consult `pattern-recognition/README.md` for inferential pattern evaluation
- Distinguish pattern recognition (inferential process) from pattern memory (stored learning)
- Weight according to pattern validation status in source artifact

### 7. Document gaps and reliability

- Missing evidence — from Context Package gaps section
- Unreliable evidence — note treatment in interpretation

### 8. Complete assessment

Set artifact `status: complete`.

Register in `inference/INDEX.md` under Component Artifacts.

## Evaluative Questions (Architecture)

- What evidence exists?
- What evidence is strongest?
- What evidence is weakest?
- What evidence supports the current interpretation?
- What evidence contradicts the current interpretation?
- What evidence is missing?
- What evidence may be unreliable?

## Governance Checklist

- [ ] All evidence referenced by source path
- [ ] Contradictory evidence evaluated — not resolved
- [ ] Perspectives evaluated with neutrality (CP-008)
- [ ] Evidence weighting applied — not equal weight assumed
- [ ] No findings, hypotheses, or recommendations in artifact
- [ ] Category separation maintained

## Do Not

- Duplicate evidence content from Context Package
- Resolve contradictory evidence
- Determine who is right among perspectives
- Include recommendations or decision support
- Request new evidence without creating retrieval request

## Next Step

`assumption-review-workflow.md` or continue within `interpretation-workflow.md`.
