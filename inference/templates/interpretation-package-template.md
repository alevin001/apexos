---
# Interpretation Package
# Naming: inf-int-{short-slug}.md
# Layer: Inference — primary output for recommendation handoff

id:                          # e.g. INF-INT-001
title:                       # required
interpretation_date:         # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | handed_off | archived
context_package:             # required — path to retrieval Context Package
retrieval_request:           # recommended — path to retrieval request
context_reference:           # recommended — path to context relevance specification
component_artifacts:
  evidence_assessment:       # path to inf-evd artifact
  assumption_register:       # path to inf-asm artifact
  blind_spot_review:         # path to inf-bls artifact
  hypothesis_evaluation:     # path to inf-hyp artifact
  confidence_assessment:     # path to inf-con artifact
  competing_interpretations: # path to inf-cmp artifact
confidence_summary:          # low | medium | high | insufficient — with rationale in body
uncertainty_flags: []        # insufficient_evidence, competing_interpretations, missing_information, etc.
review_status: pending       # pending | confirmed | adjusted | superseded
transformation_log: []
---

# {title}

## Interpretation Summary

<!-- Synthesized understanding — the primary interpretive conclusion. Not a recommendation. -->

## Evidence Assessment

<!-- Summary from evidence assessment artifact. Link to inf-evd artifact. Do not duplicate evidence content — reference source paths from Context Package. -->

| Evidence element | Source path | Strength | Supports / Contradicts |
|------------------|-------------|----------|------------------------|
| | | | |

## Perspective Assessment

<!-- Executive, stakeholder, organizational, and system perspectives evaluated. -->

| Perspective | Key elements | Evidence support | Evidence contradiction | Blind spots |
|-------------|--------------|------------------|------------------------|-------------|
| | | | | |

## Assumption Assessment

<!-- Summary from assumption register. Assumptions are not evidence or findings. -->

| Assumption | Why it exists | Supporting evidence | Contradicting evidence | Validation needed |
|------------|---------------|---------------------|------------------------|-------------------|
| | | | | |

## Blind Spot Assessment

<!-- Summary from blind spot review. -->

| Blind spot area | What may be overlooked | Alternative explanation | Underrepresented perspective |
|-----------------|------------------------|-------------------------|------------------------------|
| | | | |

## Hypotheses

<!-- Plausible explanations — not findings. Link to inf-hyp artifact. -->

| Hypothesis | Type | Evidence support | Evidence that would strengthen | Evidence that would invalidate |
|------------|------|------------------|-------------------------------|-------------------------------|
| | | | | |

## Confidence Assessments

<!-- Per finding and overall. Higher confidence does not imply certainty. -->

| Finding / Element | Confidence | Rationale |
|-------------------|------------|-----------|
| | | |

## Risks

<!-- Evidence-based risk identification — not recommendations. -->

| Risk | Evidence support | Assumptions influencing | Confidence |
|------|------------------|-------------------------|------------|
| | | | |

## Opportunities

<!-- Evidence-based opportunity identification — not recommendations. -->

| Opportunity | Evidence support | Assumptions influencing | Confidence |
|-------------|------------------|-------------------------|------------|
| | | | |

## Competing Interpretations

<!-- Summary from competing interpretations artifact. Do not eliminate — understand them. -->

| Interpretation | Evidence support | Evidence contradiction | Relative support |
|----------------|------------------|------------------------|------------------|
| | | | |

## Unknowns

<!-- Questions available evidence cannot currently answer. -->

| Unknown | Why unresolved | Information needed |
|---------|----------------|-------------------|
| | | |

## Interpretive Findings

<!-- Conclusions strongly supported by evidence — distinct from hypotheses and assumptions. -->

1.
2.
3.

## Synthesized Interpretation

<!-- Integrated understanding produced from inferential analysis. Recommendation inputs — not recommendations. -->

## Insufficient Evidence Declaration

<!-- If applicable (AF-013): more evidence required, confidence insufficient, or no reliable interpretation possible. -->

## Traceability

| Field | Value |
|-------|-------|
| Context Package | |
| Retrieval request | |
| Context reference | |
| Component artifacts | |
| Handed off to recommendation | |

## Category Checklist

- [ ] Evidence distinguished from findings
- [ ] Hypotheses distinguished from findings
- [ ] Assumptions explicitly identified
- [ ] Unknowns documented where applicable
- [ ] No recommendations or decision support content
