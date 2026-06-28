# Context Fidelity Checklist

Pre-handoff validation checklist for context artifacts. Run before handing off to retrieval.

## Architecture Reference

- Context Architecture v1.0 (DOC-004) — LAD-006, AF-004, AF-005
- Governance Architecture v1.0 (DOC-006) — LAD-010, LAD-011
- `docs/context-governance.md`

## Situation Definition

- [ ] Situation clearly defined — type, stakes, time sensitivity
- [ ] Situation summary does not contain inference or recommendations
- [ ] Key individuals identified where relevant

## Domain Evaluation

- [ ] All high/medium intake domains evaluated or explicitly excluded
- [ ] Excluded domains have documented rationale
- [ ] Domain evaluation does not contain conclusions or decision support
- [ ] Extended domain supplements linked to parent evaluation if created

## Context Weighting

- [ ] Every domain has an assigned weight (critical / supporting / available / excluded)
- [ ] Weighting uses multiple signals — not recency alone (AF-005)
- [ ] Weight rationale documented for every domain
- [ ] Retrieval tier mapping documented (critical → Critical Context, etc.)

## Boundary Compliance

- [ ] No distilled intelligence stored — memory referenced by path only
- [ ] No source content duplicated — knowledge referenced by path only
- [ ] No evidence assembled — evidence assembly is retrieval responsibility
- [ ] No inference, hypotheses, or recommendations in context artifacts
- [ ] Context package is relevance specification — not assembled Context Package

## Traceability

- [ ] Artifact has registry ID
- [ ] `memory_references` populated where memory informed evaluation
- [ ] `knowledge_references` populated where knowledge flagged for retrieval
- [ ] Entry exists in `context/INDEX.md`
- [ ] `transformation_log` populated if artifact was refreshed or derived

## Handoff Readiness

- [ ] Relevance specification complete (`templates/context-package.md`)
- [ ] Retrieval handoff criteria documented
- [ ] Scope boundaries and exclusions documented
- [ ] Ready to create retrieval request

## Failure Response

If any item fails:

1. Do not hand off to retrieval
2. Correct the artifact or document why the item does not apply
3. Re-run checklist
4. Log material corrections in `transformation_log`

## Sign-Off

| Field | Value |
|-------|-------|
| Artifact ID | |
| Checklist date | |
| Passed | yes / no |
| Reviewer | |
