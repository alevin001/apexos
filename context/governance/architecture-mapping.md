# Context Architecture Mapping

Maps Context Architecture v1.0 to Build 04 implementation artifacts. This document traces implementation back to architecture — it does not redefine architecture.

## Architecture Reference

- Context Architecture v1.0 (DOC-004)
- Architecture & Doctrine Index v2.0 — DOC-004, LAD-006, AF-004, AF-005

## Core Principles

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| LAD-006 — Context determines relevance, not storage | `REPOSITORY-GUIDE.md`, `docs/context-governance.md`, boundary rules |
| AF-004 — Context determines what matters | `docs/context-domains.md`, `workflows/situation-intake.md` |
| AF-005 — Multi-signal weighting, not recency alone | `docs/context-weighting.md`, `templates/context-weighting.md` |

## Situation-Centered Model

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Situation-Centered Context Model | `situation/`, `workflows/situation-intake.md` |
| Situation as entry point | `docs/context-domains.md`, `docs/context-lifecycle.md` |

## Context Domains

| Architecture Domain | Implementation Folder | Documentation |
|--------------------|-----------------------|---------------|
| Situation | `situation/` | `docs/context-domains.md` |
| Executive | `executive/` | `docs/context-domains.md` |
| Person | `person/` | `docs/context-domains.md` |
| Relationship | `relationship/` | `docs/context-domains.md` |
| Organizational | `organizational/` | `docs/context-domains.md` |
| Strategic | `strategic/` | `docs/context-domains.md` |
| Pattern | `pattern/` | `docs/context-domains.md` |
| Outcome/Results | `outcome-results/` | `docs/context-domains.md` |

## Build Plan Functional Areas

| Build Plan Area | Implementation |
|-----------------|----------------|
| Situation assembly | `workflows/situation-intake.md` |
| Context construction | `workflows/context-assembly.md` |
| Relevant information selection | `docs/context-weighting.md`, `templates/context-weighting.md` |

## Context Weighting

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Weighting signals | `docs/context-weighting.md` |
| Weight application | `templates/context-weighting.md`, `workflows/context-assembly.md` |

## Context Lifecycle

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Context Lifecycle | `docs/context-lifecycle.md` |
| Intake | `workflows/situation-intake.md` |
| Evaluation | `workflows/context-assembly.md`, `templates/context-evaluation.md` |
| Review | `workflows/context-review.md`, `templates/context-review.md` |
| Refresh | `workflows/context-refresh.md` |

## Primary Output

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Improved interpretation (via relevance) | `templates/context-package.md` — relevance specification |
| Context Package (assembled) | `retrieval/context-package/` — retrieval responsibility |

## Governance

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Context drift | `governance/context-drift-detection.md`, `workflows/context-review.md` |
| Fidelity | `governance/context-fidelity-checklist.md`, `governance/source-fidelity/context-layer.md` |
| Traceability | `docs/context-traceability.md`, `governance/traceability/README.md` |

## Cross-Layer Boundaries

| Boundary | Implementation |
|----------|----------------|
| Context vs Memory | `REPOSITORY-GUIDE.md` — Context vs Memory Boundary |
| Context vs Retrieval | `docs/context-packages.md` |
| Context vs Inference | `docs/context-governance.md` — no inference in context |
| Organizational context vs organizational memory | `organizational/README.md`, `memory/README.md` |

## Build Reference

| Build | Deliverable |
|-------|-------------|
| Build 04 | This mapping and all referenced artifacts |
| Build 01 | Domain folder structure preserved |
