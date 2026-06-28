# Workflow: Evidence Assembly

Locate, rank, and assemble evidence from knowledge and memory layers.

## Architecture Reference

- Retrieval Architecture v1.0 — Evidence Assembly Principle
- LAD-008 — Evidence First Principle
- `docs/evidence-assembly.md`, `docs/retrieval-ranking.md`

## Prerequisites

- Retrieval request exists with `context_reference` and `tier_requirements`
- Evidence-first checklist passed

## Steps

### 1. Review retrieval scope

From retrieval request, confirm:

- Tier requirements (critical, supporting, available)
- Retrieval targets (knowledge, memory, pattern)
- Exclusions and scope boundaries

### 2. Search knowledge layer

Use `knowledge/INDEX.md` and target READMEs:

| Target | Location | Filters |
|--------|----------|---------|
| Doctrine references | `knowledge/doctrine/` | Strategic context relevance |
| Frameworks | `knowledge/frameworks/` | Situation type, tags |
| Concepts | `knowledge/frameworks/concept-*.md` | Related frameworks |
| Reference | `knowledge/reference/` | Supporting guidance |
| Source material | `knowledge/source_material/` | Primary evidence, traceability |

See `retrieval/knowledge/README.md`.

### 3. Search memory layer

Use `memory/INDEX.md` and category folders:

| Target | Location | Filters |
|--------|----------|---------|
| Executive memory | `memory/executive/` | Active review status |
| Person memory | `memory/person/` | Related individuals |
| Relationship memory | `memory/relationship/` | Active relationships |
| Situation memory | `memory/situation/` | Situation type match |
| Decision memory | `memory/decision/` | Related decisions |
| Pattern memory | `memory/pattern/` | Validated, not weakening |
| Outcome/results memory | `memory/outcome-results/` | Related outcomes |

Exclude `draft`, `retired`, and observation staging artifacts unless explicitly scoped.

See `retrieval/memory/README.md`.

### 4. Rank candidates within tiers

Apply ranking signals from `docs/retrieval-ranking.md`:

1. Group candidates by context tier
2. Score on situation relevance, outcome impact, pattern strength, strategic significance, relationship significance, recency
3. Order within tier
4. Select smallest effective set

### 5. Document exclusions

Record artifacts considered but not included — with rationale.

### 6. Document gaps

Record expected evidence not found — with search scope and impact.

### 7. Create evidence package

Copy `templates/evidence-package.md` to `evidence/`.

Rename: `ret-evd-{short-slug}.md`

Complete all tier sections, exclusions, and gaps.

Link in retrieval request: `evidence_package`.

Register in `retrieval/INDEX.md`.

## Governance Checklist

- [ ] All evidence items link to source paths
- [ ] No duplicated source or memory content
- [ ] Tiers match context specification
- [ ] Ranking applied — not recency alone
- [ ] Exclusions documented
- [ ] Gaps documented
- [ ] `INDEX.md` updated

## Do Not

- Include inference or recommendations
- Override context tiers
- Skip exclusion documentation
- Treat reference summaries as primary sources without traceability note

## Next Step

`contradictory-evidence-workflow.md`
