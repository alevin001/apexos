# Templates

Artifact templates for the Recommendation Layer.

## Architecture Reference

- Recommendation Architecture v1.0 (DOC-008) — Recommendation Outputs, Cause-And-Effect Transparency Principle
- `REPOSITORY-GUIDE.md` — naming conventions and field definitions

## Templates

| Template | Purpose | Output Location |
|----------|---------|-----------------|
| `recommendation-package-template.md` | Primary output — executive decision support | `decision-support/` |
| `objective-alignment-template.md` | Desired outcome clarification | `decision-support/` |
| `option-generation-template.md` | Multiple viable courses of action | `options/` |
| `doctrine-evaluation-template.md` | Charter doctrine alignment assessment | `recommendations/` |
| `risk-assessment-template.md` | Action-level risk evaluation | `recommendations/` |
| `opportunity-assessment-template.md` | Action-level opportunity evaluation | `recommendations/` |
| `tradeoff-analysis-template.md` | Explicit tradeoff identification | `tradeoffs/` |
| `recommendation-confidence-template.md` | Independent confidence evaluation | `decision-support/` |

## Usage

1. Copy template to the appropriate output folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Populate from Interpretation Package — reference findings and evidence paths, do not re-infer.
4. Link component artifacts in Recommendation Package frontmatter.
5. Register in `INDEX.md`.

## Category Rules

Templates enforce category separation:

- **Evidence** — referenced from Interpretation Package and Context Package source paths
- **Findings** — referenced from Interpretation Package — not re-inferred
- **Hypotheses** — referenced from Interpretation Package — not promoted to recommendations
- **Assumptions** — visible and challengeable in all recommendation artifacts
- **Recommendations** — potential courses of action — not decisions
- **Decisions** — not in any recommendation template
