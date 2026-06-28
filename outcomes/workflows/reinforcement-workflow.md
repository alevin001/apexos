# Workflow: Reinforcement

Apply pattern reinforcement or weakening based on pattern evaluation and outcome evidence.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Pattern Reinforcement, Pattern Weakening, Reinforcement Update
- Memory Architecture v1.0 — Pattern Memory, Memory Promotion Model
- AF-016 — Pattern existence does not guarantee future effectiveness

## Prerequisites

- Pattern evaluation complete via `pattern-evaluation-workflow.md`
- Pattern validation artifact links to `memory/pattern/` artifact
- Evaluation result: reinforced, weakened, or stable

## Steps

### 1. Reference pattern and evaluation

Link:

- Pattern memory artifact in `memory/pattern/`
- Pattern validation artifact
- Prior reinforcement status and confidence

### 2. Determine update type

| Evaluation result | Update type |
|-------------------|-------------|
| Reinforced | `reinforce` |
| Weakened | `weaken` |
| Unchanged | `stable` |
| Not applicable | Skip workflow |

### 3. Document update rationale

- Outcome evidence supporting update
- Prior vs updated reinforcement status
- Prior vs updated confidence
- Weight impact for future retrieval/inference

### 4. Create reinforcement update

Copy `templates/reinforcement-update-template.md` to `reinforcement/`.

Rename: `out-rnf-{short-slug}.md`

Set `update_type`, `prior_reinforcement_status`, `updated_reinforcement_status`.

### 5. Trigger memory review

Pattern memory update occurs via `memory/workflows/review-memory.md`:

- Do not directly rewrite pattern artifact
- Append reinforcement history
- Update `reinforcement_status` through memory review workflow

### 6. Update registry

Update `outcomes/INDEX.md` Reinforcement Updates table.

## Do Not

- Directly rewrite pattern memory artifacts
- Reinforce from single instance without evaluation review
- Weaken patterns without documented contradictory evidence
- Create new patterns — use `memory/workflows/promote-to-pattern.md`

## Next Steps

- `memory/workflows/review-memory.md`
- Future retrieval and inference may reference updated pattern weight
