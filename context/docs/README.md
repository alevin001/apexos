# Context Documentation

Implementation documentation for the Context Layer. These documents translate Context Architecture v1.0 into repository conventions — they do not redefine architecture.

## Documents

| Document | Purpose | Architecture Reference |
|----------|---------|------------------------|
| `context-domains.md` | Context domain definitions and evaluation scope | Context Architecture — Context Domains |
| `context-packages.md` | Context evaluation output vs assembled Context Package | Context Architecture — Primary Output; Retrieval Architecture — Context Package Assembly |
| `context-weighting.md` | Weighting signals and application rules | Context Architecture — Context Weighting |
| `context-lifecycle.md` | Lifecycle stages from intake through archive | Context Architecture — Context Lifecycle |
| `context-governance.md` | Governance requirements for context artifacts | Governance Architecture — Context Drift |
| `context-traceability.md` | Traceability fields and audit requirements | Governance Architecture — Transparency Principle |

## Usage

Read `../REPOSITORY-GUIDE.md` first for organization rules. Use these documents for operational detail when executing workflows in `../workflows/`.

## Boundaries

- Context documentation describes relevance determination — not evidence assembly (see `retrieval/docs/`).
- Context documentation does not duplicate Memory Architecture storage rules (see `memory/REPOSITORY-GUIDE.md`).
