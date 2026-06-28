# Situation Context

## Responsibility

Situation-centered entry point for context evaluation. The executive typically seeks assistance with a situation, not information for its own sake.

## Architecture Reference

- **Primary:** `architecture/4 - ApexOS - Context Architecture v1.0.docx` (Situation-Centered Context Model)
- **Foundations:** `architecture/2 - ApexOS - Foundations Architecture v1.0.docx` (Situation object)

## Examples

Leadership disagreements, strategic decisions, personnel issues, organizational challenges, communication challenges, negotiations, opportunity evaluations.

## Flow Entry Point

All context evaluation begins from a situation and flows through context domains before retrieval and inference.

## Artifact Conventions (Build 04)

| Item | Convention |
|------|------------|
| Intake template | `../templates/context-evaluation.md` |
| Package template | `../templates/context-package.md` |
| Naming | `ctx-sit-{slug}.md`, `ctx-eval-{slug}.md`, `ctx-pkg-{slug}.md` |
| ID prefix | `CTX-SIT-`, `CTX-EVAL-`, `CTX-PKG-` |
| Registry | `../INDEX.md` |

## Workflows

| Workflow | Purpose |
|----------|---------|
| `../workflows/situation-intake.md` | Capture situation definition |
| `../workflows/context-assembly.md` | Evaluate domains and hand off to retrieval |

## Does Not Store

- Distilled intelligence (see `memory/situation/`)
- Assembled evidence (see `retrieval/context-package/`)

See `../REPOSITORY-GUIDE.md`.
