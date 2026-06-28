# Templates

Artifact templates for the Outcome & Results Layer.

## Architecture Reference

- Outcome & Results Architecture v1.0 (DOC-009) — Validation Outputs, Learning Loop
- `REPOSITORY-GUIDE.md` — naming conventions and field definitions

## Templates

| Template | Purpose | Output Location |
|----------|---------|-----------------|
| `validation-package-template.md` | Primary output — consolidated validation | `validation/` |
| `outcome-capture-template.md` | Action taken and observed results | `outcome-tracking/` |
| `recommendation-validation-template.md` | Validate recommendation against outcomes | `validation/` |
| `decision-validation-template.md` | Validate executive decision against outcomes | `validation/` |
| `assumption-validation-template.md` | Validate assumptions against outcomes | `assumptions/` |
| `pattern-validation-template.md` | Evaluate patterns against outcomes | `validation/` |
| `confidence-recalibration-template.md` | Dynamic confidence adjustment | `reinforcement/` |
| `reinforcement-update-template.md` | Pattern reinforcement or weakening | `reinforcement/` |
| `learning-update-template.md` | Validated learning for promotion | `learning/` |
| `executive-follow-up-template.md` | Proactive follow-up and re-validation | `follow-up/` |

## Usage

1. Copy template to the appropriate output folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Populate from Recommendation Package, outcome capture, and observed results — do not generate recommendations or re-perform inference.
4. Link component artifacts in Validation Package frontmatter.
5. Register in `INDEX.md`.

## Category Rules

Templates enforce category separation:

- **Recommendation** — referenced from Recommendation Package — not re-evaluated as decision support
- **Decision** — referenced externally — not stored as recommendation
- **Action** — what was actually done — distinct from recommendation
- **Observed outcome** — what actually occurred — distinct from expected consequences
- **Validation** — assessment of outcomes against prior conclusions
- **Validated learning** — confirmed through outcome evidence only
- **Historical records** — referenced — never rewritten
