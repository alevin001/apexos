---
# Recommendation Validation
# Naming: out-rec-val-{short-slug}.md
# Layer: Outcome & Results — validate recommendation against observed outcomes

id:                          # e.g. OUT-REC-001
title:                       # required
validation_date:             # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required
outcome_capture:             # required
related_validation_package:  # link to parent Validation Package
validation_result:           # validated | partially_validated | invalidated | not_applicable | inconclusive
confidence_impact:           # increase | decrease | unchanged | not_applicable
transformation_log: []
---

# {title}

## Recommendation Reference

<!-- Reference Recommendation Package — do not re-evaluate as decision support. -->

| Field | Value |
|-------|-------|
| Recommendation Package | |
| Primary recommendation | |
| Expected benefits | *(reference)* |
| Expected risks | *(reference)* |
| Expected consequences | *(reference)* |
| Outcome tracking considerations | *(reference)* |

## Validation Questions

| Question | Answer | Evidence |
|----------|--------|----------|
| Was the desired outcome achieved? | | |
| Did unintended outcomes occur? | | |
| Did the action influence the outcome? | | |
| Did the recommendation improve results? | | |
| Were outcome tracking considerations met? | | |

## Primary Recommendation Validation

**Validation result:**

**Rationale:**

**Evidence from outcome capture:**

| Success indicator (from recommendation) | Met? | Evidence |
|----------------------------------------|------|----------|
| | yes / no / partial / unknown | |

| Failure indicator (from recommendation) | Triggered? | Evidence |
|------------------------------------------|------------|----------|
| | yes / no / unknown | |

## Alternative Recommendations

<!-- If a different option would have produced better outcomes — validation only, not new recommendation. -->

| Alternative | Would have performed | Evidence | Note |
|-------------|---------------------|----------|------|
| | better / worse / unknown / not_evaluable | | validation observation only |

## Confidence Impact

| Element | Prior confidence | Impact | Rationale |
|---------|------------------|--------|-----------|
| Primary recommendation | *(from Recommendation Package)* | increase / decrease / unchanged | |
| Related assumptions | | | |

## Category Checklist

- [ ] Recommendation referenced — not re-generated
- [ ] Validation distinct from recommendation evaluation
- [ ] No new recommendations produced
- [ ] Alternative comparison is validation observation — not decision support
