# Decision Support

## Responsibility

Assemble the Recommendation Package as executive decision support — the final output of Recommendation Architecture before the executive decides.

## Architecture Reference

- **Primary:** `architecture/8 - ApexOS - Recommendation Architecture v1.0.docx` (Recommendation Outputs, Executive Agency Principle)
- **Template:** `templates/recommendation-package-template.md`
- **Workflow:** `workflows/recommendation-workflow.md`

## Package Contents

Objective assessment, primary recommendation, alternative recommendations, doctrine alignment, risk assessment, opportunity assessment, tradeoff analysis, supporting evidence, assumptions, confidence assessment, expected consequences, uncertainty assessment, outcome tracking considerations.

## Naming Conventions

| Artifact | Pattern |
|----------|---------|
| Recommendation Package | `rec-pkg-{short-slug}.md` |
| Objective alignment | `rec-obj-{short-slug}.md` |
| Recommendation confidence | `rec-con-{short-slug}.md` |

See `REPOSITORY-GUIDE.md`.

## Downstream

Executive decision leads to action, which leads to outcome capture in `outcomes/`. Recommendations do not equal decisions (LAD-014).

## Governance

Run `governance/recommendation-review-checklist.md` before delivery.
