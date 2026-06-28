---
# Confidence Recalibration
# Naming: out-con-recal-{short-slug}.md
# Layer: Outcome & Results — dynamic confidence adjustment based on outcomes

id:                          # e.g. OUT-CON-001
title:                       # required
recalibration_date:          # YYYY-MM-DD
status: draft                # draft | in_progress | complete | under_review | validated | archived
recommendation_package:      # required
outcome_capture:             # required
related_validation_package:  # link to parent Validation Package
recalibration_targets: []    # recommendation | assumption | pattern | interpretation_reference
transformation_log: []
---

# {title}

## Recalibration Basis

<!-- What outcome evidence drives this recalibration? -->

| Source artifact | Validation result | Link |
|-----------------|-------------------|------|
| Recommendation validation | | |
| Assumption validation | | |
| Pattern validation | | |

## Confidence Changes

| Target | Target reference | Prior confidence | Updated confidence | Direction | Rationale |
|--------|------------------|------------------|-------------------|-----------|-----------|
| Recommendation | | low / medium / high | | increase / decrease / unchanged | |
| Assumption | | | | | |
| Pattern | `memory/pattern/` | | | | |
| Interpretation (reference only) | `inference/interpretation/` | | | | |

## Recalibration Rules Applied

| Rule | Application |
|------|-------------|
| Recommendations repeatedly succeed → confidence may increase | |
| Recommendations repeatedly fail → confidence may decrease | |
| Assumptions repeatedly validate → confidence may increase | |
| Assumptions repeatedly fail → confidence may decrease | |
| Patterns repeatedly validate → reinforcement | |
| Patterns repeatedly fail → weakening | |
| Single instance → limited recalibration | |

## Historical Integrity

<!-- Append recalibration record — do not rewrite prior confidence assessments in source artifacts. -->

| Prior artifact | Action |
|----------------|--------|
| Recommendation Package | referenced — not modified |
| Interpretation Package | referenced — not modified |
| Pattern memory | reinforcement update via separate workflow |

## Category Checklist

- [ ] Recalibration based on observed outcomes
- [ ] Prior artifacts referenced — not rewritten
- [ ] Single instance does not cause maximum confidence swing
- [ ] Interpretation confidence referenced only — inference not re-performed
