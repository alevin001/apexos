# Workflows

Operational workflows for the Recommendation Layer.

## Architecture Reference

- Recommendation Architecture v1.0 — Recommendation Model
- `REPOSITORY-GUIDE.md` — recommendation flow and naming conventions

## Workflows

| Workflow | Purpose |
|----------|---------|
| `recommendation-workflow.md` | End-to-end pipeline from Interpretation Package to Recommendation Package |
| `objective-alignment-workflow.md` | Desired outcome clarification |
| `option-generation-workflow.md` | Multiple viable courses of action |
| `doctrine-evaluation-workflow.md` | Charter doctrine alignment assessment |
| `tradeoff-analysis-workflow.md` | Explicit tradeoff identification |
| `recommendation-confidence-workflow.md` | Independent confidence evaluation |

## Execution Order

```
Interpretation Package received
  → objective-alignment-workflow.md
  → option-generation-workflow.md
  → doctrine-evaluation-workflow.md
  → risk assessment (via recommendation-workflow.md)
  → opportunity assessment (via recommendation-workflow.md)
  → tradeoff-analysis-workflow.md
  → recommendation-confidence-workflow.md
  → recommendation-workflow.md (assembly and delivery)
```

Individual workflows may be executed as focused reviews. The recommendation workflow orchestrates the full pipeline.

## Prerequisites

All recommendation workflows require:

- Handed-off Interpretation Package from `inference/interpretation/`
- Inference review passed via `inference/governance/inference-review-checklist.md`
- No recommendation contamination in inference artifacts

## Handoff

After `recommendation-workflow.md` completes and `governance/recommendation-review-checklist.md` passes:

- Deliver Recommendation Package for executive decision support
- Register in `recommendation/INDEX.md`
- Identify outcome tracking considerations for `outcomes/`
