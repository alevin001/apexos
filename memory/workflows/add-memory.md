# Workflow: Add Memory

Add distilled memory directly to a category folder when the observation stage is appropriately skipped.

## Architecture Reference

- Memory Architecture v1.0 — Memory categories, Source vs Memory Principle
- LAD-005 — Memory exists to improve future outcomes

## When to Use

Use this workflow when:

- Intelligence is already validated through direct executive judgment, or
- Observation stage was completed informally and is documented in the promotion record, or
- Governance approves direct memory creation with full traceability

**Default path:** Use `create-observation.md` → `promote-to-memory.md` instead.

## Prerequisites

- Clear originating knowledge link (source, interaction, or outcome)
- Distilled intelligence ready for retention — not a source summary
- Category selected

## Steps

### 1. Select category and template

| Category | Folder | Template |
|----------|--------|----------|
| Executive | `executive/` | `executive-memory.md` |
| Person | `person/` | `person-memory.md` |
| Relationship | `relationship/` | `relationship-memory.md` |
| Situation | `situation/` | `situation-memory.md` |
| Decision | `decision/` | `decision-memory.md` |
| Outcome/Results | `outcome-results/` | `outcome-results-memory.md` |

Do not use this workflow for `pattern/` — use `promote-to-pattern.md`.

### 2. Create memory artifact

Copy template to category folder. Rename per `REPOSITORY-GUIDE.md`.

Complete required frontmatter including `originating_knowledge`.

Set appropriate `confidence` level.

If observation was skipped, document reason in artifact notes.

### 3. Create promotion record

Even for direct creation, record the decision:

Copy `templates/promotion-record.md` to `promotion/`.

Set `promotion_type: memory-update` or document direct creation rationale.

Set `from_stage: source` and `to_stage: memory`.

### 4. Update source metadata (if applicable)

Update originating `.meta.md` with `memory_promotion: memory` and `related_memory` link.

### 5. Register artifacts

Add to `memory/INDEX.md` under appropriate category and Promotion Records.

## Governance Checklist

- [ ] Originating knowledge linked
- [ ] Promotion record documents why observation was skipped (if applicable)
- [ ] Not a source summary
- [ ] Entries in `INDEX.md`

## Do Not

- Add memory without traceability
- Add patterns via this workflow
- Duplicate source documents
