# Context Workflows

Step-by-step workflows for operating the Context Layer. These are manual, founder-buildable processes — not application code.

## Workflows

| Workflow | Purpose |
|----------|---------|
| `situation-intake.md` | Capture situation definition and initial domain scan |
| `context-assembly.md` | Evaluate domains, weight relevance, produce handoff specification |
| `context-review.md` | Review relevance decisions after outcomes or retrieval validation |
| `context-refresh.md` | Update evaluation when situation evolves |
| `context-promotion.md` | Hand off insights to memory observation pipeline (not automatic) |

## General Rules

1. Reference Context Architecture before creating or updating context artifacts.
2. Update `context/INDEX.md` after every creation, handoff, review, or archive.
3. Reference memory and knowledge paths — never duplicate stored content.
4. Context determines relevance — do not infer conclusions or produce recommendations.
5. Hand off to retrieval explicitly — do not assemble evidence in context workflows.
6. See `governance/context-fidelity-checklist.md` before retrieval handoff.

## Context Pipeline

```
situation-intake.md     →  situation/
        ↓
context-assembly.md       →  evaluation + weighting + relevance specification
        ↓
retrieval/workflows/      →  evidence assembly (retrieval layer)
        ↓
context-review.md         →  validate relevance after outcomes
        ↓
context-refresh.md        →  update or archive
```

## AI-Assisted Development

These workflows are designed for AI-assisted execution in Cursor:

- Provide the workflow file and situation context to the agent.
- Require the agent to use templates and update `INDEX.md`.
- Require human confirmation of domain weights before retrieval handoff.
- Review all context artifacts for boundary violations (no inference, no evidence assembly).

## Relationship to Retrieval Workflows

Context workflows end at relevance specification handoff. Use `retrieval/workflows/retrieval-pipeline.md` for evidence assembly and Context Package delivery.

## Relationship to Memory Workflows

If context evaluation produces insights worth retaining long-term, use `context-promotion.md` to create a memory observation — never store distilled intelligence directly in context artifacts.
