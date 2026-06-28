# Architecture Documents

## Responsibility

This folder contains the **authoritative source documents** for ApexOS conceptual architecture. These documents are the source of truth for all implementation decisions.

Implementation may support architecture. Implementation may not redefine architecture.

## Document Registry

| ID | Document | File |
|----|----------|------|
| DOC-001 | Project Charter v1.0 | `1 - ApexOS - Project Charter v1.0.docx` |
| DOC-002 | Foundations Architecture v1.0 | `2 - ApexOS - Foundations Architecture v1.0.docx` |
| DOC-003 | Memory Architecture v1.0 | `3 - ApexOS - Memory Architecture v1.0.docx` |
| DOC-004 | Context Architecture v1.0 | `4 - ApexOS - Context Architecture v1.0.docx` |
| DOC-005 | Retrieval Architecture v1.0 | `5 - ApexOS - Retrieval Architecture v1.0.docx` |
| DOC-006 | Governance Architecture v1.0 | `6 - ApexOS - Governance Architecture v1.0.docx` |
| DOC-007 | Inference Architecture v1.0 | `7 - ApexOS - Inference Architecture v1.0.docx` |
| DOC-008 | Recommendation Architecture v1.0 | `8 - ApexOS - Recommendation Architecture v1.0.docx` |
| DOC-009 | Outcome/Results Architecture v1.0 | `9 - ApexOS - Outcome & Results Architect v1.0.docx` |
| Index | Architecture & Doctrine Index v2.0 | `99 - ApexOS - Minimum Viable Index v2.0.docx` |

## Architecture Map

```
Layer 1 — Doctrine (Charter)
Layer 2 — Core Architecture
  ├── Foundations
  ├── Memory
  ├── Context
  ├── Retrieval
  ├── Governance
  ├── Inference
  ├── Recommendation
  └── Outcome/Results
```

## Governance Rules

- The Charter remains the highest authority (LAD-001)
- Architecture supports doctrine and may not redefine doctrine (LAD-002)
- These documents must be referenced before any implementation decision
- Do not summarize or duplicate architecture content in implementation folders in ways that create drift

## Diagrams

Architecture diagrams are stored alongside documents:

- `Image - 0 - Overview.png`
- `Image - 1 - Executive Learning Loop.png`
- `Image - 2 - Executive Operating Loop.png`
- `Image - 3 - Learning & Reinforcement Loop.png`
- `Image - 4 - Reasoning Pipeline.png`
- `Image - 5 - Evidence to Truth Model.png`

## Storage

Build 02 defines storage conventions in `STORAGE-GUIDE.md`:

- How architecture documents are stored and named
- How future architecture documents are added (amendment rule)
- How architecture documents relate to the Knowledge Layer

Architecture documents are authoritative source documents. They are not knowledge inventory — see `knowledge/REPOSITORY-GUIDE.md` for that separation.

## Fidelity

These documents are protected by fidelity preservation and no-silent-transformation principles. See `governance/source-fidelity/`.
