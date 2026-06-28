---
# Learning Update
# Naming: out-lrn-{short-slug}.md
# Layer: Outcome & Results — validated learning for promotion

id:                          # e.g. OUT-LRN-001
title:                       # required
learning_date:               # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
related_validation_package:  # required
outcome_capture:             # required
learning_type:               # outcome_insight | recommendation_learning | assumption_learning | pattern_learning | decision_learning | attribution_learning
validation_basis:            # required — summary of outcome evidence supporting this learning
promotion_status:            # pending | approved | promoted | deferred | rejected
promoted_to_memory:          # path when promoted via memory workflow
transformation_log: []
---

# {title}

## Validated Learning

<!-- Learning confirmed through outcome evidence — not speculation. -->

**Learning statement:**

**Validation basis:**

**Outcome evidence:**

## Source Chain

| Stage | Artifact | Link |
|-------|----------|------|
| Context | | |
| Retrieval | | |
| Inference | | |
| Recommendation | | |
| Outcome | | |
| Validation | | |

## Learning Details

| Question | Answer |
|----------|--------|
| What worked? | |
| What did not work? | |
| What was unexpected? | |
| What should influence future behavior? | |

## Promotion Assessment

| Criterion | Met? | Notes |
|-----------|------|-------|
| Supported by outcome evidence | | |
| Not contradicted by other evidence | | |
| Actionable for future retrieval/inference/recommendation | | |
| Review completed | | |
| Historical integrity preserved | | |

## Downstream Influence

| Layer | Intended influence |
|-------|-------------------|
| Retrieval | |
| Inference | |
| Recommendation | |
| Memory | |
| Pattern | |

## Promotion Workflow

When `promotion_status: approved`:

1. Execute `workflows/learning-promotion-workflow.md`
2. Promote via `memory/workflows/promote-to-memory.md` when appropriate
3. Update `INDEX.md` Learning Updates table

## Category Checklist

- [ ] Learning validated through outcome evidence
- [ ] Not speculation or defense of prior conclusions
- [ ] Full traceability chain documented
- [ ] Promotion deferred until validation review complete
