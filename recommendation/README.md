# Recommendation Layer

## Responsibility

This folder implements the Recommendation Layer — converting interpretation into actionable decision support.

**Inference answers:** What conclusions are most supported by the evidence?

**Recommendation answers:** What actions are most supported by the interpretation?

Recommendation Architecture does not make decisions. It strengthens executive judgment (LAD-014, AF-014).

## Architecture Reference

- **Primary:** `architecture/8 - ApexOS - Recommendation Architecture v1.0.docx`
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Recommendation Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (DOC-008, LAD-014, LAD-015)

## Build 06 Status

**Complete.** Repository organization, templates, workflows, governance, and registry are defined.

| Artifact | Purpose |
|----------|---------|
| `REPOSITORY-GUIDE.md` | Organization rules, naming, boundaries, category separation |
| `INDEX.md` | Human-readable registry of recommendation artifacts |
| `options/` | Option generation artifacts |
| `tradeoffs/` | Tradeoff analysis artifacts |
| `recommendations/` | Primary and alternative recommendation artifacts |
| `decision-support/` | Recommendation Packages — primary output |
| `templates/` | Recommendation package and component templates |
| `workflows/` | Objective alignment through decision support pipeline |
| `governance/` | Recommendation governance, boundaries, fidelity, traceability |

## Core Principle

Generate informed, transparent, and doctrine-aligned decision support — not instructions.

## Recommendation Model

```
Interpretation Package → Objective Alignment → Option Generation → Doctrine Evaluation → Risk Evaluation → Opportunity Evaluation → Tradeoff Analysis → Confidence Assessment → Recommendation Formation → Executive Decision Support
```

## Subfolders

| Folder | Responsibility |
|--------|----------------|
| `decision-support/` | Primary output — Recommendation Package |
| `options/` | Multiple viable courses of action |
| `recommendations/` | Primary and alternative recommendations with doctrine alignment |
| `tradeoffs/` | Explicit tradeoff analysis |

## Category Separation

Recommendation must distinguish between evidence, findings, hypotheses, assumptions, unknowns, recommendations, and decisions. These categories are not interchangeable.

## Primary Output

A **Recommendation Package** containing objective assessment, primary recommendation, alternative recommendations, doctrine alignment, risk assessment, opportunity assessment, tradeoff analysis, supporting evidence, assumptions, confidence assessment, expected consequences, uncertainty assessment, and outcome tracking considerations.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `inference/` | Provides Interpretation Package — recommendation does not re-perform inference |
| `outcomes/` | Validates recommendations through observed results — recommendation does not validate outcomes |
| `governance/source-fidelity/recommendation-layer.md` | Recommendation fidelity and drift controls |

## Quick Start

1. Read `REPOSITORY-GUIDE.md`
2. Receive Interpretation Package from `inference/workflows/interpretation-workflow.md`
3. Execute `workflows/recommendation-workflow.md`
4. Validate via `governance/recommendation-review-checklist.md`
5. Deliver Recommendation Package for executive decision
6. Register in `INDEX.md`

## Governance

- Operate upon Interpretation Package only — do not re-perform inference
- Distinguish recommendations from findings, evidence, and decisions
- Doctrine alignment required before handoff
- Recommendation confidence evaluated independently from inference confidence
- Executive agency preserved — recommendations support judgment, not replace it
- Run `governance/recommendation-review-checklist.md` before executive delivery

See `governance/source-fidelity/recommendation-layer.md`.
