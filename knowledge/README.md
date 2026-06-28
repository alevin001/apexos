# Knowledge Layer

## Responsibility

This folder implements the Knowledge Layer — the expandable intelligence layer of ApexOS. It stores usable knowledge (doctrine, frameworks, reference material, and source documents) that improves interpretation, recommendations, communication, leadership effectiveness, and outcomes.

Knowledge exists to improve decisions, not merely preserve information.

## Architecture Reference

- **Primary:** `architecture/1 - ApexOS - Project Charter v1.0.docx` (Section 13 — Knowledge & Framework Sources)
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Knowledge Architecture)
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Knowledge Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (FAB-002 — Knowledge Repository Architecture, open backlog)

## Subfolders

| Folder | Responsibility |
|--------|----------------|
| `doctrine/` | Charter-derived doctrines, prime doctrines, behavioral doctrines |
| `frameworks/` | Leadership, communication, negotiation, and behavioral frameworks |
| `reference/` | Reference materials supporting executive guidance |
| `sources/` | Source documents — books, PDFs, articles, transcripts, internal documents |

## Relationship to Other Layers

- **Architecture documents** remain in `architecture/` — they are authoritative source documents, not implementation artifacts.
- **Legacy reference materials** currently in `docs/knowledge base/` will be organized in Build 02.
- **Retrieval** accesses knowledge through `retrieval/knowledge/`.
- **Governance** protects source fidelity through `governance/source-fidelity/`.

## Knowledge Structure (Technical Architecture v0.1)

Technical Architecture defines three knowledge structures:

- **Knowledge Source** — title, author, source, type, summary, tags
- **Framework** — name, description, source, related concepts
- **Concept** — name, definition, related frameworks, related situations, related outcomes

Implementation of these structures is deferred to Build 02 and Build 07.

## Open Clarifications

- **FAB-002 — Knowledge Repository Architecture** is listed as open backlog in the Architecture & Doctrine Index. Build 02 will address organization details not yet specified in completed architecture.
