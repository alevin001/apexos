# Retrieval Workflows

Step-by-step workflows for operating the Retrieval Layer. These are manual, founder-buildable processes — not application code.

## Workflows

| Workflow | Purpose |
|----------|---------|
| `retrieval-pipeline.md` | End-to-end retrieval from context handoff to package delivery |
| `evidence-assembly.md` | Locate, rank, and assemble evidence |
| `contradictory-evidence-workflow.md` | Seek and document contradictory evidence |
| `retrieval-validation.md` | Validate assembled packages before inference handoff |
| `package-delivery.md` | Deliver Context Package to inference |

## General Rules

1. Reference Retrieval Architecture before assembling evidence.
2. Update `retrieval/INDEX.md` after every request, assembly, delivery, or validation.
3. Link all evidence to source paths — never duplicate content.
4. Execute context relevance specification — do not override without context review.
5. Include contradictory evidence — document absence if none found.
6. Evidence precedes inference — validate before delivery.
7. See `governance/evidence-first-checklist.md` and `governance/retrieval-fidelity-checklist.md`.

## Retrieval Pipeline

```
context handoff
        ↓
retrieval-pipeline.md       →  requests/
        ↓
evidence-assembly.md        →  evidence/
        ↓
contradictory-evidence-workflow.md
        ↓
retrieval-validation.md
        ↓
package-delivery.md         →  context-package/
        ↓
inference/
```

## AI-Assisted Development

These workflows are designed for AI-assisted execution in Cursor:

- Provide the workflow file and context reference to the agent.
- Require the agent to use templates and update `INDEX.md`.
- Require human validation before package delivery.
- Verify all evidence items have verified source paths.

## Relationship to Context Workflows

Retrieval begins after context handoff from `context/workflows/context-assembly.md`. If retrieval reveals relevance gaps, trigger `context/workflows/context-review.md` — do not silently adjust scope.
