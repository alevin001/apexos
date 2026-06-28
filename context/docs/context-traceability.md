# Context Traceability

Traceability requirements for context layer artifacts.

## Architecture Reference

- Governance Architecture v1.0 (DOC-006) — Transparency Principle
- Context Architecture v1.0 (DOC-004) — Situation-Centered Model
- Retrieval Architecture v1.0 (DOC-005) — Retrieval Traceability

## Objective

Sufficient transparency to explain why certain context was considered relevant, why domains were weighted, and why retrieval was scoped as it was — not perfect explainability.

## Required Links

Every context evaluation must maintain:

| Link | Field | Target |
|------|-------|--------|
| Situation | `situation_summary`, `related_situation` | Situation being evaluated |
| Memory | `memory_references` | Relevant `memory/` artifacts consulted for relevance |
| Knowledge | `knowledge_references` | Relevant `knowledge/` artifacts flagged for retrieval |
| Weighting | `domain_weights` | Documented weights and rationale |
| Retrieval | `retrieval_request` | Retrieval request when handed off |
| Review | Review artifact link | Post-outcome context review when available |

## Frontmatter Traceability Fields

Defined in `../REPOSITORY-GUIDE.md` and templates:

- `id` — registry identifier
- `domain` — primary context domain
- `evaluation_date` — when evaluation occurred
- `memory_references` — paths to memory artifacts
- `knowledge_references` — paths to knowledge artifacts
- `retrieval_request` — path to retrieval request after handoff
- `transformation_log` — record of changes during refresh or review
- `review_status` — review outcome

## Traceability Chain

```
Situation intake (context/situation/)
        ↓
Context evaluation (context/)
        ↓
Retrieval request (retrieval/)
        ↓
Evidence assembly (retrieval/evidence/)
        ↓
Context Package (retrieval/context-package/)
        ↓
Inference (inference/)
        ↓
Outcome (outcomes/)
        ↓
Context review (context/)
```

Each stage links forward and backward where applicable. Broken chains indicate governance failure.

## What Context Traceability Must Explain

| Question | Traceability source |
|----------|---------------------|
| What situation was evaluated? | Situation intake artifact |
| Which domains were evaluated and weighted? | Context evaluation, weighting template |
| Why were domains excluded? | Weighting rationale |
| What memory was considered relevant? | `memory_references` |
| What was retrieved and why? | Retrieval request and retrieval traceability |
| Were relevance decisions effective? | Context review artifact |

## Cross-Layer Traceability

See also:

- `governance/traceability/README.md` — cross-layer traceability
- `governance/source-fidelity/context-layer.md` — fidelity controls
- `retrieval/docs/retrieval-traceability.md` — retrieval-side traceability

## AI-Assisted Context

When AI assists context evaluation:

- Log assistance in `transformation_log`
- Mark AI-suggested domain weights as requiring human confirmation before handoff
- Do not treat AI relevance suggestions as memory or inference
