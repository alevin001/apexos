# Context Layer

## Responsibility

This folder implements the Context Layer — determining what information is most relevant to the current situation.

**Memory answers:** What does ApexOS know?

**Context answers:** What matters right now?

**Core principle:** Context exists to determine relevance, not to store information (LAD-006, AF-004).

## Architecture Reference

- **Primary:** `architecture/4 - ApexOS - Context Architecture v1.0.docx`
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Context Layer)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (DOC-004, LAD-006, AF-005)

## Situation-Centered Model

```
Situation → Evaluate Context Domains → Load Relevant Context → Weight By Relevance → Context Evaluation → Improved Interpretation
```

## Context Domains

| Folder | Domain |
|--------|--------|
| `situation/` | Situation-centered entry point — leadership disagreements, strategic decisions, negotiations, etc. |
| `executive/` | Current state of the executive |
| `person/` | Individual independent of any specific relationship |
| `relationship/` | How two individuals interact |
| `organizational/` | Current state of the organization |
| `strategic/` | Alignment against mission, objectives, priorities, doctrine |
| `pattern/` | Access to validated learning |
| `outcome-results/` | Evidence of what actually occurred |

## Build Plan Functional Areas

The Build Plan lists three functional areas that span context domains:

- Situation assembly
- Context construction
- Relevant information selection

These processes are implemented across the context domains above, not as separate storage categories. Build 04 will define how these functions operate across domains.

## Context Weighting

Context is not weighted by recency alone. Weighting signals: situation relevance, outcome/results impact, pattern strength, strategic significance, relationship significance, recency (as one factor among many).

## Primary Output

Improved interpretation — enabling better decisions, communication, relationships, alignment, and outcomes/results.

## Implementation Scope

Build 04 will translate Context Architecture into implementation artifacts.
