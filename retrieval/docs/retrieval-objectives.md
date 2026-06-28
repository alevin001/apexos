# Retrieval Objectives

Goals and optimization criteria for the Retrieval Layer.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Core Principle, Retrieval Objectives
- Architecture & Doctrine Index v2.0 — LAD-007, AF-006

## Primary Objective

Locate and assemble the **smallest set** of information most likely to improve:

- Interpretation
- Decisions
- Communication
- Relationships
- Alignment
- Outcomes and results

## What Retrieval Optimizes For

| Criterion | Meaning |
|-----------|---------|
| Relevance | Artifacts directly applicable to the current situation |
| Usefulness | Information that improves executive effectiveness |
| Evidence quality | Traceable, validated, primary sources preferred |
| Signal-to-noise ratio | Minimum information for maximum clarity |
| Executive effectiveness | Outcome-oriented selection — not completeness |

## What Retrieval Does Not Optimize For

| Anti-objective | Why |
|----------------|-----|
| Maximum recall | Violates smallest effective set principle |
| Completeness | More information is not better information |
| Search breadth | Retrieval is evidence assembly, not search |
| Recency alone | Recency is one ranking signal among many |
| Confirmation | Contradictory evidence is required (AF-008) |

## Retrieval vs Context

| Layer | Question | Responsibility |
|-------|----------|----------------|
| Context | What matters? | Relevance determination |
| Retrieval | How to find it? | Evidence location and assembly |

Retrieval executes context relevance determinations (LAD-007). Retrieval does not redefine what matters — if evidence suggests relevance should change, trigger context review.

## Retrieval vs Inference

| Layer | Responsibility |
|-------|----------------|
| Retrieval | Assemble evidence |
| Inference | Interpret evidence |

Evidence precedes inference (LAD-008). Inference does not influence evidence selection during retrieval.

## Retrieval Targets

| Target | Source | Purpose |
|--------|--------|---------|
| Knowledge | `knowledge/` | Frameworks, doctrine references, source evidence |
| Memory | `memory/` | Distilled intelligence by category |
| Evidence | Multiple layers | Supporting, contradictory, alternative perspectives |
| Pattern | `memory/pattern/` | Validated learning |
| Context Package | Retrieval output | Prepared assembly for inference |

## Success Criteria

Retrieval succeeds when the assembled Context Package:

1. Matches context relevance specification tiers
2. Includes contradictory evidence where applicable
3. Links all evidence to traceable sources
4. Passes retrieval validation
5. Enables inference without requiring additional evidence gathering for core questions

## Failure Indicators

- Context Package exceeds scope without documented rationale
- Critical tier empty when context specified critical domains
- No contradictory evidence when conflicts exist
- Evidence items without source paths
- Retrieval overrides context weights without context review

See `../workflows/retrieval-validation.md` and `../governance/retrieval-fidelity-checklist.md`.
