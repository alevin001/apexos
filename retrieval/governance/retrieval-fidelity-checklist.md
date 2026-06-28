# Retrieval Fidelity Checklist

Pre-delivery validation checklist for evidence packages and Context Packages.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — LAD-007, AF-006, AF-008
- Governance Architecture v1.0 (DOC-006) — Retrieval Drift, LAD-010, LAD-011
- `docs/retrieval-objectives.md`

## Tier Alignment

- [ ] Critical Context tier matches context critical domains
- [ ] Supporting Context tier matches context supporting domains
- [ ] Available Context tier matches context available domains or omission documented
- [ ] No evidence from excluded context domains without documented rationale

## Evidence Quality

- [ ] Every evidence item links to source path in `knowledge/` or `memory/`
- [ ] No duplicated source or memory content in package
- [ ] Primary sources preferred over reference when traceability matters
- [ ] Confidence levels noted from source artifact frontmatter
- [ ] Draft and retired artifacts excluded unless explicitly scoped

## Smallest Effective Set

- [ ] No unnecessary redundant artifacts
- [ ] Exclusions documented with rationale
- [ ] Gaps documented with search scope and impact
- [ ] Package optimized for effectiveness — not completeness

## Contradictory Evidence (AF-008)

- [ ] Contradictory evidence workflow completed
- [ ] Conflicts documented with both sides and source paths, or
- [ ] Absence documented with search scope
- [ ] Contradictory evidence section present in package
- [ ] Conflicts not resolved in retrieval — left for inference

## Ranking Compliance

- [ ] Ranking applied within context tiers
- [ ] Recency not used as sole ranking signal
- [ ] Ranking rationale documented in evidence package

## Boundary Compliance

- [ ] No inference, hypotheses, or recommendations in package
- [ ] No context weight overrides without context review reference
- [ ] No decision support content

## Traceability

- [ ] Retrieval request links to context reference
- [ ] Evidence package links to retrieval request
- [ ] Context Package links to evidence package
- [ ] Contradictory evidence records linked
- [ ] All artifacts registered in `retrieval/INDEX.md`

## Failure Response

If any item fails:

1. Do not deliver Context Package
2. Re-run `evidence-assembly.md` for retrieval issues
3. Trigger `context/workflows/context-review.md` for context issues
4. Document in retrieval review artifact
5. Re-run checklist after correction

## Sign-Off

| Field | Value |
|-------|-------|
| Context Package ID | |
| Checklist date | |
| Passed | yes / no |
| Reviewer | |
