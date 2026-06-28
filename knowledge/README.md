# Knowledge Layer

## Responsibility

This folder implements the Knowledge Layer — the expandable intelligence layer of ApexOS. It stores usable knowledge (doctrine references, frameworks, reference material, and source documents) that improves interpretation, recommendations, communication, leadership effectiveness, and outcomes.

Knowledge exists to improve decisions, not merely preserve information.

## Architecture Reference

- **Primary:** `architecture/1 - ApexOS - Project Charter v1.0.docx` (Section 13 — Knowledge & Framework Sources)
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Knowledge Architecture)
- **Memory:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx` (Source vs Memory Principle)
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Knowledge Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (FAB-002 — Knowledge Repository Architecture)

## Build 02 Status

**Complete.** Repository organization, templates, workflows, and registry are defined.

| Artifact | Purpose |
|----------|---------|
| `REPOSITORY-GUIDE.md` | Organization rules, naming, boundaries |
| `INDEX.md` | Human-readable registry of knowledge artifacts |
| `templates/` | Portable artifact templates |
| `workflows/` | Operational workflows for adding and migrating content |

## Subfolders

| Folder | Responsibility |
|--------|----------------|
| `doctrine/` | Doctrine indices and traceable references to Charter — not duplicated doctrine text |
| `frameworks/` | Leadership, communication, negotiation, and behavioral frameworks; concept artifacts |
| `reference/` | Derived reference materials supporting executive guidance |
| `source_material/` | Primary source documents — books, PDFs, articles, transcripts, internal documents |
| `templates/` | Artifact templates (Build 02) |
| `workflows/` | Operational workflows (Build 02) |

## Knowledge Structures (Technical Architecture v0.1)

| Structure | Storage | Template |
|-----------|---------|----------|
| Knowledge Source | `source_material/` + `.meta.md` companion | `templates/knowledge-source.meta.md` |
| Framework | `frameworks/` | `templates/framework.md` |
| Concept | `frameworks/` (`concept-` prefix) | `templates/concept.md` |
| Reference | `reference/{topic}/` | `templates/reference.md` |

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `architecture/` | Authoritative architecture documents — not knowledge inventory |
| `docs/knowledge base/` | Legacy materials — migrate via `workflows/migrate-legacy-materials.md` |
| `memory/` | Distilled intelligence — Build 03; do not store in `knowledge/` |
| `retrieval/knowledge/` | Retrieves from this layer |
| `governance/source-fidelity/` | Protects knowledge fidelity (LAD-010, LAD-011) |

## Source vs Memory

```
Source Information  →  Observation  →  Memory  →  Pattern  →  Reinforcement
     ↑                                        ↑
source_material/                           memory/ (Build 03)
```

Raw sources stay in `source_material/`. Distilled intelligence belongs in `memory/`.

## Quick Start

1. Read `REPOSITORY-GUIDE.md`
2. Choose workflow from `workflows/`
3. Copy template from `templates/`
4. Register artifact in `INDEX.md`

## FAB-002

Repository-level organization is defined in Build 02. Digital implementation of Knowledge Repository Architecture (FAB-002) is deferred to Build 07. Repository conventions are portable and may map to database structures without changing logical architecture.
