# Pattern Retrieval

## Responsibility

Retrieve validated learning patterns relevant to the current situation.

## Architecture Reference

- **Primary:** `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx` (Retrieval Targets — Pattern Memory)
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Pattern retrieval)

## Retrieval Targets

Validated learning, successful approaches, failed approaches, recurring observations.

## Source Layer

Retrieves from `memory/pattern/` — validated pattern memory only.

Do not retrieve from `memory/observations/` — pre-promotion staging.

## Validation Note

Patterns retrieved here inform interpretation but must remain subject to outcome validation through `outcomes/`.

Include weakened patterns (`reinforcement_status: weakening`) in contradictory evidence workflow when applicable.

## Workflows (Build 04)

| Workflow | Purpose |
|----------|---------|
| `../workflows/evidence-assembly.md` | Search and rank pattern memory |
| `../workflows/contradictory-evidence-workflow.md` | Include conflicting or weakened patterns |

## Context Domain Relationship

`context/pattern/` evaluates pattern **relevance** to the situation. This folder retrieves pattern **evidence** for assembly.

## Documentation

See `../docs/retrieval-ranking.md` and `memory/workflows/promote-to-pattern.md` for pattern validation requirements.

## Registry

Pattern artifact locations tracked in `memory/INDEX.md`. Retrieval artifacts tracked in `../INDEX.md`.
