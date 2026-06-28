# Inference Governance

Layer-specific governance controls for the Inference Layer.

## Documents

| Document | Purpose |
|----------|---------|
| `inference-governance.md` | Governance principles, responsibilities, drift controls |
| `interpretation-boundaries.md` | Layer and category boundary rules |
| `inference-review-checklist.md` | Pre-handoff validation checklist |
| `inference-traceability.md` | Traceability requirements and chain |

## Cross-Layer Controls

| Control | Location |
|---------|----------|
| Source fidelity | `governance/source-fidelity/inference-layer.md` |
| Global traceability | `governance/traceability/README.md` |

## Quick Reference

Before handing off Interpretation Package to recommendation:

1. Run `inference-review-checklist.md`
2. Verify `interpretation-boundaries.md` compliance
3. Confirm traceability per `inference-traceability.md`
4. Update `inference/INDEX.md`
