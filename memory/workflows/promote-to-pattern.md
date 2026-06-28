# Workflow: Promote to Pattern

Promote validated memory to pattern after repeated observation and outcome confirmation.

## Architecture Reference

- Memory Architecture v1.0 — Memory Promotion Model (Memory → Pattern → Reinforcement)
- Memory Architecture v1.0 — Pattern Memory
- Outcome & Results Architecture v1.0 — Pattern Evaluation, Reinforcement, Weakening (AF-016)
- Foundations Architecture v1.0 — Pattern object

## Prerequisites

- Multiple supporting observations or memory artifacts — **patterns are not memories until validated**
- Supporting decision memory (recommended)
- Supporting outcome/results evidence (required)
- Pattern is repeatedly observed, not a single incident

## Pattern Promotion Criteria

| Requirement | Minimum |
|-------------|---------|
| Supporting observations or memory artifacts | 2+ independent instances |
| Supporting outcomes | 1+ with clear attribution |
| Contradicting evidence reviewed | documented |
| Executive or governance review | completed |

A single observation or memory artifact does not qualify as a pattern.

## Steps

### 1. Collect supporting evidence

Document in a working list before creating the pattern:

| Evidence type | Artifact path | Outcome |
|---------------|---------------|---------|
| Observation / memory | | |
| Decision | | |
| Outcome/results | | |

Review contradictory evidence per Governance Architecture — Contradictory Evidence Principle.

### 2. Verify pattern vs memory distinction

| Pattern | Memory |
|---------|--------|
| Repeatedly validated | May be single-instance |
| Multiple observations + outcomes | Single retained intelligence |
| `confidence: validated` at creation | `medium` or `high` |

If criteria are not met, retain as memory and continue collecting evidence.

### 3. Create pattern artifact

Copy `templates/pattern-memory.md` to `pattern/`.

Rename: `{pattern-slug}.md`

Complete:

- `supporting_observations` — links to evidence
- `supporting_decisions` — links to decision memory
- `supporting_outcomes` — links to outcome/results memory
- `promoted_from` — memory artifacts that contributed
- `confidence: validated`
- `reinforcement_status: stable` (initial)

### 4. Create promotion record

Copy `templates/promotion-record.md` to `promotion/`.

Set `promotion_type: memory-to-pattern`.

Document supporting evidence count and review rationale.

### 5. Update contributing memory artifacts

Add link to new pattern in `related_patterns` of contributing memory artifacts.

### 6. Register artifacts

Add to `memory/INDEX.md`:

- Pattern under Pattern Memory
- Promotion record under Promotion Records

Assign IDs (e.g., `MEM-PAT-001`, `PROM-002`).

## Governance Checklist

- [ ] Multiple independent evidence instances documented
- [ ] Outcome/results evidence linked
- [ ] Contradictory evidence reviewed
- [ ] Promotion record created
- [ ] Not promoted from single observation alone
- [ ] Entries in `INDEX.md`

## Do Not

- Create patterns from single observations
- Treat inferential pattern recognition (`inference/pattern-recognition/`) as pattern memory
- Assume pattern existence guarantees future effectiveness (AF-016)

## Ongoing

Patterns must be reinforced or weakened based on observed outcomes. Use `review-memory.md` when new outcomes contradict or support the pattern.

## Next Step

Periodic review and outcome-linked updates: `review-memory.md`
