---
# Validation Package
# Naming: val-pkg-{short-slug}.md
# Layer: Outcome & Results — primary output

id:                          # e.g. OUT-VAL-001
title:                       # required
validation_date:             # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required — path to recommendation Recommendation Package
interpretation_package:      # recommended — path to inference Interpretation Package
context_package:             # recommended — path to retrieval Context Package
retrieval_request:           # recommended — path to retrieval request
context_reference:           # recommended — path to context relevance specification
outcome_capture:             # required — path to outcome capture artifact
executive_decision_reference:  # recommended — external reference to executive decision
action_taken_summary:        # recommended — summary of action taken
observed_outcome_summary:    # recommended — summary of observed outcome
component_artifacts:
  recommendation_validation:   # path to out-rec-val artifact
  decision_validation:         # path to out-dec-val artifact
  assumption_validation:       # path to out-asm-val artifact
  pattern_validation:          # path to out-pat-val artifact
  confidence_recalibration:    # path to out-con-recal artifact
  reinforcement_update:        # path to out-rnf artifact
  learning_update:             # path to out-lrn artifact
  executive_follow_up:         # path to out-fup artifact (when applicable)
validation_summary:          # validated | partially_validated | invalidated | inconclusive — with rationale in body
learning_promoted:             # path to learning update if promoted to memory workflow
review_status: pending         # pending | confirmed | adjusted | superseded
transformation_log: []
---

# {title}

## Outcome Assessment

<!-- What actually happened? Separate observed facts from interpretation. -->

**Observed outcome:**

**Measurable results:**

**Unexpected consequences:**

**Outcome window:** *(when results became observable)*

## Outcome Attribution

<!-- Did the action influence the outcome? What other factors may have contributed? -->

| Factor | Influence | Evidence | Confidence |
|--------|-----------|----------|------------|
| Action taken | | | |
| Recommendation followed/modified | | | |
| External factors | | | |

## Recommendation Validation

<!-- Summary from recommendation validation artifact. Did the recommendation improve results? -->

| Element | Validation result | Rationale |
|---------|-------------------|-----------|
| Primary recommendation | validated / partially / invalidated / not_applicable | |
| Alternative recommendations | | |
| Expected consequences | | |
| Outcome tracking considerations | | |

## Decision Validation

<!-- Summary from decision validation artifact. Was the executive decision effective? -->

| Element | Validation result | Rationale |
|---------|-------------------|-----------|
| Decision effectiveness | | |
| Recommendation alignment | followed / modified / rejected | |
| Decision rationale vs outcome | | |

## Assumption Validation

<!-- Summary from assumption validation artifact. -->

| Assumption | Source | Validation result | Impact on confidence |
|------------|--------|-------------------|---------------------|
| | inference / recommendation | validated / failed / inconclusive | |

## Pattern Validation

<!-- Summary from pattern validation artifact. -->

| Pattern | Validation result | Reinforcement action |
|---------|-------------------|---------------------|
| | reinforced / weakened / unchanged / not_applicable | |

## Confidence Recalibration

<!-- Summary from confidence recalibration artifact. -->

| Target | Prior confidence | Updated confidence | Rationale |
|--------|------------------|-------------------|-----------|
| Recommendation | | | |
| Assumptions | | | |
| Patterns | | | |
| Interpretation (reference only) | | | |

## Reinforcement Updates

<!-- Summary from reinforcement update artifact. -->

| Target | Update type | Rationale |
|--------|-------------|-----------|
| | reinforce / weaken / stable | |

## Learning Updates

<!-- Summary from learning update artifact. Validated learning only. -->

| Learning | Validation basis | Promotion status |
|----------|------------------|------------------|
| | | pending / promoted / deferred |

## Follow-Up Findings

<!-- Summary from executive follow-up artifact when applicable. -->

## Validated Historical Context

<!-- Append-only context for future reference. Do not rewrite prior artifacts. -->

## Traceability

| Field | Value |
|-------|-------|
| Recommendation Package | |
| Outcome capture | |
| Interpretation Package | |
| Context Package | |
| Component artifacts | |
| Executive decision reference | |
| Learning promoted | |

## Category Checklist

- [ ] Action and observed outcome distinguished from recommendation and decision
- [ ] Recommendation referenced — not re-evaluated as decision support
- [ ] No new recommendations generated in this artifact
- [ ] No inference re-performed — interpretation referenced only
- [ ] Historical records referenced — not rewritten
- [ ] Validated learning distinguished from speculation
- [ ] Executive decision referenced — not overridden
