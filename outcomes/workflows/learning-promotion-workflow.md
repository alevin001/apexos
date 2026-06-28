# Workflow: Learning Promotion

Promote validated learning from outcome validation to memory and downstream layers.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Learning Loop, Learning Promotion
- Memory Architecture v1.0 — Memory Promotion Model
- AF-015 — Continuous improvement through measured learning

## Prerequisites

- Validation Package `status: complete` or `validated`
- Learning update artifact created
- Outcome review checklist passed
- Learning supported by outcome evidence — not speculation

## Steps

### 1. Verify validated learning

Confirm learning update meets criteria:

| Criterion | Required |
|-----------|----------|
| Supported by outcome evidence | Yes |
| Not contradicted by other evidence | Reviewed |
| Validation review complete | Yes |
| Not defense of prior conclusions | Yes |
| Full traceability chain documented | Yes |

### 2. Assess promotion target

| Learning type | Promotion target |
|---------------|----------------|
| Outcome insight | `memory/outcome-results/` |
| Decision learning | `memory/decision/` |
| Pattern learning | `memory/pattern/` via review |
| Situation learning | `memory/situation/` |
| Relationship learning | `memory/relationship/` |
| Executive learning | `memory/executive/` |

### 3. Complete promotion assessment

Update learning update artifact:

- `promotion_status: approved` or `deferred` or `rejected`
- Document rationale for deferral or rejection

### 4. Promote to memory

When approved, execute appropriate memory workflow:

- General promotion: `memory/workflows/promote-to-memory.md`
- Pattern promotion: `memory/workflows/promote-to-pattern.md` (when criteria met)
- Outcome linking: `memory/workflows/link-outcome-reference.md`

Create outcome/results memory when durable outcome evidence warrants retention.

### 5. Update Validation Package

Set Validation Package `learning_promoted` to learning update path.

Update `promoted_to_memory` in learning update frontmatter.

### 6. Notify downstream layers

Validated learning may inform:

- `context/workflows/context-review.md` — relevance review
- `retrieval/workflows/retrieval-validation.md` — retrieval effectiveness
- `inference/` — future interpretation (reference validated learning, do not re-infer)
- `recommendation/` — future recommendation confidence

### 7. Update registry

Update `outcomes/INDEX.md` Learning Updates table.

## Do Not

- Promote unvalidated learning
- Promote speculation or defense of prior conclusions
- Rewrite historical memory — append via promotion workflows
- Skip outcome review checklist
- Promote learning that contradicts documented contradictory evidence

## Promotion Deferred When

- Outcome evidence inconclusive
- Contradictory evidence unresolved
- Single instance without supporting pattern
- Follow-up still pending for high-uncertainty decisions

## Next Steps

- `memory/workflows/promote-to-memory.md`
- `context/workflows/context-review.md` when learning affects relevance
