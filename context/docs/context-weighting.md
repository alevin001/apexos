# Context Weighting

Rules for weighting context domains and signals during context evaluation.

## Architecture Reference

- Context Architecture v1.0 (DOC-004) — Context Weighting
- Architecture & Doctrine Index v2.0 — AF-005

## Core Principle

Context is **not** weighted by recency alone. Recency is one signal among many (AF-005).

Newer information does not automatically mean more important. Context weighting prioritizes executive effectiveness for the current situation.

## Weighting Signals

| Signal | Question | High weight when |
|--------|----------|------------------|
| Situation relevance | How directly does this domain affect the current situation? | Domain is central to the leadership challenge |
| Outcome/results impact | What happens if this context is missed? | Missing context could materially affect outcomes |
| Pattern strength | How validated is the applicable pattern? | Pattern has repeated outcome evidence |
| Strategic significance | How aligned is this with mission and doctrine? | Situation involves strategic commitments or doctrine |
| Relationship significance | How much do relationship dynamics matter here? | Situation is relationship-driven |
| Recency | How recent is the underlying information? | Recency adds urgency — not automatic priority |

## Weight Scale

Use consistent weights in context artifacts:

| Weight | Meaning | Retrieval implication |
|--------|---------|----------------------|
| `critical` | Must be understood before interpretation | Retrieval prioritizes as Critical Context tier |
| `supporting` | Improves confidence and understanding | Retrieval includes as Supporting Context tier |
| `available` | Useful but not immediately necessary | Retrieval includes as Available Context tier if capacity allows |
| `excluded` | Evaluated and intentionally deprioritized | Not retrieved unless contradictory evidence workflow requires |

Document exclusion rationale when a domain is marked `excluded` despite apparent relevance.

## Application Process

1. **Identify active domains** — from situation intake, not a fixed checklist.
2. **Score each signal** — qualitative assessment per domain (high / medium / low).
3. **Assign domain weight** — map combined signal assessment to weight scale.
4. **Document rationale** — record why each weight was assigned.
5. **Map to retrieval tiers** — critical → Critical Context; supporting → Supporting Context; available → Available Context.

Use `templates/context-weighting.md` to document decisions.

## Anti-Patterns

| Anti-pattern | Why it violates architecture |
|--------------|------------------------------|
| Default equal weights | Ignores situation-centered model |
| Recency-only weighting | Violates AF-005 |
| Weighting without rationale | Breaks traceability and review |
| Weighting that pre-determines inference | Context determines relevance, not conclusions |
| Storing weighted content in context | Context weights relevance — memory and knowledge store content |

## Relationship to Retrieval Ranking

Context weighting establishes **what to retrieve and at what priority**. Retrieval ranking (see `retrieval/docs/retrieval-ranking.md`) ranks **specific artifacts within** those priorities.

Context weighting precedes retrieval ranking. Retrieval does not override context weights without documented context review.

## Review

Revisit weights when:

- New outcome evidence contradicts relevance decisions
- Retrieval discovers material evidence in an excluded domain
- Situation evolves during extended engagement

See `workflows/context-review.md` and `workflows/context-refresh.md`.
