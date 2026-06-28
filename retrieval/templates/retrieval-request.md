---
# Retrieval Request
# Naming: ret-req-{short-slug}.md
# Layer: Retrieval — scopes evidence assembly from context handoff

id:                          # e.g. RET-REQ-001
title:                       # required
request_date:                # YYYY-MM-DD
status: draft                # draft | in_progress | assembled | delivered | validated | archived
context_reference:           # required — path to context relevance specification
retrieval_targets: []        # required — knowledge | memory | evidence | pattern
scope_summary:               # required — what retrieval must assemble
tier_requirements:           # from context specification
  critical: []               # domains requiring Critical Context
  supporting: []             # domains requiring Supporting Context
  available: []              # domains requiring Available Context
exclusions: []                # explicit scope exclusions from context
evidence_package:            # populated after assembly
context_package:             # populated after delivery
contradictory_evidence_required: true
validation_status: pending
transformation_log: []
---

# {title}

## Context Reference

<!-- Link and summary of context relevance specification. Do not duplicate full context evaluation. -->

| Field | Value |
|-------|-------|
| Context artifact | |
| Situation | |
| Domain weights | |

## Retrieval Scope

<!-- What must be retrieved? Boundaries? -->

## Target Layers

| Target | Scope | Priority |
|--------|-------|----------|
| Knowledge | | |
| Memory | | |
| Pattern | | |
| Evidence | | |

## Tier Requirements

<!-- Mapped from context domain weights. -->

### Critical Context Requirements

### Supporting Context Requirements

### Available Context Requirements

## Search Plan

<!-- What registries, folders, and metadata filters will be searched? -->

| Source | Search scope | Filters |
|--------|--------------|---------|
| knowledge/INDEX.md | | |
| memory/INDEX.md | | |

## Contradictory Evidence Plan

<!-- How will contradictory evidence be sought? -->

## Traceability

| Field | Value |
|-------|-------|
| Context reference | |
| Request date | |
| Evidence package | |
| Context package | |

## Notes

<!-- Operational notes. No inference. -->
