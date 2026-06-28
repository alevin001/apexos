# Retrieval Layer

## Responsibility

This folder implements the Retrieval Layer — locating, assembling, prioritizing, and delivering the information most likely to improve interpretation, decisions, communication, relationships, alignment, and outcomes/results.

**Retrieval answers:** How does ApexOS find the right information?

**Context answers:** What information matters?

Retrieval executes the relevance determinations established by Context Architecture (LAD-007, AF-006).

## Architecture Reference

- **Primary:** `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx`
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Retrieval Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (DOC-005, LAD-007, LAD-008, AF-006, AF-008)

## Build 04 Status

**Complete.** Repository organization, templates, workflows, governance, and registry are defined.

| Artifact | Purpose |
|----------|---------|
| `REPOSITORY-GUIDE.md` | Organization rules, naming, boundaries, ranking |
| `INDEX.md` | Human-readable registry of retrieval artifacts |
| `requests/` | Retrieval request artifacts linked from context |
| `docs/` | Objectives, evidence assembly, ranking, package assembly, contradictory evidence |
| `templates/` | Retrieval request, evidence package, contradictory evidence, review |
| `workflows/` | Pipeline, evidence assembly, validation, package delivery |
| `governance/` | Evidence first checklist, retrieval fidelity checklist, architecture mapping |

## Core Principle

Retrieval exists to locate and assemble the **smallest set** of information most likely to improve executive effectiveness. Retrieval is not search — retrieval is evidence assembly.

Retrieval is optimized for relevance, usefulness, evidence quality, signal-to-noise ratio, and executive effectiveness — not completeness or maximum recall.

## Retrieval Flow

```
Situation → Context Determines Relevance → Retrieval Locates Evidence → Evidence Assembly → Context Package Creation → Inference
```

## Subfolders

| Folder | Responsibility |
|--------|----------------|
| `requests/` | Retrieval request artifacts scoped from context handoff |
| `knowledge/` | Retrieve knowledge that improves interpretation and recommendations |
| `memory/` | Retrieve evidence from memory categories |
| `evidence/` | Assemble supporting, contradictory, and alternative-perspective evidence |
| `pattern/` | Retrieve validated learning patterns |
| `context-package/` | Assemble the Context Package output for inference |

## Evidence First Principle

Evidence precedes inference. Inference does not precede evidence (LAD-008, AF-007).

See `governance/evidence-first-checklist.md`.

## Contradictory Evidence Principle

Retrieval must include supporting evidence, contradictory evidence, alternative perspectives, and competing interpretations (AF-008).

See `workflows/contradictory-evidence-workflow.md`.

## Context Package Assembly

| Tier | Purpose |
|------|---------|
| Critical Context | Must be understood before interpretation |
| Supporting Context | Improves confidence and understanding |
| Available Context | Useful but not immediately necessary |

See `docs/context-package-assembly.md` and `workflows/package-delivery.md`.

## Primary Output

A Context Package containing relevant evidence, perspectives, outcomes/results, patterns, relationships, and strategic considerations prepared for interpretation.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `context/` | Provides relevance specification — retrieval executes, does not override |
| `knowledge/` | Knowledge retrieval targets |
| `memory/` | Memory retrieval targets |
| `inference/` | Consumes Context Package — does not influence evidence selection |
| `governance/source-fidelity/retrieval-layer.md` | Retrieval fidelity and drift controls |

## Quick Start

1. Read `REPOSITORY-GUIDE.md`
2. Receive context handoff from `context/workflows/context-assembly.md`
3. Execute `workflows/retrieval-pipeline.md`
4. Validate via `workflows/retrieval-validation.md`
5. Deliver via `workflows/package-delivery.md`
6. Register in `INDEX.md`

## Governance

- Evidence precedes inference — validate before delivery
- Include contradictory evidence — document absence if none found
- Link all evidence to source paths — never duplicate content
- Run `governance/retrieval-fidelity-checklist.md` before package delivery

See `governance/source-fidelity/retrieval-layer.md`.
