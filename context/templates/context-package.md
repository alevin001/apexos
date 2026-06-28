---
# Context Relevance Specification (Context Package Template)
# Naming: ctx-pkg-{short-slug}.md
# Layer: Context — relevance specification for retrieval handoff
# Note: Assembled Context Package with evidence is created in retrieval/context-package/

id:                          # e.g. CTX-PKG-001
domain: situation            # primary domain — usually situation
title:                       # required
situation_summary:           # required — what situation is being evaluated
evaluation_date:             # YYYY-MM-DD
status: draft                # draft | active | handed_off | archived
related_situation:           # optional — situation slug
domain_weights:              # required — map of domain: critical|supporting|available|excluded
weighting_rationale:         # required — why weights were assigned
memory_references: []        # recommended — links to memory/ artifacts consulted
knowledge_references: []     # optional — links to knowledge/ artifacts flagged for retrieval
retrieval_tiers:             # map domain weights to retrieval tier intent
  critical: []               # domains marked critical
  supporting: []             # domains marked supporting
  available: []              # domains marked available
retrieval_request:           # populated after handoff — link to retrieval request
review_status: pending       # pending | confirmed | adjusted | superseded
transformation_log: []       # record changes during refresh
---

# {title}

## Situation

<!-- What leadership challenge, decision, or interaction is being evaluated? -->

## Relevance Summary

<!-- What matters right now? High-level relevance determination — not conclusions. -->

## Domain Weights

| Domain | Weight | Rationale |
|--------|--------|-----------|
| Situation | | |
| Executive | | |
| Person | | |
| Relationship | | |
| Organizational | | |
| Strategic | | |
| Pattern | | |
| Outcome/Results | | |

## Memory References

<!-- Links to relevant memory/ artifacts. Do not duplicate memory content. -->

| Memory artifact | Path | Relevance |
|-----------------|------|-----------|
| | | |

## Knowledge References

<!-- Links to knowledge/ artifacts flagged for retrieval. Do not duplicate source content. -->

| Knowledge artifact | Path | Retrieval purpose |
|--------------------|------|-------------------|
| | | |

## Retrieval Handoff Criteria

<!-- What must retrieval assemble? Scope boundaries? -->

| Tier | Intended content | Exclusions |
|------|------------------|------------|
| Critical Context | | |
| Supporting Context | | |
| Available Context | | |

## Excluded Domains

<!-- Domains intentionally deprioritized and why. -->

## Traceability

| Field | Value |
|-------|-------|
| Evaluation date | |
| Handed off to retrieval | |
| Retrieval request | |

## Notes

<!-- Operational notes. No inference or recommendations. -->
