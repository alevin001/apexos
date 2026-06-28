---
# Reinforcement Update
# Naming: out-rnf-{short-slug}.md
# Layer: Outcome & Results — pattern reinforcement or weakening

id:                          # e.g. OUT-RNF-001
title:                       # required
update_date:                 # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
related_validation_package:  # required
pattern_validation:          # required — path to pattern validation artifact
pattern_reference:           # required — path to memory/pattern/ artifact
update_type:                 # reinforce | weaken | stable
prior_reinforcement_status:  # stable | reinforced | weakened
updated_reinforcement_status:  # stable | reinforced | weakened
transformation_log: []
---

# {title}

## Pattern Reference

| Field | Value |
|-------|-------|
| Pattern artifact | |
| Pattern validation | |
| Prior reinforcement status | |
| Prior confidence | |

## Outcome Evidence

<!-- What observed outcomes drive this update? -->

| Outcome evidence | Source | Alignment with pattern |
|------------------|--------|------------------------|
| | outcome capture / prior outcomes | supports / contradicts |

## Update Rationale

**Update type:**

**Rationale:**

**Evidence summary:**

## Reinforcement Change

| Field | Prior | Updated |
|-------|-------|---------|
| Reinforcement status | | |
| Confidence | | |
| Weight for future retrieval/inference | | |

## Memory Promotion Note

<!-- Reinforcement update informs memory review — does not directly rewrite pattern artifact. -->

Pattern memory update occurs via `memory/workflows/review-memory.md` after reinforcement validation.

## Historical Integrity

- Prior pattern artifact preserved
- Reinforcement update appended as new record
- No silent modification of pattern history

## Category Checklist

- [ ] Update based on pattern validation and outcome evidence
- [ ] Pattern history not rewritten
- [ ] Reinforcement distinct from pattern creation
- [ ] AF-016 applied — pattern existence does not guarantee future effectiveness
