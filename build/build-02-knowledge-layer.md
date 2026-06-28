# Build 02 — Knowledge Layer

**Status:** Complete  
**Deliverable:** Knowledge repository organization

## Scope

Translate Knowledge Layer architecture into repository implementation artifacts:

- How architecture documents are stored
- How future knowledge documents are stored
- How reference materials are stored
- Templates, workflows, governance, and registry

## Out of Scope (Preserved for Later Builds)

- Database schemas, SQL, application code (Build 07)
- Memory layer artifacts (Build 03)
- Context and retrieval implementation (Build 04)
- Digital FAB-002 implementation (Build 07 — repository conventions are portable)

## Artifacts Created

| Path | Purpose |
|------|---------|
| `knowledge/REPOSITORY-GUIDE.md` | Master organization guide |
| `knowledge/INDEX.md` | Artifact registry and legacy migration tracker |
| `knowledge/templates/` | Portable templates for sources, frameworks, concepts, reference |
| `knowledge/workflows/` | Operational workflows for adding and migrating content |
| `knowledge/doctrine/prime-doctrines-index.md` | Traceable doctrine index (no Charter duplication) |
| `architecture/STORAGE-GUIDE.md` | Architecture document storage conventions |
| `governance/source-fidelity/knowledge-layer.md` | Knowledge-specific fidelity controls |
| `docs/knowledge base/README.md` | Legacy folder migration pointer |
| `build/build-02-knowledge-layer.md` | This file |

## Artifacts Updated

| Path | Change |
|------|--------|
| `knowledge/README.md` | Build 02 complete; links to guides and templates |
| `knowledge/doctrine/README.md` | Storage rules for doctrine indices |
| `knowledge/frameworks/README.md` | Framework and concept conventions |
| `knowledge/reference/README.md` | Reference vs source boundary |
| `knowledge/source_material/README.md` | Type folders, naming, metadata pattern |
| `architecture/README.md` | Link to STORAGE-GUIDE.md |
| `governance/source-fidelity/README.md` | Link to knowledge-layer controls |
| `retrieval/knowledge/README.md` | Retrieval targets mapped to Build 02 structure |
| `readme.md` | Build 02 status; folder name correction |

## Architecture Traceability

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Charter Section 13 — Knowledge & Framework Sources | `knowledge/REPOSITORY-GUIDE.md`, quality standards, evolution principles |
| Charter Section 13 — Dynamic Knowledge Architecture | Separation of `architecture/` vs `knowledge/` |
| Charter Section 13 — Knowledge Repository Principles | `source_material/` type folders, registry, tagging via frontmatter |
| Technical Architecture v0.1 — Knowledge Source, Framework, Concept | Templates with required fields |
| Technical Architecture v0.1 — Knowledge Retrieval Goal | `retrieval/knowledge/README.md` |
| Memory Architecture — Source vs Memory Principle | Boundary rules in REPOSITORY-GUIDE and source_material README |
| Memory Architecture — Memory Promotion Model | Referenced in workflows; memory implementation deferred to Build 03 |
| Governance Architecture — LAD-010, LAD-011, AF-010 | `governance/source-fidelity/knowledge-layer.md` |
| Index FAB-002 | Repository organization defined; digital implementation deferred to Build 07 |
| Build Plan Build 02 | This deliverable |

## Next Build

**Build 03 — Memory Repository Structure**

Translate Memory Architecture into implementation artifacts for `memory/`.

## Validation Checklist

- [x] Repository structure from Build 01 preserved (`source_material/` not renamed)
- [x] No doctrine redesign — indices reference Charter, no duplication
- [x] No architecture redesign — guides implement existing architecture
- [x] No database schemas, SQL, or application code
- [x] Legacy materials documented with migration path, not deleted
- [x] FAB-002 addressed at repository level; digital implementation deferred
