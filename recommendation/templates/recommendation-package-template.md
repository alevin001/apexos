---
# Recommendation Package
# Naming: rec-pkg-{short-slug}.md
# Layer: Recommendation — primary output for executive decision support

id:                          # e.g. REC-PKG-001
title:                       # required
recommendation_date:         # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | delivered | archived
interpretation_package:      # required — path to inference Interpretation Package
context_package:             # recommended — path to retrieval Context Package
retrieval_request:           # recommended — path to retrieval request
context_reference:           # recommended — path to context relevance specification
component_artifacts:
  objective_alignment:       # path to rec-obj artifact
  option_generation:           # path to rec-opt artifact
  doctrine_evaluation:       # path to rec-doc artifact
  risk_assessment:             # path to rec-rsk artifact
  opportunity_assessment:      # path to rec-opp artifact
  tradeoff_analysis:           # path to rec-trd artifact
  recommendation_confidence:   # path to rec-con artifact
confidence_summary:          # low | medium | high | insufficient — with rationale in body
uncertainty_flags: []        # insufficient_information, low_confidence, equally_viable_options, etc.
review_status: pending       # pending | confirmed | adjusted | superseded
transformation_log: []
---

# {title}

## Objective Assessment

<!-- Summary from objective alignment artifact. What outcome is being pursued? -->

## Primary Recommendation

<!-- The option most supported by evidence, doctrine, interpretation, and historical learning. Not a decision. -->

**Recommendation:**

**Rationale:**

**Expected benefits:**

**Expected risks:**

**Supporting evidence:** *(reference paths — do not duplicate)*

**Supporting findings:** *(reference from Interpretation Package)*

**Underlying assumptions:**

## Alternative Recommendations

<!-- Additional viable options supported by available evidence. -->

| Option | Rationale | Advantages | Disadvantages | Risks | Opportunities |
|--------|-----------|------------|---------------|-------|---------------|
| | | | | | |

## Doctrine Alignment Assessment

<!-- Summary from doctrine evaluation artifact. -->

| Doctrine element | Alignment | Rationale |
|------------------|-----------|-----------|
| | aligned / partial / conflict | |

## Risk Assessment

<!-- Summary from risk assessment artifact. Action-level risks — not inference-level identification only. -->

| Risk | Option(s) affected | Evidence support | Assumptions influencing | Severity | Likelihood |
|------|-------------------|------------------|-------------------------|----------|------------|
| | | | | | |

## Opportunity Assessment

<!-- Summary from opportunity assessment artifact. Action-level opportunities. -->

| Opportunity | Option(s) affected | Evidence support | Assumptions influencing | Significance |
|-------------|-------------------|------------------|-------------------------|--------------|
| | | | | |

## Tradeoff Analysis

<!-- Summary from tradeoff analysis artifact. -->

| Tradeoff | Options compared | Benefits gained | Costs incurred | Competing priorities |
|----------|------------------|-----------------|----------------|----------------------|
| | | | | |

## Supporting Evidence

<!-- Reference evidence paths from Interpretation Package and Context Package — do not duplicate content. -->

| Evidence element | Source path | Relevance to recommendation |
|------------------|-------------|----------------------------|
| | | |

## Supporting Findings

<!-- Reference interpretive findings from Interpretation Package. -->

1.
2.
3.

## Assumptions

<!-- Assumptions influencing recommendations — visible and challengeable. Not evidence or findings. -->

| Assumption | Why it exists | Supporting evidence | Contradicting evidence | Impact if wrong |
|------------|---------------|---------------------|------------------------|-----------------|
| | | | | |

## Confidence Assessment

<!-- Summary from recommendation confidence artifact. Independent from inference confidence. -->

| Element | Confidence | Rationale |
|---------|------------|-----------|
| Primary recommendation | | |
| Alternative options | | |
| Overall package | | |

## Expected Consequences

<!-- Second-order effects and expected outcomes — not validated here. -->

| Consequence | Type | Expected timing | Confidence |
|-------------|------|-----------------|------------|
| | benefit / risk / neutral | | |

## Uncertainty Assessment

<!-- If applicable: insufficient information, low confidence, equally viable options, additional evidence needed. -->

## Outcome Tracking Considerations

<!-- Identify validation requirements — do not perform outcome validation. -->

| Consideration | Type | Expected window | Success indicators | Failure indicators |
|---------------|------|-----------------|-------------------|-------------------|
| | validation / learning | | | |

## Executive Decision Support Summary

<!-- Integrated decision support — recommendations support judgment, not replace it. -->

## Traceability

| Field | Value |
|-------|-------|
| Interpretation Package | |
| Context Package | |
| Retrieval request | |
| Context reference | |
| Component artifacts | |
| Delivered to executive | |

## Category Checklist

- [ ] Evidence referenced — not duplicated or reinterpreted
- [ ] Findings referenced from Interpretation Package — not re-inferred
- [ ] Assumptions explicitly identified
- [ ] Recommendations distinguished from findings and decisions
- [ ] Executive agency preserved — no autonomous decision language
- [ ] Outcome tracking identified — not validated in this artifact
