# Validation

## Responsibility

Primary output location for Validation Packages and validation component artifacts — the consolidated record of outcome validation.

## Architecture Reference

- **Primary:** `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx` (Outcome Validation, Validation Package, Validation Outputs)

## Contents

| Artifact | Template | Naming |
|----------|----------|--------|
| Validation Package | `templates/validation-package-template.md` | `val-pkg-{short-slug}.md` |
| Recommendation validation | `templates/recommendation-validation-template.md` | `out-rec-val-{short-slug}.md` |
| Decision validation | `templates/decision-validation-template.md` | `out-dec-val-{short-slug}.md` |
| Pattern validation | `templates/pattern-validation-template.md` | `out-pat-val-{short-slug}.md` |

## Workflow

Execute `workflows/validation-workflow.md` within `workflows/outcome-pipeline-workflow.md`.

## Governance

Run `governance/outcome-review-checklist.md` before marking Validation Package `status: validated`.
