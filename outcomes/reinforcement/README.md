# Reinforcement

## Responsibility

Dynamic confidence recalibration and pattern reinforcement or weakening based on observed outcomes.

## Architecture Reference

- **Primary:** `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx` (Confidence Recalibration, Pattern Reinforcement, Pattern Weakening, Reinforcement Update)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (LAD-017, AF-016)

## Confidence Increases When

Recommendations repeatedly succeed, assumptions repeatedly validate, patterns repeatedly validate, outcomes consistently support prior conclusions.

## Confidence Decreases When

Recommendations repeatedly fail, assumptions repeatedly fail, patterns repeatedly fail, outcomes repeatedly contradict prior conclusions.

## Principle

Confidence should remain dynamic. Patterns must be reinforced or weakened based on observed outcomes — pattern existence does not guarantee future effectiveness (AF-016).

## Artifact Conventions

| Template | Naming | Location |
|----------|--------|----------|
| `templates/confidence-recalibration-template.md` | `out-con-recal-{short-slug}.md` | This folder |
| `templates/reinforcement-update-template.md` | `out-rnf-{short-slug}.md` | This folder |

## Workflows

- `workflows/confidence-recalibration-workflow.md`
- `workflows/reinforcement-workflow.md`
- `workflows/pattern-evaluation-workflow.md` (feeds reinforcement)

## Distinction from Memory

Reinforcement updates adjust confidence and pattern weight. Pattern storage lives in `memory/pattern/` — reinforcement does not rewrite pattern history.
