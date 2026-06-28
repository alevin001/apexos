# Context Packages

Clarifies the distinction between context evaluation output (this layer) and the assembled Context Package (Retrieval layer).

## Architecture Reference

- Context Architecture v1.0 (DOC-004) — Primary Output
- Retrieval Architecture v1.0 (DOC-005) — Context Package Assembly, Retrieval Output

## Two Artifacts, Two Layers

| Artifact | Layer | Location | Contains |
|----------|-------|----------|----------|
| Context evaluation / relevance specification | Context | `context/` | What matters, domain weights, evaluation rationale |
| Context Package (assembled) | Retrieval | `retrieval/context-package/` | Evidence, perspectives, patterns, relationships, strategic considerations |

Context determines relevance. Retrieval assembles evidence into the Context Package prepared for inference.

## Context Layer Output

The context layer produces a **relevance specification** — documented using `templates/context-package.md` and `templates/context-evaluation.md`:

- Situation definition
- Domains evaluated and excluded
- Domain weights and weighting rationale
- Memory and knowledge references flagged for retrieval
- Critical vs supporting vs available relevance tiers (intent, not evidence)
- Handoff criteria for retrieval

This output contains **no assembled evidence**. It tells retrieval what to find — not what was found.

## Retrieval Layer Output

Retrieval assembles the Context Package using `retrieval/templates/` and `retrieval/workflows/package-delivery.md`:

| Tier | Purpose |
|------|---------|
| Critical Context | Must be understood before interpretation |
| Supporting Context | Improves confidence and understanding |
| Available Context | Useful but not immediately necessary |

Package contents include relevant evidence, perspectives, outcomes/results, patterns, relationships, and strategic considerations (Retrieval Architecture).

## Flow

```
Context evaluation (context/)
        ↓
Retrieval request (retrieval/)
        ↓
Evidence assembly (retrieval/evidence/)
        ↓
Context Package (retrieval/context-package/)
        ↓
Inference (inference/)
```

## Rules

- Do not populate evidence in context layer artifacts.
- Do not skip context evaluation and assemble packages directly from memory search.
- Context Package assembly tiers map to context weighting tiers — retrieval executes what context specified.
- If retrieval discovers evidence that changes relevance, document the adjustment in a context review — do not silently change the relevance specification.

## Templates

| Layer | Template | Purpose |
|-------|----------|---------|
| Context | `templates/context-package.md` | Relevance specification for retrieval handoff |
| Context | `templates/context-evaluation.md` | Domain evaluation record |
| Retrieval | `retrieval/templates/evidence-package.md` | Assembled evidence before packaging |
| Retrieval | `retrieval/context-package/` | Final assembled package for inference |
