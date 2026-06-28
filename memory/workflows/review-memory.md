# Workflow: Review Memory

Periodic review of memory artifacts for accuracy, drift, confidence adjustment, and retirement.

## Architecture Reference

- Governance Architecture v1.0 — Memory Drift, Reflection Principle, Continuous Improvement Principle
- Memory Architecture v1.0 — All memory categories
- Outcome & Results Architecture v1.0 — Pattern reinforcement and weakening (AF-016)
- LAD-009 — No component is exempt from validation

## Review Triggers

Review memory artifacts when:

- New outcome evidence contradicts or supports existing memory
- Source material is retired or superseded
- Retrieval produces unexpected interpretations traceable to memory content
- Scheduled periodic review (recommended: quarterly for active memory)
- Executive requests memory audit
- Pattern reinforcement status may need update

## Steps

### 1. Select artifacts for review

Priority order:

1. Memory with recent contradictory outcome evidence
2. Pattern memory (`reinforcement_status: weakening`)
3. High-confidence memory not reviewed in 90+ days
4. Memory linked to retired source material

### 2. Apply evaluative questions

| Question | Action if yes |
|----------|---------------|
| What evidence supports this memory? | Document in review notes |
| What evidence contradicts this memory? | Consider confidence reduction |
| Is this still accurate? | Update or weaken |
| Is this still useful for future outcomes? | Retire if not |
| Has the source been superseded? | Re-validate or retire |
| Is memory drift occurring? | Correct with visible transformation log |

### 3. Determine review outcome

| Outcome | Action |
|---------|--------|
| Confirm | Update `last_reviewed`; keep `review_status: active` |
| Update | Edit artifact; log in `transformation_log`; create promotion record if material |
| Weaken | Set `confidence` lower or `reinforcement_status: weakening` for patterns |
| Retire | Set `review_status: retired`; document rationale in promotion record |
| Promote to pattern | If repeated evidence now exists — `promote-to-pattern.md` |

### 4. Handle pattern reinforcement (AF-016)

For pattern memory:

| Outcome evidence | Update |
|------------------|--------|
| Supports pattern | `reinforcement_status: strengthening` |
| Mixed | `reinforcement_status: stable`; note uncertainty |
| Contradicts | `reinforcement_status: weakening` |
| Repeatedly contradicts | `review_status: retired` |

Pattern existence does not guarantee future effectiveness.

### 5. Document review

For material changes, create promotion record:

- `promotion_type: memory-update`
- Document what changed and why

Update `last_reviewed` on all reviewed artifacts.

### 6. Update registry

Update `memory/INDEX.md` status fields.

## Memory Drift Defense

Memory drift — stored learning becoming inaccurate or distorted — is monitored per Governance Architecture.

Defense:

- Periodic review using this workflow
- Outcome-linked validation via `link-outcome-reference.md`
- Visible transformation logging (LAD-011)
- No silent confidence or content changes

## Governance Checklist

- [ ] Evaluative questions applied
- [ ] Material changes logged and reviewable
- [ ] Pattern reinforcement status updated when applicable
- [ ] `last_reviewed` updated
- [ ] `INDEX.md` updated

## Do Not

- Silently rewrite memory content
- Retire memory without documented rationale
- Strengthen patterns without outcome evidence
