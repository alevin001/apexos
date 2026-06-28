---
# Retrieval Review Record
# Naming: {request-basename}.review.md
# Layer: Retrieval — post-delivery validation

id:                          # e.g. RET-REV-001
title:                       # required
review_date:                 # YYYY-MM-DD
status: complete
validates:                   # required — path to retrieval request or Context Package
context_reference:           # required
validation_outcome:          # passed | failed | adjusted
issues_found: []             # list of validation failures if any
context_review_needed: false # true if relevance specification may be wrong
transformation_log: []
---

# {title}

## Review Trigger

<!-- Validation workflow, outcome feedback, inference gap, scheduled review? -->

## Validation Criteria

| Criterion | Result | Notes |
|-----------|--------|-------|
| Matches context tier requirements | | |
| Smallest effective set | | |
| All items have source paths | | |
| Contradictory evidence included | | |
| Gaps documented | | |
| No inference in package | | |

## Issues Found

<!-- Detail any failures. -->

## Adjustments Made

<!-- If adjusted — new retrieval request, re-assembly, etc. -->

## Context Review Required

<!-- If yes — link to context review trigger reason. -->

| Reason | Action |
|--------|--------|
| | |

## Outcome Feedback

<!-- When available — did retrieval support effective inference? -->

## Traceability

| Field | Value |
|-------|-------|
| Validates | |
| Validation outcome | |
| Context review needed | |

## Learning for Future Retrieval

<!-- Observations for retrieval improvement — not memory unless promoted separately. -->
