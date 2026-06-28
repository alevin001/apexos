---
id: CTX-PKG-001
domain: situation
title: Q2 Leadership Conflict Context Specification
situation_summary: Executive team misalignment on Q2 priorities between product and sales leadership requires structured decision support.
evaluation_date: "2026-06-20"
status: handed_off
related_situation: leadership-conflict-q2
domain_weights:
  situation: critical
  executive: supporting
  person: supporting
  relationship: supporting
  organizational: available
  strategic: supporting
  pattern: supporting
  outcome-results: excluded
weighting_rationale: Situation domain is critical because the immediate leadership conflict drives the evaluation. Person and relationship domains support understanding stakeholder dynamics.
memory_references:
  - scenarios/leadership-conflict-q2/memory/situation-leadership-conflict.md
knowledge_references:
  - scenarios/leadership-conflict-q2/knowledge/sample-leadership-transcript.meta.md
retrieval_tiers:
  critical:
    - situation
    - executive
  supporting:
    - person
    - relationship
    - strategic
    - pattern
  available:
    - organizational
retrieval_request: scenarios/leadership-conflict-q2/retrieval/ret-req-leadership-conflict-q2.md
review_status: confirmed
transformation_log:
  - date: "2026-06-28"
    action: handed_off
    rationale: Context specification handed to retrieval for evidence assembly
    actor: build-09
---

# Q2 Leadership Conflict Context Specification

## Situation

Executive team faces recurring Q2 planning misalignment between product roadmap priorities and sales revenue targets.

## Domain Weights

| Domain | Weight | Rationale |
|--------|--------|-----------|
| Situation | critical | Direct conflict requiring resolution |
| Executive | supporting | Executive judgment and priorities |
| Person | supporting | Key stakeholder dynamics |
| Relationship | supporting | Working relationship context |
| Strategic | supporting | Q2 strategic alignment |
| Pattern | supporting | Prior conflict patterns |

## Retrieval Handoff Criteria

Retrieval must assemble critical situation and executive context, supporting person/relationship evidence, and flag organizational context as available.
