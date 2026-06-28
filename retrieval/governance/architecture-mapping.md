# Retrieval Architecture Mapping

Maps Retrieval Architecture v1.0 to Build 04 implementation artifacts. This document traces implementation back to architecture — it does not redefine architecture.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005)
- Architecture & Doctrine Index v2.0 — DOC-005, LAD-007, LAD-008, AF-006, AF-007, AF-008

## Core Principles

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| LAD-007 — Retrieval executes context relevance | `REPOSITORY-GUIDE.md`, `workflows/retrieval-pipeline.md` |
| LAD-008, AF-007 — Evidence First | `governance/evidence-first-checklist.md`, `docs/evidence-assembly.md` |
| AF-006 — Retrieval assembles evidence for effectiveness | `docs/retrieval-objectives.md` |
| AF-008 — Contradictory Evidence | `docs/contradictory-evidence.md`, `workflows/contradictory-evidence-workflow.md` |
| Smallest effective set | `docs/retrieval-objectives.md`, `docs/retrieval-ranking.md` |

## Retrieval Flow

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Retrieval Flow | `workflows/retrieval-pipeline.md` |
| Context handoff | `requests/`, `templates/retrieval-request.md` |
| Evidence assembly | `evidence/`, `workflows/evidence-assembly.md` |
| Context Package creation | `context-package/`, `workflows/package-delivery.md` |

## Retrieval Targets

| Architecture Target | Implementation |
|--------------------|----------------|
| Knowledge retrieval | `knowledge/README.md`, `retrieval/knowledge/README.md` |
| Memory retrieval | `memory/INDEX.md`, `retrieval/memory/README.md` |
| Evidence retrieval | `evidence/`, `docs/evidence-assembly.md` |
| Pattern retrieval | `retrieval/pattern/README.md`, `memory/pattern/` |
| Context Package | `context-package/`, `docs/context-package-assembly.md` |

## Evidence Assembly

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Evidence Assembly Principle | `docs/evidence-assembly.md`, `templates/evidence-package.md` |
| Supporting evidence | Evidence package tier sections |
| Contradictory evidence | `templates/contradictory-evidence.md`, contradictory workflow |
| Alternative perspectives | Evidence package alternative perspectives section |

## Retrieval Ranking

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Ranking signals | `docs/retrieval-ranking.md` |
| Recency as one factor | Ranking rules in docs and evidence assembly workflow |

## Context Package Assembly

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Critical Context tier | `docs/context-package-assembly.md`, package structure |
| Supporting Context tier | Same |
| Available Context tier | Same |
| Package contents | `workflows/package-delivery.md` |

## Governance

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Retrieval drift | `governance/retrieval-fidelity-checklist.md`, validation workflow |
| Traceability | `docs/retrieval-traceability.md`, `governance/traceability/README.md` |
| Fidelity | `governance/source-fidelity/retrieval-layer.md` |

## Cross-Layer Boundaries

| Boundary | Implementation |
|----------|----------------|
| Context vs Retrieval | `context/docs/context-packages.md`, `REPOSITORY-GUIDE.md` |
| Retrieval vs Inference | `docs/retrieval-objectives.md`, package delivery workflow |
| Knowledge vs Memory in retrieval | `knowledge/README.md`, `memory/REPOSITORY-GUIDE.md` |
| Search vs retrieval | `docs/retrieval-objectives.md` — retrieval is evidence assembly |

## Build References

| Build | Deliverable |
|-------|-------------|
| Build 02 | Knowledge retrieval targets — `retrieval/knowledge/README.md` |
| Build 03 | Memory retrieval targets — `retrieval/memory/README.md` |
| Build 04 | This mapping and all referenced artifacts |
| Build 01 | Subfolder structure preserved |
