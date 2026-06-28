---
# Outcome Reference Artifact
# Naming: {memory-basename}.outcome-ref.md
# Cross-layer link between memory and outcome evidence

id:                          # e.g. OUTREF-001
category: outcome-reference
title:                       # required
related_memory:              # required — path to memory artifact this references
related_memory_id:           # required — e.g. MEM-DEC-001
related_outcome_memory:      # optional — path to outcome-results memory artifact
related_outcome_layer:       # optional — path to outcomes/ artifact (Build 06)
summary:                     # required — how this outcome evidence relates to the memory
outcome_type:                # positive | negative | mixed | measured | unexpected
outcome_date:                # YYYY-MM-DD
validation_impact:           # supports | contradicts | neutral | inconclusive
confidence_impact:           # optional — strengthen | weaken | no_change
review_status: draft
last_reviewed:
---

# {title}

## Reference Purpose

<!-- Link memory artifacts to outcome evidence without duplicating outcome capture architecture. -->

## Memory Link

| Field | Value |
|-------|-------|
| Related memory | |
| Memory ID | |
| Memory category | |

## Outcome Evidence

| Field | Value |
|-------|-------|
| Outcome memory | |
| Outcomes layer artifact | |
| Outcome type | |
| Validation impact | |

## Attribution

<!-- What action or decision does this outcome attribute to? Action-to-outcome correlation (LAD-016). -->

## Notes

<!-- Distinguish factual observations from interpretations. -->
