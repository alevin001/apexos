# Workflow: Executive Follow-Up

Proactive outcome follow-up and re-validation where learning value justifies the effort.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Outcome Follow-Up Architecture, Outcome Follow-Up Principle

## Prerequisites

- Recommendation Package delivered
- Follow-up trigger identified
- Learning value assessed as significant

## Follow-Up Triggers

| Trigger | Examples |
|---------|----------|
| Recommendation importance | Major leadership decisions, strategic initiatives |
| Expected learning value | High uncertainty recommendations |
| Strategic significance | Organizational changes, restructures |
| Uncertainty level | Low-confidence recommendations with high stakes |
| Validation importance | Outcome window not yet elapsed |
| Scheduled review | Pre-planned validation checkpoint |

## Steps

### 1. Assess follow-up warrant

Confirm follow-up is justified:

| Question | Answer |
|----------|--------|
| Is learning value significant? | |
| Are outcomes not yet observable? | |
| Was recommendation high-importance? | |
| Would follow-up effort be proportionate? | |

**Do not create unnecessary follow-up.**

### 2. Plan follow-up

Document:

- Follow-up trigger and type (initial, scheduled, reactive, closure)
- Objectives — what validation or learning is sought
- Method — conversation, reflection, organizational data, observation
- Expected outcome window

### 3. Conduct follow-up

Gather:

- Current status of outcomes
- New observable results
- Outcomes still pending
- Unexpected developments

**Findings are observations — not interpretation or recommendations.**

### 4. Assess learning value

| Question | Answer |
|----------|--------|
| Did follow-up justify its effort? | |
| Is additional follow-up warranted? | |
| Should validation be updated? | |

### 5. Create artifact

Copy `templates/executive-follow-up-template.md` to `follow-up/`.

Rename: `out-fup-{short-slug}.md`

Link `recommendation_package` and related validation package when applicable.

### 6. Trigger downstream workflows

| Finding | Workflow |
|---------|----------|
| New observable outcomes | `outcome-capture-workflow.md` (update or new capture) |
| Material new evidence | `validation-workflow.md` |
| Outcomes still pending | Schedule next follow-up |
| Learning ready for promotion | `learning-promotion-workflow.md` |

### 7. Update registry

Update `outcomes/INDEX.md` Executive Follow-Up table.

## Do Not

- Create routine follow-up without learning value
- Generate recommendations during follow-up
- Re-perform inference on follow-up findings
- Override executive decisions

## Next Steps

- `outcome-capture-workflow.md` when new outcomes observable
- `validation-workflow.md` when findings warrant validation update
