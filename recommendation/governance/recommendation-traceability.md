# Recommendation Traceability

Traceability requirements for recommendation layer artifacts.

## Architecture Reference

- Recommendation Architecture v1.0 — Cause-And-Effect Transparency Principle, Governance Controls
- Governance Architecture v1.0 — Transparency Principle
- Inference Architecture v1.0 — Interpretation Package traceability chain

## Purpose

Maintain explainability for why recommendations were generated, what interpretation was considered, what doctrine was applied, and how confidence was assessed. Sufficient transparency to support trust, validation, and improvement — not perfect explainability.

## Traceability Chain

```
Context relevance specification
  → Retrieval request
    → Evidence package
      → Context Package
        → Inference component artifacts
          → Interpretation Package
            → Recommendation component artifacts
              → Recommendation Package
                → Executive decision (external)
                  → Outcomes (validation)
```

Every recommendation artifact must link backward through this chain.

## Frontmatter Traceability Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID |
| `interpretation_package` | Yes | Link to handed-off Interpretation Package |
| `context_package` | Recommended | Link for full evidence chain |
| `retrieval_request` | Recommended | Link to retrieval request |
| `context_reference` | Recommended | Link to context relevance specification |
| `component_artifacts` | Recommendation Package | Links to all component artifacts |
| `related_recommendation_package` | Component artifacts | Link to parent Recommendation Package |
| `doctrine_references` | Doctrine evaluation | Links to doctrine sources |
| `confidence_summary` | Recommendation Package | Overall recommendation confidence |
| `uncertainty_flags` | Recommended | Active uncertainty indicators |
| `review_status` | Recommended | Review outcome |
| `transformation_log` | When derived | Record of recommendation changes |

## Interpretation Traceability

Recommendation references interpretation — it does not re-derive it:

1. Every finding reference links to Interpretation Package section
2. Interpretation Package links to inference component artifacts
3. No recommendation artifact contains re-inferred conclusions
4. Inference confidence preserved and referenced — recommendation confidence assessed independently

## Component Artifact Traceability

| Component | Links to | Registered in |
|-----------|----------|-----------------|
| Objective alignment | Interpretation Package | `INDEX.md` Component Artifacts |
| Option generation | Objective alignment, Interpretation Package | Same |
| Doctrine evaluation | Option generation, doctrine references | Same |
| Risk assessment | Option generation, Interpretation Package risks | Same |
| Opportunity assessment | Option generation, Interpretation Package opportunities | Same |
| Tradeoff analysis | Risk, opportunity, option generation | Same |
| Recommendation confidence | All prior components | Same |
| Recommendation Package | All components | `INDEX.md` Recommendation Packages |

## Category Traceability

Each category must remain traceable and distinguishable in artifacts:

| Category | Traceability requirement |
|----------|-------------------------|
| Evidence | Source path through Interpretation Package to Context Package |
| Findings | Link to Interpretation Package interpretive findings |
| Hypotheses | Link to Interpretation Package hypotheses section |
| Assumptions | Link to Interpretation Package and carried forward with impact |
| Unknowns | Link to Interpretation Package unknowns |
| Recommendations | Link to option evaluation, doctrine, risk, tradeoff artifacts |
| Decisions | External — not in recommendation artifacts |

## Outcome Traceability

Recommendation identifies but does not perform outcome tracking:

1. Outcome tracking considerations documented in Recommendation Package
2. Expected outcome windows and indicators linked for `outcomes/` capture
3. Post-outcome recommendation review updates confidence via outcomes layer
4. Recommendation artifacts updated when outcome evidence contradicts recommendations

## Registry Requirements

Update `recommendation/INDEX.md` when:

- Receiving Interpretation Package from inference
- Creating component artifacts
- Completing Recommendation Package
- Delivering to executive
- Reviewing after outcomes available
- Archiving recommendation content

## Cross-Layer References

| Layer | Traceability link |
|-------|-------------------|
| `inference/` | `interpretation_package` — primary input |
| `retrieval/` | `context_package` — evidence chain |
| `context/` | `context_reference` — relevance chain |
| `knowledge/doctrine/` | `doctrine_references` — doctrine evaluation |
| `memory/` | Through Interpretation Package references — not direct |
| `outcomes/` | Outcome tracking considerations — validation downstream |
| `governance/traceability/README.md` | Global traceability requirements |
