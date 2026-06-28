# Retrieval Traceability

Traceability requirements for retrieval layer artifacts.

## Architecture Reference

- Governance Architecture v1.0 (DOC-006) — Transparency Principle
- Retrieval Architecture v1.0 (DOC-005) — Retrieval Traceability
- Context Architecture v1.0 (DOC-004) — Context handoff

## Objective

Sufficient transparency to explain why specific evidence was retrieved, how it was ranked, what was excluded, and what was delivered for inference — not perfect explainability.

## Required Links

Every retrieval artifact must maintain:

| Link | Field | Target |
|------|-------|--------|
| Context | `context_reference` | Context relevance specification in `context/` |
| Request | `retrieval_request` or parent request | Retrieval request artifact |
| Evidence | `evidence_package` | Evidence package in `retrieval/evidence/` |
| Package | `context_package` | Assembled package in `retrieval/context-package/` |
| Sources | Per-item source paths | `knowledge/` or `memory/` artifacts |
| Contradictory | `contradictory_evidence` | Contradictory evidence records |
| Validation | Review artifact | Retrieval review when completed |

## Traceability Chain

```
Context relevance specification (context/)
        ↓
Retrieval request (retrieval/requests/)
        ↓
Evidence assembly (retrieval/evidence/)
        ↓
Contradictory evidence (retrieval/evidence/)
        ↓
Context Package (retrieval/context-package/)
        ↓
Inference (inference/)
        ↓
Outcome (outcomes/)
        ↓
Retrieval review (retrieval/)
        ↓
Context review (context/) — if relevance adjustment needed
```

Broken chains indicate governance failure.

## What Retrieval Traceability Must Explain

| Question | Traceability source |
|----------|---------------------|
| What context specification guided retrieval? | `context_reference` |
| What was searched and assembled? | Evidence package |
| Why was each artifact included? | Assembly rationale in evidence package |
| What was excluded and why? | Exclusion documentation |
| Was contradictory evidence sought? | Contradictory evidence record |
| Does the package match context tiers? | Validation record |
| What was delivered for inference? | Context Package artifact |

## Frontmatter Traceability Fields

Defined in `../REPOSITORY-GUIDE.md` and templates:

- `id`, `context_reference`, `retrieval_targets`
- `assembly_tiers`, `evidence_package`, `context_package`
- `contradictory_evidence`, `validation_status`
- `transformation_log`

## Cross-Layer Traceability

See also:

- `context/docs/context-traceability.md` — context-side traceability
- `governance/traceability/README.md` — cross-layer traceability
- `governance/source-fidelity/retrieval-layer.md` — fidelity controls

## AI-Assisted Retrieval

When AI assists evidence assembly:

- Log assistance in `transformation_log`
- Require human validation before package delivery
- Do not treat AI-suggested evidence as validated without source path verification
- Mark AI-ranked artifacts for human review in evidence package
