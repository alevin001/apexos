---
# Recommendation Confidence
# Naming: rec-con-{short-slug}.md
# Layer: Recommendation — independent confidence evaluation

id:                          # e.g. REC-CON-001
title:                       # required
recommendation_date:         # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | archived
interpretation_package:      # required
inference_confidence:        # reference from Interpretation Package confidence_summary
component_artifacts:         # links to doctrine, risk, opportunity, tradeoff artifacts
related_recommendation_package:  # when linked to package assembly
confidence_summary:          # low | medium | high | insufficient
uncertainty_flags: []
review_status: pending
transformation_log: []
---

# {title}

## Inference Confidence Reference

<!-- Recommendation confidence is related to but independent from inference confidence. -->

| Element | Inference confidence | Source |
|---------|---------------------|--------|
| Overall interpretation | | Interpretation Package |
| Key findings | | Interpretation Package |

## Confidence Influencing Factors

| Factor | Assessment | Impact on recommendation confidence |
|--------|------------|-------------------------------------|
| Inference confidence | | |
| Doctrine alignment | | |
| Historical outcome validation | | |
| Pattern strength | | |
| Situational similarity | | |
| Risk profile | | |
| Outcome evidence | | |
| Evidence quality | | |
| Environmental uncertainty | | |

## Option Confidence Assessment

<!-- A recommendation may have lower confidence than the underlying finding. -->

| Option | Recommendation confidence | Rationale | Key uncertainty |
|--------|--------------------------|-----------|-----------------|
| Primary | | | |
| Alternative 1 | | | |
| Alternative 2 | | | |

## Outcome-Validated Confidence

<!-- Greater confidence when aligned with doctrine, validated patterns, and historical positive outcomes. -->

| Option | Validated pattern support | Historical outcome support | Confidence adjustment |
|--------|--------------------------|---------------------------|----------------------|
| | | | increase / neutral / decrease |

**Rule:** Recommendations should not receive elevated confidence solely because they appear logical. Observed outcomes should influence future recommendation confidence.

## Overall Package Confidence

**Confidence level:**

**Rationale:**

## Insufficient Information Declaration

<!-- If applicable: insufficient information, low confidence, equally viable options, additional evidence required. -->

| Condition | Present | Implication |
|-----------|---------|-------------|
| Insufficient information | yes / no | |
| Low recommendation confidence | yes / no | |
| Multiple equally viable options | yes / no | |
| Additional evidence required | yes / no | |

## Traceability

| Field | Value |
|-------|-------|
| Interpretation Package | |
| Inference confidence | |
| Component artifacts | |

## Boundary Checklist

- [ ] Recommendation confidence evaluated independently from inference confidence
- [ ] Confidence visible with rationale
- [ ] Uncertainty declared where warranted — not hidden
- [ ] No confidence overstated for persuasive effect
