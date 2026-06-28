# Context Layer

## Responsibility

This folder implements the Context Layer — determining what information is most relevant to the current situation.

**Memory answers:** What does ApexOS know?

**Context answers:** What matters right now?

**Core principle:** Context exists to determine relevance, not to store information (LAD-006, AF-004).

## Architecture Reference

- **Primary:** `architecture/4 - ApexOS - Context Architecture v1.0.docx`
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Context Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (DOC-004, LAD-006, AF-005)

## Build 04 Status

**Complete.** Repository organization, templates, workflows, governance, and registry are defined.

| Artifact | Purpose |
|----------|---------|
| `REPOSITORY-GUIDE.md` | Organization rules, naming, boundaries, lifecycle |
| `INDEX.md` | Human-readable registry of context evaluations |
| `docs/` | Context domains, packages, weighting, lifecycle, governance, traceability |
| `templates/` | Context evaluation, weighting, relevance specification, review |
| `workflows/` | Situation intake, assembly, review, refresh, promotion |
| `governance/` | Fidelity checklist, drift detection, architecture mapping |

## Situation-Centered Model

```
Situation → Evaluate Context Domains → Load Relevant Context → Weight By Relevance → Context Evaluation → Retrieval
```

## Context Domains

| Folder | Domain |
|--------|--------|
| `situation/` | Situation-centered entry point — leadership disagreements, strategic decisions, negotiations, etc. |
| `executive/` | Current state of the executive |
| `person/` | Individual independent of any specific relationship |
| `relationship/` | How two individuals interact |
| `organizational/` | Current state of the organization |
| `strategic/` | Alignment against mission, objectives, priorities, doctrine |
| `pattern/` | Access to validated learning |
| `outcome-results/` | Evidence of what actually occurred |

## Build Plan Functional Areas

| Functional Area | Workflow |
|-----------------|----------|
| Situation assembly | `workflows/situation-intake.md` |
| Context construction | `workflows/context-assembly.md` |
| Relevant information selection | `docs/context-weighting.md` |

## Context Weighting

Context is not weighted by recency alone. Weighting signals: situation relevance, outcome/results impact, pattern strength, strategic significance, relationship significance, recency (as one factor among many).

See `docs/context-weighting.md`.

## Primary Output

Context produces a **relevance specification** for retrieval handoff — not assembled evidence. The assembled Context Package is created in `retrieval/context-package/`.

See `docs/context-packages.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `memory/` | Distilled intelligence — context references, does not duplicate |
| `knowledge/` | Source material — flagged for retrieval targeting |
| `retrieval/` | Executes relevance determinations; assembles Context Package |
| `governance/source-fidelity/context-layer.md` | Context fidelity and drift controls |

## Quick Start

1. Read `REPOSITORY-GUIDE.md`
2. Execute `workflows/situation-intake.md`
3. Execute `workflows/context-assembly.md`
4. Hand off to `retrieval/workflows/retrieval-pipeline.md`
5. Register in `INDEX.md`

## Governance

- Never store distilled intelligence in context artifacts
- Never assemble evidence in context — that is retrieval responsibility
- Context weighting must use multiple signals — not recency alone
- Run `governance/context-fidelity-checklist.md` before retrieval handoff

See `governance/source-fidelity/context-layer.md`.
