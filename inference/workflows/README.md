# Workflows

Operational workflows for the Inference Layer.

## Architecture Reference

- Inference Architecture v1.0 — Interpretation Model
- `REPOSITORY-GUIDE.md` — inference flow and naming conventions

## Workflows

| Workflow | Purpose |
|----------|---------|
| `interpretation-workflow.md` | End-to-end pipeline from Context Package to Interpretation Package |
| `evidence-evaluation-workflow.md` | Evidence and perspective evaluation |
| `assumption-review-workflow.md` | Assumption identification and transparency |
| `blind-spot-workflow.md` | Blind spot identification across perspectives |
| `confidence-calibration-workflow.md` | Explicit confidence evaluation and insufficient evidence declaration |
| `competing-interpretation-workflow.md` | Competing explanation evaluation |

## Execution Order

```
Context Package received
  → evidence-evaluation-workflow.md
  → assumption-review-workflow.md
  → blind-spot-workflow.md
  → hypothesis evaluation (via interpretation-workflow.md)
  → competing-interpretation-workflow.md
  → confidence-calibration-workflow.md
  → interpretation-workflow.md (assembly and handoff)
```

Individual workflows may be executed as focused reviews. The interpretation workflow orchestrates the full pipeline.

## Prerequisites

All inference workflows require:

- Assembled Context Package from `retrieval/context-package/`
- Retrieval validation passed
- No inference contamination in retrieval artifacts

## Handoff

After `interpretation-workflow.md` completes and `governance/inference-review-checklist.md` passes:

- Deliver Interpretation Package to `recommendation/`
- Register in `inference/INDEX.md`
