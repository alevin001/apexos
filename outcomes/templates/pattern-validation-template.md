---
# Pattern Validation
# Naming: out-pat-val-{short-slug}.md
# Layer: Outcome & Results — evaluate patterns against observed outcomes

id:                          # e.g. OUT-PAT-001
title:                       # required
validation_date:             # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required
outcome_capture:             # required
related_validation_package:  # link to parent Validation Package
pattern_references: []       # paths to memory/pattern/ artifacts under evaluation
evaluation_result:           # reinforced | weakened | unchanged | not_applicable | inconclusive
transformation_log: []
---

# {title}

## Pattern References

<!-- Reference patterns from memory — do not re-validate in inference. -->

| Pattern | Path | Current confidence | Reinforcement status |
|---------|------|-------------------|---------------------|
| | `memory/pattern/` | | stable / reinforced / weakened |

## Evaluation Questions

| Question | Answer | Evidence |
|----------|--------|----------|
| Did observed outcomes support the pattern? | | |
| Did observed outcomes contradict the pattern? | | |
| Is this a single instance or repeated validation? | | |
| Should pattern confidence change? | | |

## Pattern Evaluation Results

| Pattern | Outcome alignment | Evaluation result | Rationale |
|---------|-------------------|-------------------|-----------|
| | supports / contradicts / neutral / inconclusive | reinforced / weakened / unchanged | |

## Contradictory Evidence Review

<!-- Per Governance Architecture — Contradictory Evidence Principle. -->

| Evidence | Source | Impact on pattern |
|----------|--------|-------------------|
| | | |

## Reinforcement Recommendation

| Pattern | Recommended action | Rationale |
|---------|-------------------|-----------|
| | reinforce / weaken / maintain / defer | |

## Category Checklist

- [ ] Patterns referenced from memory — not re-identified in inference
- [ ] Evaluation based on observed outcomes
- [ ] Single instance does not automatically reinforce pattern
- [ ] Contradictory evidence reviewed
