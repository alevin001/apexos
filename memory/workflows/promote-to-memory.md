# Workflow: Promote to Memory

Promote an observation (or approved source insight) to distilled memory in a category folder.

## Architecture Reference

- Memory Architecture v1.0 — Memory Promotion Model (Observation → Memory)
- Memory Architecture v1.0 — Source vs Memory Principle
- Governance Architecture v1.0 — No Silent Transformation Principle (LAD-011)
- LAD-005 — Memory exists to improve future outcomes

## Prerequisites

- Observation artifact in `observations/` with `review_status: under_review` or `draft`, or
- Explicit governance approval to promote directly from source (document in promotion record)
- Judgment that the intelligence is valuable enough to retain for future interactions

## Steps

### 1. Review the observation

| Question | Required answer |
|----------|-----------------|
| Is this distilled intelligence, not a source summary? | yes |
| Does retaining this improve future outcomes? | yes |
| Is originating knowledge linked? | yes |
| What evidence would contradict this? | documented |

If any answer fails, reject or defer — record in promotion record.

### 2. Select memory category

| Category | Folder | Template |
|----------|--------|----------|
| Executive | `executive/` | `executive-memory.md` |
| Person | `person/` | `person-memory.md` |
| Relationship | `relationship/` | `relationship-memory.md` |
| Situation | `situation/` | `situation-memory.md` |
| Decision | `decision/` | `decision-memory.md` |
| Outcome/Results | `outcome-results/` | `outcome-results-memory.md` |

Do not promote to `pattern/` using this workflow — use `promote-to-pattern.md`.

### 3. Create memory artifact

Copy the appropriate template to the category folder.

Rename per `REPOSITORY-GUIDE.md` naming conventions.

Set `promoted_from` to the observation artifact path.

Preserve `originating_knowledge` from the observation.

Assign confidence: `medium` or `high` based on evidence — not `validated` (reserved for patterns).

### 4. Create promotion record

Copy `templates/promotion-record.md` to `promotion/`.

Rename: `prom-{YYYYMMDD}-{slug}.md`

Set `promotion_type: observation-to-memory`.

Record rationale and approval.

### 5. Update observation status

Set observation `review_status: promoted`.

Add link to new memory artifact in observation `related_memory`.

### 6. Update source metadata (if applicable)

Update originating `.meta.md`:

- Set `memory_promotion: memory`
- Add memory artifact to `related_memory`

### 7. Register artifacts

Add entries to `memory/INDEX.md`:

- Memory artifact under appropriate category
- Promotion record under Promotion Records

Assign IDs (e.g., `MEM-PER-001`, `PROM-001`).

## Governance Checklist

- [ ] Promotion record created and registered
- [ ] Traceability chain complete: source → observation → memory
- [ ] Not a source summary
- [ ] Pattern folder not used (single observation ≠ pattern)
- [ ] All entries in `INDEX.md`

## Do Not

- Promote without promotion record
- Skip observation stage without documented governance approval
- Store raw source content in memory artifact

## Next Steps

- Link outcomes when available: `link-outcome-reference.md`
- When repeated evidence exists: `promote-to-pattern.md`
- Periodic review: `review-memory.md`
