# Memory Retrieval

## Responsibility

Retrieve evidence from memory categories to support context package assembly.

## Architecture Reference

- **Primary:** `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx` (Retrieval Targets)

## Retrieval Targets

Executive memory, person memory, relationship memory, situation memory, decision memory, pattern memory, outcome/results memory.

## Source Layer (Build 03)

Retrieves from `memory/` subfolders:

| Retrieval Target | Source Folder |
|------------------|---------------|
| Executive memory | `memory/executive/` |
| Person memory | `memory/person/` |
| Relationship memory | `memory/relationship/` |
| Situation memory | `memory/situation/` |
| Decision memory | `memory/decision/` |
| Pattern memory | `memory/pattern/` |
| Outcome/results memory | `memory/outcome-results/` |

Observations in `memory/observations/` are pre-promotion staging — not primary retrieval targets.

## Registry

Artifact locations and IDs are tracked in `memory/INDEX.md`.

## Organization Guide

See `memory/REPOSITORY-GUIDE.md` for naming conventions, confidence levels, and traceability fields used during retrieval ranking.

## Ranking Signals

Retrieval Architecture ranking signals apply: situation relevance, outcome/results impact, pattern strength, relationship significance, strategic significance, recency (as one factor).

See `retrieval/docs/retrieval-ranking.md`.

## Workflows (Build 04)

| Workflow | Purpose |
|----------|---------|
| `retrieval/workflows/evidence-assembly.md` | Search and rank memory artifacts |
| `retrieval/workflows/retrieval-pipeline.md` | End-to-end retrieval from context handoff |
| `retrieval/workflows/contradictory-evidence-workflow.md` | Include conflicting memory evidence |

## Templates

Memory artifacts are referenced by path in `retrieval/templates/evidence-package.md` — content is not duplicated.

## Implementation Scope

Build 04 defines full retrieval design. See `retrieval/REPOSITORY-GUIDE.md`.
