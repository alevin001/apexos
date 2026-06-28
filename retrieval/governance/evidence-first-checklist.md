# Evidence First Checklist

Pre-assembly validation checklist ensuring evidence precedes inference.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Evidence First Principle
- Governance Architecture v1.0 (DOC-006) — LAD-008, AF-007
- Inference Architecture v1.0 (DOC-007) — Inference operates upon assembled evidence

## Context Handoff Verified

- [ ] Context relevance specification exists and is linked
- [ ] Context fidelity checklist was passed before handoff
- [ ] Domain weights and tier requirements are documented
- [ ] Retrieval request reflects context specification — not reinterpreted

## Retrieval Scope

- [ ] Retrieval targets identified (knowledge, memory, pattern, evidence)
- [ ] Tier requirements mapped from context weights
- [ ] Exclusions from context specification respected
- [ ] Search plan documented in retrieval request

## Evidence Before Inference

- [ ] No inference, hypotheses, or recommendations in retrieval request
- [ ] No preliminary conclusions influencing evidence selection
- [ ] Contradictory evidence plan documented
- [ ] Evidence assembly workflow ready — not skipped

## Boundary Compliance

- [ ] Retrieval executes context relevance — does not redefine it
- [ ] Source paths will be used — content will not be duplicated
- [ ] Memory artifacts referenced by path — not copied
- [ ] Pattern retrieval targets validated patterns — not observations

## Traceability Ready

- [ ] Retrieval request has registry ID
- [ ] `context_reference` populated
- [ ] Entry will be added to `retrieval/INDEX.md`

## Failure Response

If any item fails:

1. Do not begin evidence assembly
2. Return to context handoff if context specification is incomplete
3. Correct retrieval request
4. Re-run checklist

## Sign-Off

| Field | Value |
|-------|-------|
| Retrieval request ID | |
| Checklist date | |
| Passed | yes / no |
| Reviewer | |
