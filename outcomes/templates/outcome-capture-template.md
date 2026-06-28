---
# Outcome Capture
# Naming: out-cap-{short-slug}.md
# Layer: Outcome & Results — action and observed result record

id:                          # e.g. OUT-CAP-001
title:                       # required
capture_date:                # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required — path to recommendation Recommendation Package
interpretation_package:      # recommended — full traceability chain
context_package:             # recommended
executive_decision_reference:  # recommended — external reference
recommendation_followed:     # followed | modified | rejected | partial | unknown
action_taken:                # required — what was actually done
observed_outcome:            # required — what actually occurred
measurable_results: []       # quantifiable results when available
unexpected_consequences: []  # outcomes not anticipated in recommendation
capture_method:              # executive_follow_up | structured_reflection | scheduled_review | organizational_reporting | outcome_measurement | behavioral_observation
related_validation_package:  # link when validation complete
transformation_log: []
---

# {title}

## Recommendation Reference

<!-- What recommendation was made? Reference Recommendation Package — do not duplicate decision support content. -->

| Field | Value |
|-------|-------|
| Recommendation Package | |
| Primary recommendation | *(summary reference only)* |
| Outcome tracking considerations | *(from Recommendation Package)* |

## Executive Decision

<!-- What decision was made? External reference — not stored as recommendation. -->

| Field | Value |
|-------|-------|
| Decision reference | |
| Decision summary | |
| Date of decision | |

## Action Taken

<!-- What was actually done? Distinct from recommendation and decision. -->

**Action description:**

**Action date:**

**Recommendation alignment:** *(followed / modified / rejected / partial)*

**Modifications from recommendation:** *(if applicable)*

## Observed Outcome

<!-- What actually occurred? Distinct from expected consequences in recommendation. -->

**Outcome description:**

**Outcome observable date:**

**Outcome window:** *(time from action to observable results)*

## Measurable Results

| Metric | Expected (from recommendation) | Observed | Variance |
|--------|----------------------------------|----------|----------|
| | | | |

## Unexpected Consequences

| Consequence | Type | Significance |
|-------------|------|--------------|
| | positive / negative / neutral | |

## Action-To-Outcome Correlation

<!-- LAD-016, AF-017 — document the full chain. -->

```
Recommendation → Decision → Action Taken → Observed Outcome
```

| Link | Artifact / Reference | Status |
|------|---------------------|--------|
| Recommendation | | linked |
| Decision | | linked |
| Action | | documented |
| Outcome | | documented |

## Capture Method

<!-- How was this information collected? -->

## Category Checklist

- [ ] Recommendation referenced — not re-evaluated
- [ ] Decision referenced — not stored as recommendation
- [ ] Action documented separately from recommendation
- [ ] Observed outcome documented separately from expected consequences
- [ ] Full action-to-outcome correlation chain present
