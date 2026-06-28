# Workflow: Pattern Evaluation

Evaluate patterns from memory against observed outcomes — feed reinforcement workflow.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Pattern Evaluation, Pattern Reinforcement, Pattern Weakening
- Memory Architecture v1.0 — Pattern Memory
- AF-016 — Patterns reinforced or weakened based on observed outcomes

## Prerequisites

- Outcome capture complete
- Relevant patterns identified in memory or referenced through recommendation/inference chain
- Pattern validation not performed in inference layer

## Steps

### 1. Identify relevant patterns

Reference patterns from:

- `memory/pattern/` artifacts linked through recommendation or inference chain
- Patterns cited in Interpretation Package or Recommendation Package
- Patterns related to situation domain

Do not re-identify patterns in inference.

### 2. Evaluate each pattern

| Question | Evidence source |
|----------|-----------------|
| Did observed outcomes support the pattern? | Outcome capture |
| Did observed outcomes contradict the pattern? | Outcome capture, contradictory evidence |
| Is this single instance or repeated validation? | Prior outcome evidence |
| Should pattern confidence change? | Evaluation result |

### 3. Review contradictory evidence

Per Governance Architecture — Contradictory Evidence Principle:

- Document contradicting outcome evidence
- Do not ignore single contradictory instances for established patterns
- Single supporting instance does not automatically reinforce pattern

### 4. Assign evaluation result

| Result | Criteria |
|--------|----------|
| Reinforced | Outcomes support pattern; repeated validation |
| Weakened | Outcomes contradict pattern |
| Unchanged | Inconclusive or neutral evidence |
| Not applicable | No relevant pattern |

### 5. Create artifact

Copy `templates/pattern-validation-template.md` to `validation/`.

Rename: `out-pat-val-{short-slug}.md`

Link `pattern_references` to `memory/pattern/` artifacts.

### 6. Update registry

Update `outcomes/INDEX.md` Component Artifacts table.

## Do Not

- Re-identify patterns in inference
- Reinforce pattern from single instance without review
- Modify pattern memory directly — use reinforcement workflow
- Ignore contradictory evidence

## Next Steps

- `reinforcement-workflow.md`
- `memory/workflows/review-memory.md` after reinforcement update
