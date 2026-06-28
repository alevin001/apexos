# Memory Layer

## Responsibility

This folder implements the Memory Layer — distilled intelligence that ApexOS retains and uses to improve future outcomes and results.

**Core principle:** ApexOS remembers information only to the extent that it improves future outcomes and results (LAD-005, AF-003).

## Architecture Reference

- **Primary:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx`
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Memory Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (DOC-003, LAD-005)

## Build 03 Status

**Complete.** Repository organization, templates, workflows, promotion pipeline, and registry are defined.

| Artifact | Purpose |
|----------|---------|
| `REPOSITORY-GUIDE.md` | Organization rules, naming, boundaries, promotion model |
| `INDEX.md` | Human-readable registry of memory artifacts |
| `templates/` | Portable artifact templates |
| `workflows/` | Operational workflows for observation, promotion, review |
| `observations/` | Observation stage — pre-promotion staging |
| `promotion/` | Reviewable promotion audit records |

## Memory Categories

| Folder | Memory Category |
|--------|-----------------|
| `executive/` | Executive Memory — how the operator leads, communicates, and operates |
| `person/` | Person Memory — individuals and how they think, communicate, and respond |
| `relationship/` | Relationship Memory — evolution of leadership relationships over time |
| `situation/` | Situation Memory — recurring situations and their context |
| `decision/` | Decision Memory — choices made, rationale, and resulting outcomes |
| `pattern/` | Pattern Memory — validated learning after repeated observation |
| `outcome-results/` | Outcome/Results Memory — positive and negative results as validation evidence |

**Observation is not a memory category.** Initial interpretations are staged in `observations/` before promotion.

## Memory Promotion Model

```
Source Information → Observation → Memory → Pattern → Reinforcement
     ↑                    ↑              ↑
knowledge/           observations/   {category}/
```

See `REPOSITORY-GUIDE.md` and `workflows/` for operational details.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `knowledge/` | Source material — never duplicate into memory |
| `context/` | Determines which memory is relevant |
| `retrieval/memory/` | Retrieves memory evidence |
| `outcomes/` | Validates memory through observed results |
| `governance/source-fidelity/memory-layer.md` | Memory fidelity and drift controls |

## Build Plan Note

The Build Plan lists "Organizational memory" as a V1 component. Memory Architecture v1.0 does not define Organizational Memory as a separate category. Organizational conditions are addressed through **Organizational Context** in Context Architecture. Implementation should follow Memory Architecture unless amended — refer to Architecture & Doctrine Index amendment rules before creating an organizational memory category.

## Quick Start

1. Read `REPOSITORY-GUIDE.md`
2. Add source material via `knowledge/workflows/`
3. Create observation via `workflows/create-observation.md`
4. Promote via `workflows/promote-to-memory.md`
5. Register in `INDEX.md`

## Governance

- Never duplicate source documents into memory
- Never summarize source material into memory
- Memory promotion must remain reviewable
- Patterns emerge only after repeated validated observations

See `governance/source-fidelity/memory-layer.md`.
