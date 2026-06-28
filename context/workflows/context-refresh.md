# Workflow: Context Refresh

Update a context evaluation when the situation evolves but is not yet complete.

## Architecture Reference

- Context Architecture v1.0 — Context Lifecycle
- Governance Architecture v1.0 — No Silent Transformation Principle (LAD-011)

## Prerequisites

- Active or handed-off context evaluation exists
- Situation has evolved — new information, changed stakes, or adjusted scope
- Context review recommends adjustment, or executive requests update

## Steps

### 1. Assess refresh scope

Determine what changed:

| Change type | Refresh action |
|-------------|----------------|
| New individuals or relationships | Re-evaluate person and relationship domains |
| Changed executive state | Re-evaluate executive domain |
| New organizational conditions | Re-evaluate organizational domain |
| Changed strategic stakes | Re-evaluate strategic domain |
| New outcome evidence | Re-evaluate outcome/results domain |
| Retrieval scope mismatch | Adjust weights; may require new retrieval request |

### 2. Document the change

Log in `transformation_log` on the evaluation artifact:

- What changed
- Why refresh is needed
- Date of refresh

### 3. Update domain evaluation and weights

Revise evaluation and weighting artifacts. Do not silently change weights — document rationale for each change.

If material weight changes occur after retrieval handoff:

1. Create context review record noting the adjustment
2. Create new retrieval request if scope materially changed
3. Link new retrieval request in updated package artifact

### 4. Update status

| Prior status | New status |
|--------------|------------|
| `handed_off` | `active` (during refresh) → `handed_off` (after re-handoff) |
| `active` | Remains `active` |

### 5. Re-handoff if needed

If retrieval scope changed materially:

1. Run `governance/context-fidelity-checklist.md`
2. Create new retrieval request
3. Execute `retrieval/workflows/retrieval-pipeline.md`

### 6. Update registry

Update `context/INDEX.md` with refresh notes.

## Governance Checklist

- [ ] Change documented in transformation log
- [ ] Weight changes have documented rationale
- [ ] No silent scope expansion or reduction
- [ ] Re-handoff completed if retrieval scope changed
- [ ] `INDEX.md` updated

## Do Not

- Create duplicate orphan evaluations without superseding prior artifact
- Refresh without documenting what changed
- Assemble evidence during refresh — hand off to retrieval

## Next Step

After situation resolves: `context-review.md` then archive
