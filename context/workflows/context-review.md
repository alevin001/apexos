# Workflow: Context Review

Review context relevance decisions after outcomes, retrieval validation, or scheduled review.

## Architecture Reference

- Governance Architecture v1.0 — Context Drift, Continuous Improvement Principle
- Context Architecture v1.0 — Context Lifecycle
- LAD-009 — No component is exempt from validation

## Review Triggers

Review context artifacts when:

- Outcome evidence is available for the related situation
- Retrieval validation identifies relevance gaps (see `retrieval/workflows/retrieval-validation.md`)
- Inference or recommendation quality traces back to context scope issues
- Active evaluation exceeds 30 days without resolution
- Executive requests context audit
- Context drift indicators detected (see `governance/context-drift-detection.md`)

## Steps

### 1. Select artifacts for review

Priority order:

1. Handed-off evaluations with contradictory outcome evidence
2. Evaluations where retrieval validation failed
3. Active evaluations exceeding 30 days
4. Evaluations with suspected context drift

### 2. Apply evaluative questions

| Question | Action if yes |
|----------|---------------|
| Were the right domains weighted? | Confirm or adjust |
| Were excluded domains correctly excluded? | Confirm or adjust |
| Did retrieval scope match the relevance specification? | Investigate retrieval or context |
| Did missing context affect outcomes? | Adjust weights; consider refresh |
| Is context drift occurring? | Correct with visible transformation log |

### 3. Determine review outcome

| Outcome | Action |
|---------|--------|
| Confirm | Set `review_status: confirmed`; update review artifact |
| Adjust | Execute `context-refresh.md`; log in `transformation_log` |
| Supersede | Archive original; create new evaluation if situation continues |

### 4. Create review record

Copy `templates/context-review.md` alongside the evaluated artifact.

Rename: `{evaluation-basename}.review.md`

Complete review frontmatter and evaluative questions.

### 5. Handle insights for memory

If review produces insights worth retaining long-term:

- Do not store in context artifact
- Use `context-promotion.md` to create memory observation

### 6. Update registry

Update `context/INDEX.md` under Context Reviews.

Archive evaluations marked complete: `status: archived`.

## Governance Checklist

- [ ] Review triggered by valid criterion
- [ ] Evaluative questions answered
- [ ] Review outcome documented
- [ ] Adjustments logged in transformation log if applicable
- [ ] No distilled intelligence stored in review artifact
- [ ] `INDEX.md` updated

## Do Not

- Store review conclusions as memory without observation workflow
- Silently adjust weights without review record
- Skip review when outcome evidence contradicts relevance decisions

## Next Step

If situation continues: `context-refresh.md`

If situation resolved: archive in `INDEX.md`
