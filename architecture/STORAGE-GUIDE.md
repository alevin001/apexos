# Architecture Document Storage Guide

Build 02 implementation guide for storing and maintaining authoritative architecture documents.

## Purpose

Defines how architecture documents are stored, referenced, and protected. Architecture documents are **authoritative source documents** — not knowledge inventory and not implementation artifacts.

## Architecture Reference

- **Governance Architecture v1.0 (DOC-006):** Doctrine Supremacy, Fidelity Preservation (LAD-010)
- **Index (DOC-006 registry):** DOC-001 through DOC-009, Amendment Rule (Section 10)
- **Charter Section 15:** Evolution, Amendments & Governance

## Storage Location

All authoritative conceptual architecture documents live in `architecture/`.

```
architecture/
├── 1 - ApexOS - Project Charter v1.0.docx          # DOC-001 — highest authority
├── 2 - ApexOS - Foundations Architecture v1.0.docx  # DOC-002
├── 3 - ApexOS - Memory Architecture v1.0.docx       # DOC-003
├── 4 - ApexOS - Context Architecture v1.0.docx      # DOC-004
├── 5 - ApexOS - Retrieval Architecture v1.0.docx    # DOC-005
├── 6 - ApexOS - Governance Architecture v1.0.docx   # DOC-006
├── 7 - ApexOS - Inference Architecture v1.0.docx    # DOC-007
├── 8 - ApexOS - Recommendation Architecture v1.0.docx # DOC-008
├── 9 - ApexOS - Outcome & Results Architect v1.0.docx # DOC-009
├── 99 - ApexOS - Minimum Viable Index v2.0.docx     # Index (authoritative)
├── INDEX.md                                         # Index traceability (Build 11B)
├── Image - 0 - Overview.png                         # Diagrams
├── ...
└── README.md
```

Technical architecture lives separately in `technical_architecture/`.

| Document | File |
|----------|------|
| Technical Architecture v0.1 | `ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (TECH-001) |
| Runtime Integration Architecture | `runtime-integration-architecture.md` (TECH-002, Build 11B) |

## Document Hierarchy

```
Layer 1 — Doctrine (Charter, DOC-001)
Layer 2 — Core Architecture (DOC-002 through DOC-009)
         Index (cross-reference and registry)
Technical Architecture (implementation guidance, subordinate to conceptual architecture)
```

**Rule:** Implementation may support architecture. Implementation may not redefine architecture (LAD-002).

## Naming Convention

Architecture documents use the established naming pattern:

```
{sequence} - ApexOS - {Document Title} v{version}.docx
```

- Sequence numbers indicate reading order and registry ID mapping.
- Index document uses sequence `99`.
- Diagrams use `Image - {n} - {Title}.png`.

Do not rename architecture files without following amendment controls.

## What Belongs Here

| Belongs in `architecture/` | Does not belong |
|---------------------------|-----------------|
| Charter and architecture .docx files | Implementation guides (use layer folders) |
| Architecture diagrams (.png) | Knowledge inventory (use `knowledge/`) |
| Document registry (README.md) | Derived summaries of architecture content |
| Storage guide (this file) | Database schemas or application code |

## Adding Future Architecture Documents

New architecture documents require governance review per Index Section 10 (Amendment Rule):

1. Identify the affected source document
2. Identify the affected doctrine, principle, or decision
3. Provide rationale for amendment
4. Describe expected impact
5. Preserve visibility of all material changes

**FAB-001** (Amendment Management Architecture) remains open backlog. Until complete, follow the Index amendment rule and Charter Section 15.

### File placement

- Assign the next sequence number or use an established convention approved through amendment.
- Register in `architecture/README.md` document registry.
- Do not duplicate content into implementation folders.

## Relationship to Knowledge Layer

| `architecture/` | `knowledge/` |
|-----------------|--------------|
| Defines what ApexOS is and how it behaves | Stores expandable knowledge inventory |
| Frozen conceptual truth (governed amendments) | Evolves through curated expansion (Charter Section 13) |
| Charter Section 13 defines knowledge *philosophy* | Knowledge folder stores knowledge *inventory* |

Charter Section 13 explicitly separates governing philosophy from the evolving knowledge repository. Architecture documents define standards; `knowledge/` holds content governed by those standards.

## Fidelity Protection

Architecture documents are protected content:

- Do not summarize architecture documents in implementation folders in ways that create drift.
- Implementation READMEs may reference sections and IDs — they may not restate architecture as authoritative.
- See `governance/source-fidelity/README.md` and `governance/source-fidelity/knowledge-layer.md`.

## Backups

The `archive/` folder may hold backup copies (e.g., pre-formatting backups). Backups are not authoritative. The `architecture/` folder remains canonical.

## Diagrams

Architecture diagrams are stored alongside documents in `architecture/`. They are authoritative visual references. Do not recreate or modify diagrams in implementation folders without amendment visibility.

## Build Status

Build 02 — architecture storage conventions documented.
