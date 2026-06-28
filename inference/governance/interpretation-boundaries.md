# Interpretation Boundaries

Defines architectural boundaries for the Inference Layer. Prevents responsibility drift into Recommendation and preserves category separation.

## Architecture Reference

- Inference Architecture v1.0 — Relationship To Retrieval, Recommendation Inputs, Inferential Transparency Principle
- Recommendation Architecture v1.0 (DOC-008) — Recommendation operates upon Interpretation Package
- LAD-013, AF-011 — Inference converts evidence to interpretation
- LAD-014, AF-014 — Recommendations support executive judgment

## Layer Boundaries

```
Knowledge     → Source Material
Memory        → Distilled Intelligence
Context       → Determines Relevance
Retrieval     → Assembles Evidence
Inference     → Interprets Evidence
Recommendation → Produces Decision Support
```

Each layer has distinct responsibility. Boundaries must not be crossed silently.

## Inference Does

| Activity | Artifact |
|----------|----------|
| Evaluate assembled evidence | Evidence assessment |
| Evaluate perspectives | Evidence assessment |
| Identify assumptions | Assumption register |
| Identify blind spots | Blind spot review |
| Generate hypotheses | Hypothesis evaluation |
| Assess confidence | Confidence assessment |
| Evaluate competing interpretations | Competing interpretations |
| Identify evidence-based risks | Interpretation Package |
| Identify evidence-based opportunities | Interpretation Package |
| Produce interpretive findings | Interpretation Package |
| Synthesize interpretation | Interpretation Package |
| Declare insufficient evidence | Confidence assessment, Interpretation Package |
| Produce recommendation inputs | Interpretation Package handoff |

## Inference Does Not

| Activity | Correct Layer |
|----------|---------------|
| Assemble evidence | `retrieval/` |
| Determine relevance | `context/` |
| Store distilled intelligence | `memory/` |
| Generate recommendations | `recommendation/` |
| Generate options or tradeoffs | `recommendation/` |
| Produce decision support packages | `recommendation/` |
| Make decisions | Executive |
| Validate patterns | `outcomes/` |
| Influence evidence selection | Forbidden — request new retrieval |

## Category Boundaries

Categories are not interchangeable. Each has distinct governance:

| Category | May contain | Must not contain |
|----------|-------------|----------------|
| Evidence | Source paths, retrieved facts, observations from Context Package | Conclusions, recommendations |
| Findings | Conclusions strongly supported by evidence | Unvalidated hypotheses, assumptions |
| Hypotheses | Plausible explanations with supporting/contradicting evidence | Presented as proven facts |
| Assumptions | Provisional beliefs with validation requirements | Hidden within findings |
| Unknowns | Unresolved questions | Forced answers |
| Risks / Opportunities | Evidence-based identification with confidence | Action recommendations |
| Recommendations | — | Not in inference layer |

## Retrieval Boundary

| Rule | Rationale |
|------|-----------|
| Inference operates upon Context Package only | Evidence First Principle |
| Inference does not request evidence informally | Create formal retrieval request |
| Inference does not resolve contradictory evidence | Retrieval presents; inference evaluates |
| Post-inference evidence needs → new retrieval request | Prevents confirmation bias |

## Context Boundary

| Rule | Rationale |
|------|-----------|
| Inference does not redefine relevance | Context determines what matters |
| Inference does not override domain weights | LAD-006, LAD-007 |
| Relevance gaps discovered → context review | Not silent override |

## Memory Boundary

| Rule | Rationale |
|------|-----------|
| Inference references memory through Context Package | No duplication |
| Observations in `memory/observations/` are not inference findings | Promotion stage vs inference output |
| Pattern memory is referenced — not re-validated in inference | Validation is `outcomes/` responsibility |

## Recommendation Boundary

| Rule | Rationale |
|------|-----------|
| Interpretation Package is the handoff artifact | LAD-013 |
| Recommendation should not re-perform inference | Architectural separation |
| Risks and opportunities in inference are evidence-based identification | Recommendation evaluates action implications |
| Synthesized interpretation is not a recommendation | AF-014 — recommendations support judgment |

## No Silent Transformation (LAD-011)

| Transformation | Visibility requirement |
|----------------|----------------------|
| Hypothesis → finding | Explicit reclassification with evidence justification |
| Assumption → fact | Forbidden without validation evidence |
| Finding → recommendation | Move to recommendation layer |
| Low confidence → high confidence | Document calibration rationale |
| Post-handoff modification | New inference cycle — do not silently edit handed-off packages |

## Boundary Violation Response

1. Stop handoff if violation detected in review
2. Reclassify content to correct category or layer
3. Document correction in `transformation_log`
4. Re-run `inference-review-checklist.md`
5. If evidence contamination suspected — new retrieval request
