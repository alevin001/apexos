# Retrieval Requests

Retrieval request artifacts linked from context relevance specifications. Each request scopes evidence assembly for a situation.

## Responsibility

Store retrieval request artifacts that translate context relevance specifications into retrieval execution plans.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Retrieval Pipeline
- Context Architecture v1.0 (DOC-004) — Handoff from context

## Conventions

| Item | Convention |
|------|------------|
| Template | `../templates/retrieval-request.md` |
| Naming | `ret-req-{short-slug}.md` |
| ID prefix | `RET-REQ-` |
| Required link | `context_reference` to context package artifact |

## Workflow

Created during `../workflows/retrieval-pipeline.md` after context handoff.

## Does Not Store

- Context evaluations (see `context/`)
- Assembled evidence (see `../evidence/`)
- Context Packages (see `../context-package/`)
