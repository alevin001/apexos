# Recommendation Boundaries

Defines architectural boundaries for the Recommendation Layer. Prevents responsibility drift into Inference or Outcomes and preserves category separation.

## Architecture Reference

- Recommendation Architecture v1.0 (DOC-008) — Relationship To Inference, Executive Agency Principle
- Inference Architecture v1.0 (DOC-007) — Interpretation Package handoff
- LAD-014, AF-014 — Recommendations support executive judgment
- LAD-015 — Outcome validation is separate

## Layer Boundaries

```
Knowledge       → Source Material
Memory          → Distilled Intelligence
Context         → Determines Relevance
Retrieval       → Assembles Evidence
Inference       → Interprets Evidence
Recommendation  → Produces Decision Support
Outcomes        → Validates Results
```

Each layer has distinct responsibility. Boundaries must not be crossed silently.

## Recommendation Does

| Activity | Artifact |
|----------|----------|
| Clarify desired outcomes | Objective alignment |
| Generate multiple options | Option generation |
| Evaluate doctrine alignment | Doctrine evaluation |
| Evaluate action-level risks | Risk assessment |
| Evaluate action-level opportunities | Opportunity assessment |
| Identify tradeoffs | Tradeoff analysis |
| Assess recommendation confidence | Recommendation confidence |
| Form primary and alternative recommendations | Recommendation Package |
| Explain cause-and-effect | Recommendation Package |
| Identify outcome tracking considerations | Recommendation Package |
| Deliver executive decision support | Recommendation Package |

## Recommendation Does Not

| Activity | Correct Layer |
|----------|---------------|
| Assemble evidence | `retrieval/` |
| Determine relevance | `context/` |
| Interpret evidence | `inference/` |
| Re-perform inference | `inference/` |
| Reinterpret evidence | `inference/` |
| Validate outcomes | `outcomes/` |
| Make executive decisions | Executive |
| Store validated patterns | `memory/pattern/` |
| Influence evidence selection | Forbidden — return to retrieval via inference |

## Category Boundaries

Categories are not interchangeable. Each has distinct governance:

| Category | May contain | Must not contain |
|----------|-------------|----------------|
| Evidence | Source paths referenced from Interpretation Package | Reinterpretation or new findings |
| Findings | References to Interpretation Package findings | Re-inferred conclusions |
| Hypotheses | References from Interpretation Package | Promoted to recommendations without evaluation |
| Assumptions | Provisional beliefs carried forward | Hidden within recommendation rationale |
| Unknowns | References from Interpretation Package | Forced recommendations despite gaps |
| Recommendations | Potential courses of action with transparency | Decisions or facts |
| Decisions | — | Not in recommendation layer |

## Inference Boundary

| Rule | Rationale |
|------|-----------|
| Recommendation operates upon Interpretation Package only | Architectural separation (DOC-008) |
| Recommendation does not re-perform inference | Inference converts evidence to interpretation |
| Synthesized interpretation is input — not a recommendation | AF-014 |
| Inference risks/opportunities are evidence-based identification | Recommendation evaluates action implications |
| Inference gaps → return to inference | Do not re-infer in recommendation |

## Outcomes Boundary

| Rule | Rationale |
|------|-----------|
| Recommendation identifies outcome tracking considerations | Outcome Architecture owns validation |
| Recommendation does not perform outcome validation | LAD-015 |
| Recommendation does not capture outcomes | `outcomes/` responsibility |
| Observed outcomes influence future recommendation confidence | Outcome-Validated Recommendation Principle |

## Doctrine Boundary

| Rule | Rationale |
|------|-----------|
| Doctrine referenced from `knowledge/doctrine/` | No duplication |
| Doctrine evaluated — not modified | Doctrine supremacy |
| Doctrine conflicts documented transparently | No silent override |

## Executive Agency Boundary

| Rule | Rationale |
|------|-----------|
| Recommendations support judgment — not replace it | Executive Agency Principle |
| No autonomous decision language | LAD-014 |
| Tradeoffs made visible — not resolved on behalf of executive | Tradeoff Analysis |
| Executive decisions not recorded as recommendations | Recommendations ≠ decisions |

## No Silent Transformation (LAD-011)

| Transformation | Visibility requirement |
|----------------|----------------------|
| Finding → recommendation | Explicit option evaluation with doctrine, risk, tradeoff analysis |
| Hypothesis → recommendation | Forbidden without full evaluation pathway |
| Assumption → fact | Forbidden without validation evidence |
| Inference confidence → recommendation confidence | Independent assessment required |
| Recommendation → decision | Executive action — not ApexOS output |
| Post-delivery modification | New recommendation cycle — do not silently edit delivered packages |

## Boundary Violation Response

1. Stop delivery if violation detected in review
2. Reclassify content to correct category or layer
3. Document correction in `transformation_log`
4. Re-run `recommendation-review-checklist.md`
5. If inference gap suspected — return to `inference/`
6. If outcome validation attempted — move to `outcomes/`
