# Templates

Artifact templates for the Inference Layer.

## Architecture Reference

- Inference Architecture v1.0 (DOC-007) — Inference Outputs, Inferential Transparency Principle
- `REPOSITORY-GUIDE.md` — naming conventions and field definitions

## Templates

| Template | Purpose | Output Location |
|----------|---------|-----------------|
| `interpretation-package-template.md` | Primary output — synthesized interpretation | `interpretation/` |
| `evidence-assessment-template.md` | Evidence and perspective evaluation | `reasoning/` |
| `assumption-register-template.md` | Explicit assumption identification | `reasoning/` |
| `blind-spot-review-template.md` | Blind spot identification | `reasoning/` |
| `hypothesis-evaluation-template.md` | Plausible explanations not yet proven | `hypothesis-generation/` |
| `confidence-assessment-template.md` | Explicit confidence evaluation | `reasoning/` |
| `competing-interpretations-template.md` | Competing explanation evaluation | `reasoning/` |

## Usage

1. Copy template to the appropriate output folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Populate from assembled Context Package — reference source paths, do not duplicate evidence.
4. Link component artifacts in Interpretation Package frontmatter.
5. Register in `INDEX.md`.

## Category Rules

Templates enforce category separation:

- **Evidence** — referenced from Context Package source paths
- **Findings** — in Interpretation Package interpretive findings section
- **Hypotheses** — in hypothesis evaluation template only
- **Assumptions** — in assumption register only
- **Unknowns** — in Interpretation Package unknowns section
- **Recommendations** — not in any inference template
