# Outcome/Results Memory

## Responsibility

Stores both positive and negative outcomes/results. Outcome/Results Memory provides the evidence used for learning, validation, reinforcement, and avoidance.

## Architecture Reference

- **Primary:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx` (Outcome/Results Memory)
- **Outcomes:** `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx`

## Contents Include

Positive outcomes, negative outcomes, measured results, observed consequences.

## Template and Conventions

| Item | Path |
|------|------|
| Template | `templates/outcome-results-memory.md` |
| Outcome reference | `templates/outcome-reference.md` |
| Naming | `{outcome-slug}.md` |
| ID prefix | `MEM-OUT-` |
| Add workflow | `workflows/add-memory.md` |
| Link to other memory | `workflows/link-outcome-reference.md` |

## Distinction from Outcomes Layer

This folder stores **memory** (what ApexOS knows about past results). The `outcomes/` layer implements **validation architecture** (capture, learning, feedback loops, confidence adjustment). Both are required; they serve different functions.

## Validation Layer Role

Outcome/Results serves as the validation layer for all ApexOS objects (LAD-004).

## Governance

See `governance/source-fidelity/memory-layer.md`. Register artifacts in `INDEX.md`.
