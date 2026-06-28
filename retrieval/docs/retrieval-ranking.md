# Retrieval Ranking

Ranking signals and application rules within context-defined priorities.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Retrieval Ranking
- Context Architecture v1.0 (DOC-004) — Context Weighting

## Core Rule

Context weighting establishes **what to retrieve and at what priority**. Retrieval ranking orders **specific artifacts within** those priorities.

Retrieval ranking does not override context weights. If ranking suggests a different priority, trigger context review — do not silently re-prioritize.

## Ranking Signals

| Signal | Question | High rank when |
|--------|----------|----------------|
| Situation relevance | How directly does this artifact apply? | Central to the current situation |
| Outcome/results impact | What if this artifact is missed? | Could materially affect outcomes |
| Pattern strength | How validated is the pattern? | Repeated outcome evidence |
| Strategic significance | How aligned with mission and doctrine? | Strategic commitments involved |
| Relationship significance | How much do relationships matter? | Relationship-driven situation |
| Recency | How recent is the underlying information? | Adds urgency — not automatic priority |

## Recency Rule

Recency may influence retrieval. Recency should not dominate retrieval. Newer does not automatically mean more important.

If recency would override situation relevance, document the exception rationale in the evidence package.

## Ranking Within Tiers

For each context tier (Critical, Supporting, Available):

1. Collect candidate artifacts from `knowledge/` and `memory/` matching retrieval scope
2. Score each artifact on ranking signals (qualitative: high / medium / low)
3. Order by combined signal assessment — situation relevance weighted highest
4. Select smallest effective set per tier
5. Document exclusions — artifacts considered but not included

## Registry and Metadata Support

Use artifact frontmatter for filtering (Build 02 and Build 03):

**Knowledge artifacts:**

- `tags`, `situation_types`, `related_concepts`, `related_frameworks`, `status`

**Memory artifacts:**

- `confidence`, `review_status`, `related_outcomes`, `originating_knowledge`

Exclude `draft` or `retired` artifacts unless explicitly requested in retrieval scope.

## Ranking vs Selection

| Step | Output |
|------|--------|
| Ranking | Ordered candidate list per tier |
| Selection | Smallest set included in evidence package |
| Exclusion documentation | Why higher-ranked items were excluded (scope limits, redundancy, quality) |

## Anti-Patterns

| Anti-pattern | Violation |
|--------------|-----------|
| Rank by date only | Recency dominance |
| Include all matching artifacts | Completeness over effectiveness |
| Rank without context tiers | Bypasses context relevance |
| Exclude contradictory evidence | Violates AF-008 |
| Prefer reference over primary source | Traceability degradation |

## Review

Revisit ranking when retrieval validation fails or context review identifies scope issues.

See `../workflows/retrieval-validation.md`.
