# Workflow: Retrieval Validation

Validate assembled evidence and Context Package before inference handoff.

## Architecture Reference

- Retrieval Architecture v1.0 — Retrieval Objectives, Context Package Assembly
- Governance Architecture v1.0 — LAD-009 — No component exempt from validation
- `governance/retrieval-fidelity-checklist.md`

## Validation Triggers

Validate before every Context Package delivery. Re-validate when:

- Evidence package is materially updated
- Context specification is refreshed
- Inference feedback indicates retrieval gaps
- Outcome evidence contradicts retrieval scope

## Steps

### 1. Run retrieval fidelity checklist

Execute `governance/retrieval-fidelity-checklist.md`.

Document pass/fail for each item.

### 2. Verify tier alignment

Compare evidence package tiers to context specification:

| Check | Pass criteria |
|-------|---------------|
| Critical tier | Contains evidence for all critical domains |
| Supporting tier | Matches supporting domain scope |
| Available tier | Matches available domain scope or documented as omitted |
| Exclusions respected | No evidence from excluded domains without rationale |

### 3. Verify traceability

- Every evidence item has source path
- Retrieval request links to context reference
- Evidence package links to retrieval request
- Contradictory evidence linked

### 4. Verify contradictory evidence

- Contradictory evidence record exists
- Conflicts documented or absence documented with search scope
- Contradictory section present in evidence package

### 5. Verify smallest effective set

- No redundant artifacts without rationale
- Exclusions documented
- Gaps documented with impact assessment

### 6. Determine validation outcome

| Outcome | Action |
|---------|--------|
| Passed | Proceed to `package-delivery.md` |
| Failed — retrieval issue | Re-run `evidence-assembly.md` |
| Failed — context issue | Trigger `context/workflows/context-review.md` |
| Adjusted | Document adjustments; re-validate |

### 7. Create review record if needed

For failed or adjusted validation, copy `templates/retrieval-review.md`.

Set `validation_status` on retrieval request.

Update `retrieval/INDEX.md`.

## Governance Checklist

- [ ] Retrieval fidelity checklist completed
- [ ] Tier alignment verified
- [ ] Traceability chain intact
- [ ] Contradictory evidence verified
- [ ] Validation outcome documented
- [ ] Context review triggered if relevance issue identified

## Do Not

- Deliver package on failed validation
- Silently fix context tier mismatches in retrieval
- Skip validation for "simple" situations

## Next Step

If passed: `package-delivery.md`

If context issue: `context/workflows/context-review.md`
