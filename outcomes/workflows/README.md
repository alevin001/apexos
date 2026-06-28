# Workflows

Operational workflows for the Outcome & Results Layer.

## Architecture Reference

- Outcome & Results Architecture v1.0 (DOC-009) — Outcome Model, Validation Outputs, Learning Loop
- `REPOSITORY-GUIDE.md` — naming conventions and pipeline overview

## Workflows

| Workflow | Purpose |
|----------|---------|
| `outcome-pipeline-workflow.md` | Complete outcome pipeline — end to end |
| `validation-workflow.md` | Outcome validation and Validation Package assembly |
| `outcome-capture-workflow.md` | Capture action taken and observed results |
| `recommendation-validation-workflow.md` | Validate recommendation against outcomes |
| `assumption-validation-workflow.md` | Validate assumptions against outcomes |
| `pattern-evaluation-workflow.md` | Evaluate patterns against outcomes |
| `confidence-recalibration-workflow.md` | Dynamic confidence adjustment |
| `reinforcement-workflow.md` | Pattern reinforcement or weakening |
| `learning-promotion-workflow.md` | Promote validated learning to memory |
| `executive-follow-up-workflow.md` | Proactive follow-up and re-validation |

## Pipeline Overview

```
outcome-pipeline-workflow.md
  ├── outcome-capture-workflow.md
  ├── validation-workflow.md
  │     ├── recommendation-validation-workflow.md
  │     ├── assumption-validation-workflow.md
  │     └── pattern-evaluation-workflow.md
  ├── confidence-recalibration-workflow.md
  ├── reinforcement-workflow.md
  ├── learning-promotion-workflow.md
  └── executive-follow-up-workflow.md (when triggered)
```

## Governance

All workflows require `governance/outcome-review-checklist.md` before marking Validation Package `status: validated` or promoting learning.
