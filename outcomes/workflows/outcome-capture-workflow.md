# Workflow: Outcome Capture

Capture action taken and observed results with full action-to-outcome correlation.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Outcome Capture, Outcome Capture Principle
- LAD-016, AF-017 — Action-to-outcome correlation

## Prerequisites

- Recommendation Package `status: delivered`
- Executive decision made (external reference)
- Action taken (observable or documentable)
- Outcome observable or follow-up scheduled

## Steps

### 1. Link recommendation

Reference Recommendation Package:

- Path to `recommendation/decision-support/rec-pkg-{slug}.md`
- Outcome tracking considerations from package
- Do not duplicate recommendation content

### 2. Document executive decision

Record external decision reference:

- Decision summary
- Decision date
- Decision rationale (as provided)
- Do not store as recommendation

### 3. Document action taken

Record what was actually done:

- Action description and date
- Whether recommendation was followed, modified, or rejected
- Modifications from recommendation if applicable

**Action is distinct from recommendation and decision.**

### 4. Document observed outcome

Record what actually occurred:

- Outcome description and observable date
- Outcome window (time from action to results)
- Measurable results when available
- Unexpected consequences

**Observed outcome is distinct from expected consequences in recommendation.**

### 5. Complete action-to-outcome correlation

Verify chain:

```
Recommendation → Decision → Action Taken → Observed Outcome
```

All four links documented.

### 6. Create outcome capture artifact

Copy `templates/outcome-capture-template.md` to `outcome-tracking/`.

Rename: `out-cap-{short-slug}.md`

Set `status: complete`.

### 7. Update registry

Update `outcomes/INDEX.md` Outcome Capture table.

## Capture Methods

| Method | When to use |
|--------|-------------|
| Executive follow-up | Proactive validation of important decisions |
| Structured reflection | Executive-initiated outcome review |
| Scheduled validation review | Outcome window elapsed per recommendation tracking |
| Organizational reporting | Measurable organizational results available |
| Outcome measurement | Quantitative metrics available |
| Behavioral observation | Leadership or relationship behavioral changes observed |

## Do Not

- Re-evaluate recommendation as decision support
- Conflate expected consequences with observed outcomes
- Omit decision or action from correlation chain
- Perform validation in capture artifact — defer to validation workflow

## Next Steps

- `validation-workflow.md`
- `executive-follow-up-workflow.md` if outcomes not yet observable
