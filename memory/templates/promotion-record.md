---
# Promotion Record Artifact
# Naming: prom-{YYYYMMDD}-{slug}.md

id:                          # e.g. PROM-001
category: promotion
title:                       # required — brief description of promotion decision
promotion_date:              # YYYY-MM-DD
promotion_type:              # observation-to-memory | memory-to-pattern | memory-update | rejection | deferral
from_artifact:               # required — path to source artifact
to_artifact:                 # required for promotion — path to target artifact (or "none" for rejection)
from_stage:                  # source | observation | memory | pattern
to_stage:                    # observation | memory | pattern | reinforcement | none
target_category:             # executive | person | relationship | situation | decision | pattern | outcome-results
reviewed_by:                 # executive | governance | system
approval_status:             # approved | rejected | deferred | pending
rationale:                   # required — why promotion was approved, rejected, or deferred
confidence_assigned:         # confidence level assigned to promoted artifact
originating_knowledge: []    # traceability chain preserved
review_status: active
---

# {title}

## Promotion Decision

<!-- Reviewable record of memory promotion. All material changes must remain visible (LAD-011). -->

## Source

| Field | Value |
|-------|-------|
| From artifact | |
| From stage | |
| Originating knowledge | |

## Target

| Field | Value |
|-------|-------|
| To artifact | |
| To stage | |
| Target category | |
| Confidence assigned | |

## Rationale

<!-- Why was this promotion approved, rejected, or deferred? -->

## Review

| Field | Value |
|-------|-------|
| Reviewed by | |
| Approval status | |
| Promotion date | |
| Follow-up required | |

## Governance Checklist

- [ ] Traceability to originating knowledge preserved
- [ ] Not a source summary — distilled intelligence only
- [ ] Pattern promotion has supporting observations, decisions, and outcomes
- [ ] Registered in `memory/INDEX.md`
