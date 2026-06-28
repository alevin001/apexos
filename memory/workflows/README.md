# Memory Workflows

Step-by-step workflows for operating the Memory Layer. These are manual, founder-buildable processes — not application code.

## Workflows

| Workflow | Purpose |
|----------|---------|
| `create-observation.md` | Record initial interpretation from source information |
| `promote-to-memory.md` | Promote observation to distilled memory in a category folder |
| `promote-to-pattern.md` | Promote validated memory to pattern after repeated evidence |
| `add-memory.md` | Add memory directly to a category (when observation stage is skipped with governance approval) |
| `link-outcome-reference.md` | Link memory artifacts to outcome evidence |
| `review-memory.md` | Periodic review, drift detection, and confidence adjustment |

## General Rules

1. Reference Memory Architecture before adding or promoting content.
2. Update `memory/INDEX.md` after every addition, promotion, or status change.
3. Preserve traceability to originating knowledge — never create orphan memory.
4. Do not summarize source documents into memory.
5. Observations are low confidence — do not treat as memory until promoted.
6. Patterns require repeated validated evidence — see `promote-to-pattern.md`.
7. Record every promotion in `promotion/` using `templates/promotion-record.md`.
8. See `governance/source-fidelity/memory-layer.md` for fidelity controls.

## Promotion Pipeline

```
knowledge/source_material/
        ↓
create-observation.md  →  observations/
        ↓
promote-to-memory.md   →  executive/ | person/ | relationship/ | situation/ | decision/ | outcome-results/
        ↓
promote-to-pattern.md  →  pattern/  (requires repeated evidence)
        ↓
review-memory.md       →  reinforcement / weakening / retirement
```

## AI-Assisted Development

These workflows are designed for AI-assisted execution in Cursor:

- Provide the workflow file and source context to the agent.
- Require the agent to use templates and update `INDEX.md`.
- Require promotion records for all promotions.
- Review all derived content for traceability and visible transformation.

## Relationship to Knowledge Workflows

When adding source material, use `knowledge/workflows/add-knowledge-source.md` and set `memory_promotion` in source metadata. Use memory workflows here to create observations and promote to memory — never store distilled intelligence in `knowledge/`.
