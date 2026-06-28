# Historical Integrity

Preserve historical truth across ApexOS — never rewrite historical records.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Historical Integrity, Validation Principle
- Governance Architecture v1.0 — Fidelity Preservation Principle (LAD-010), No Silent Transformation Principle (LAD-011)
- AF-015 — Continuous improvement through measured learning — not defense of prior conclusions

## Purpose

Outcome validation strengthens the system by measuring what actually worked. Historical integrity ensures that validation improves future behavior without corrupting the record of what was known, recommended, interpreted, or decided at the time.

## Core Rule

**Never rewrite historical records.**

Append validation, learning, and reinforcement updates. Do not retroactively alter evidence, interpretation, recommendation, decision references, or memory artifacts.

## Protected Artifacts

| Layer | Protected artifacts | Outcome layer action |
|-------|--------------------|-----------------------|
| Knowledge | Source material, doctrine indices | Reference only — never modify |
| Memory | Observations, memory categories, patterns | Promote via memory workflows — never rewrite in place |
| Context | Relevance specifications, weighting | Trigger context review — never modify in place |
| Retrieval | Evidence packages, Context Packages | Reference chain — never modify |
| Inference | Interpretation Packages, component artifacts | Reference — never modify confidence in place |
| Recommendation | Recommendation Packages, component artifacts | Reference — never modify in place |
| Outcomes | Prior validation packages | Append supersession — never modify validated content in place |

## Permitted Actions

| Action | Method |
|--------|--------|
| Record new outcome evidence | New outcome capture artifact |
| Validate against prior conclusions | New validation component artifacts |
| Update confidence | New recalibration artifact — reference prior confidence |
| Reinforce or weaken patterns | New reinforcement update — memory review workflow |
| Promote validated learning | Learning update → memory promotion workflow |
| Correct factual error in draft | Only while `status: draft` — document in transformation_log |
| Supersede prior validation | New Validation Package with link to superseded artifact |

## Prohibited Actions

| Action | Why prohibited |
|--------|----------------|
| Edit Recommendation Package after delivery | Corrupts decision support record |
| Edit Interpretation Package after handoff | Corrupts interpretation record |
| Edit outcome capture after validation | Corrupts evidence chain — create new capture instead |
| Modify pattern memory without review workflow | Corrupts pattern history |
| Silent confidence change in source artifacts | Violates LAD-011 |
| Retroactive assumption removal | Hides historical reasoning |
| Rewrite executive decision reference | Corrupts decision record |

## Append-Only Validation Model

```
Historical artifact (immutable after status final)
  → Outcome capture (new)
    → Validation components (new)
      → Validation Package (new)
        → Recalibration / reinforcement (new)
          → Learning update (new)
            → Memory promotion (new artifact in memory/)
```

Each step creates new artifacts with backward links. Prior artifacts remain unchanged.

## Supersession

When validation must be updated with new evidence:

1. Create new validation artifacts — do not edit validated artifacts
2. Link `superseded_by` in prior artifact frontmatter (append-only metadata addition)
3. Set prior artifact `review_status: superseded`
4. Register both in `INDEX.md`

## Transformation Log

All outcome artifacts must maintain `transformation_log` when derived or corrected:

```yaml
transformation_log:
  - date: YYYY-MM-DD
    action: created | updated_draft | superseded | linked
    rationale: ...
    actor: ...
```

Draft corrections are permitted. Validated artifact corrections require supersession.

## Relationship to Learning

Validated learning improves future behavior. It does not rewrite what was previously believed, recommended, or decided.

The objective is continuous improvement through measured learning (AF-015) — not retroactive justification of prior conclusions.

## Review Checklist

- [ ] No historical artifact modified in place after final status
- [ ] All validation creates new artifacts with backward links
- [ ] Supersession documented when prior validation replaced
- [ ] transformation_log maintained for derived artifacts
- [ ] Memory promotion uses memory workflows — not direct edits
