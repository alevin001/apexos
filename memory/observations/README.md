# Observations

## Responsibility

Stores initial interpretations of source information during the **Observation** stage of the Memory Promotion Model. Observations are useful but low confidence — they are not distilled memory.

## Architecture Reference

- **Primary:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx` (Memory Promotion Model — Observation stage)
- **Governance:** `governance/source-fidelity/memory-layer.md`

## Promotion Model Position

```
Source Information → Observation → Memory → Pattern → Reinforcement
                          ↑
                    observations/
```

| Stage | This folder? | Confidence |
|-------|--------------|------------|
| Observation | Yes | Low — requires review before promotion |
| Memory | No — use category folders | Retained distilled intelligence |
| Pattern | No — use `pattern/` | Validated after repeated evidence |

## What Belongs Here

- Initial interpretation extracted from a meeting, document, or interaction
- Hypotheses about a person, relationship, or situation not yet validated
- Draft intelligence pending executive or governance review

## What Does Not Belong Here

- Raw source files — use `knowledge/source_material/`
- Distilled memory ready for retention — promote to the appropriate category folder
- Validated patterns — use `memory/pattern/` only after repeated evidence
- Source summaries — summarizing source material is not observation or memory

## Template and Workflow

| Artifact | Path |
|----------|--------|
| Template | `templates/observation.md` |
| Create | `workflows/create-observation.md` |
| Promote | `workflows/promote-to-memory.md` |

## Traceability

Every observation must link to `originating_knowledge` — the source in `knowledge/` from which the interpretation was derived.
