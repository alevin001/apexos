---
# Context Review Record
# Naming: {evaluation-basename}.review.md
# Layer: Context — post-outcome review of relevance decisions

id:                          # e.g. CTX-REV-001
domain: situation
title:                       # required
review_date:                 # YYYY-MM-DD
status: complete
evaluates:                   # required — path to context evaluation or package artifact
outcome_reference:           # optional — link to outcome evidence
review_outcome:              # confirmed | adjusted | superseded
adjustments_made: []         # list of changes if adjusted
transformation_log: []
---

# {title}

## Review Trigger

<!-- Why was this review initiated? Outcome evidence, retrieval validation, scheduled review? -->

## Original Relevance Decisions

<!-- Summary of domain weights and rationale from evaluated artifact. -->

## Outcome Evidence

<!-- What happened? Link to outcomes/ or memory/outcome-results/ — do not duplicate. -->

## Evaluative Questions

| Question | Answer |
|----------|--------|
| Were the right domains weighted? | |
| Were excluded domains correctly excluded? | |
| Did retrieval scope match relevance specification? | |
| Did missing context affect outcomes? | |
| Is context drift occurring? | |

## Review Outcome

| Outcome | Action taken |
|---------|--------------|
| Confirm | |
| Adjust | |
| Supersede | |

## Adjustments

<!-- If adjusted — document weight changes, refresh requirements, or archive decision. -->

## Learning for Future Context

<!-- Observations worth retaining — create memory observation separately if needed. -->

## Traceability

| Field | Value |
|-------|-------|
| Evaluates | |
| Outcome reference | |
| Review outcome | |
