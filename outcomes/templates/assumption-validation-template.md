---
# Assumption Validation
# Naming: out-asm-val-{short-slug}.md
# Layer: Outcome & Results — validate assumptions against observed outcomes

id:                          # e.g. OUT-ASM-001
title:                       # required
validation_date:             # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required
outcome_capture:             # required
interpretation_package:      # recommended — source of inference assumptions
related_validation_package:  # link to parent Validation Package
transformation_log: []
---

# {title}

## Assumption Register

<!-- Reference assumptions from Recommendation Package and Interpretation Package — do not generate new assumptions. -->

| Assumption | Source | Why it existed | Impact if wrong |
|------------|--------|----------------|-----------------|
| | inference / recommendation | | |

## Validation Results

| Assumption | Validation result | Evidence from outcome | Confidence impact |
|------------|-------------------|----------------------|-------------------|
| | validated / failed / partially / inconclusive | | increase / decrease / unchanged |

## Summary

**Assumptions validated:**

**Assumptions failed:**

**Assumptions inconclusive:**

**Overall confidence impact:**

## Downstream Actions

| Action | Target | Rationale |
|--------|--------|-----------|
| Confidence recalibration | | |
| Learning update | | |
| Pattern review | | |

## Category Checklist

- [ ] Assumptions referenced from recommendation/inference — not newly generated
- [ ] Validation based on observed outcomes
- [ ] Failed assumptions reduce confidence — not hidden
- [ ] No inference re-performed
