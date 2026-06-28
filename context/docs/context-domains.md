# Context Domains

Context Architecture v1.0 defines eight context domains. Each domain is an evaluation lens — not a storage category.

## Architecture Reference

- Context Architecture v1.0 (DOC-004) — Context Domains
- Foundations Architecture v1.0 (DOC-002) — Core objects

## Domain Map

| Domain | Folder | Evaluates | Does not store |
|--------|--------|-----------|----------------|
| Situation | `situation/` | The leadership challenge, decision, or interaction at hand | Situation memory (see `memory/situation/`) |
| Executive | `executive/` | Current state of the executive — emotional state, stress, priorities, concerns | Executive memory (see `memory/executive/`) |
| Person | `person/` | Individual relevant to the situation, independent of relationship | Person memory (see `memory/person/`) |
| Relationship | `relationship/` | Dynamics between two individuals in the situation | Relationship memory (see `memory/relationship/`) |
| Organizational | `organizational/` | Collective organizational conditions — morale, alignment, pressures | Organizational memory (not a memory category) |
| Strategic | `strategic/` | Alignment with mission, objectives, priorities, doctrine | Doctrine content (see `knowledge/doctrine/`) |
| Pattern | `pattern/` | Validated learning applicable to the situation | Pattern storage (see `memory/pattern/`) |
| Outcome/Results | `outcome-results/` | Past results relevant to interpreting the current situation | Outcome/results memory (see `memory/outcome-results/`) |

## Situation-Centered Entry

All context evaluation begins from a situation (`situation/`). Other domains are evaluated based on situation relevance — not all domains require equal attention for every situation.

Examples of situations (Context Architecture):

- Leadership disagreements
- Strategic decisions
- Personnel issues
- Organizational challenges
- Communication challenges
- Negotiations
- Opportunity evaluations

## Domain Evaluation Questions

Use these questions during context assembly. They guide evaluation — they do not produce inference or recommendations.

### Situation

- What is the executive seeking assistance with?
- What type of situation is this?
- What is at stake for outcomes and results?
- What time sensitivity applies?

### Executive

- What is the executive's current emotional state, stress, and energy?
- What priorities and concerns are active?
- How might executive state influence communication and decision-making?

### Person

- Which individuals are central to this situation?
- What person-specific context is relevant independent of relationships?

### Relationship

- Which relationships are active in this situation?
- What relationship dynamics may affect interpretation?

### Organizational

- What organizational conditions (morale, alignment, pressures) affect this situation?
- Are collective conditions visible that individual relationships do not capture?

### Strategic

- How does this situation relate to mission, objectives, and priorities?
- What doctrine or strategic constraints apply?

### Pattern

- What validated patterns from `memory/pattern/` may apply?
- What is the pattern strength and relevance to this situation?

### Outcome/Results

- What past outcomes or results are relevant to interpreting this situation?
- What outcome evidence from `memory/outcome-results/` should inform relevance?

## Cross-Domain Rules

1. Evaluate domains based on situation relevance — do not evaluate all domains equally by default.
2. Reference memory and knowledge paths — do not duplicate stored content into context artifacts.
3. Document which domains were evaluated and which were intentionally excluded.
4. Record exclusion rationale when a domain might seem relevant but was deprioritized.

## Traceability

Link evaluated domains to:

- `memory_references` — distilled intelligence consulted for relevance
- `knowledge_references` — sources and frameworks flagged for retrieval
- `domain_weights` — weighting decisions documented in evaluation artifact

See `context-traceability.md`.
