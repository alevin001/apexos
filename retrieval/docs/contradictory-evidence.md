# Contradictory Evidence

Requirements for including contradictory evidence in retrieval assembly.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Contradictory Evidence Principle
- Architecture & Doctrine Index v2.0 — AF-008

## Core Principle

Retrieval must include:

- Supporting evidence
- Contradictory evidence
- Alternative perspectives
- Competing interpretations

This reduces confirmation bias, executive blind spots, organizational blind spots, and system drift.

## When Contradictory Evidence Is Required

| Condition | Action |
|-----------|--------|
| Known conflict between memory artifacts | Include both; document conflict |
| Outcome evidence contradicts pattern or memory | Include contradictory outcome reference |
| Multiple frameworks suggest different approaches | Include competing interpretations |
| Source material conflicts with memory | Include both with traceability |
| Executive assumption challenged by evidence | Include challenging evidence explicitly |
| No conflicts identified | Document "no contradictory evidence identified" with search scope |

Absence of contradictory evidence is not assumed — document the search for it.

## Contradictory Evidence Sources

| Source | Location |
|--------|----------|
| Conflicting memory | `memory/{category}/` — different confidence or review status |
| Contradictory outcomes | `memory/outcome-results/` |
| Alternative frameworks | `knowledge/frameworks/` |
| Primary source conflicts | `knowledge/source_material/` |
| Weakened patterns | `memory/pattern/` with `reinforcement_status: weakening` |

## Documentation Requirements

Use `../templates/contradictory-evidence.md`:

| Field | Purpose |
|-------|---------|
| Conflict description | What contradicts what |
| Source paths | Traceability to both sides |
| Confidence levels | From source artifact frontmatter |
| Impact on interpretation | What inference must reconcile — not inference itself |
| Resolution status | unresolved \| context_review_needed \| documented_tradeoff |

## Placement in Context Package

Contradictory evidence appears as a dedicated section in the Context Package — not hidden within tier sections.

Structure:

1. Critical Context (tier)
2. Supporting Context (tier)
3. Available Context (tier)
4. Contradictory Evidence (cross-cutting)
5. Assembly Summary

## Workflow

Execute `../workflows/contradictory-evidence-workflow.md` during evidence assembly.

## Anti-Patterns

| Anti-pattern | Violation |
|--------------|-----------|
| Include only supporting evidence | AF-008 violation |
| Omit weakened patterns | Confirmation bias |
| Resolve conflicts in retrieval | Inference responsibility |
| Hide contradictory evidence in footnotes | Transparency violation |
| Skip contradictory search | Undocumented absence |

## Relationship to Inference

Retrieval presents contradictory evidence — inference reconciles it. Do not resolve conflicts during retrieval assembly.

## Relationship to Context Review

If contradictory evidence suggests context weights were wrong, trigger `context/workflows/context-review.md` — do not silently adjust retrieval scope.
