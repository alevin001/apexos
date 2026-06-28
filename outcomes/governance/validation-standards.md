# Validation Standards

Standards for outcome validation quality across the Outcome & Results Layer.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Outcome Validation, Outcome Attribution, Validation Outputs
- LAD-004 — Outcome validation as primary system validation
- LAD-015 — Validation separate from recommendation
- LAD-016 — Action-to-outcome correlation

## Validation Quality Criteria

### Outcome Capture Standards

| Standard | Requirement |
|----------|-------------|
| Completeness | Recommendation, decision, action, and outcome all documented |
| Separation | Action and outcome distinct from recommendation and expected consequences |
| Correlation | Full Recommendation → Decision → Action → Outcome chain |
| Timeliness | Capture occurs when outcomes become observable |
| Method documented | Capture method recorded |

### Outcome Validation Standards

| Standard | Requirement |
|----------|-------------|
| Evidence-based | Validation conclusions supported by outcome capture evidence |
| Attribution assessed | Action influence on outcome evaluated with confidence level |
| Recommendation referenced | Recommendation Package linked — not re-evaluated as decision support |
| No new recommendations | Validation observations only |
| Result assigned | Validation result explicitly stated with rationale |

### Recommendation Validation Standards

| Standard | Requirement |
|----------|-------------|
| Tracking considerations used | Success/failure indicators from Recommendation Package applied |
| Primary and alternatives addressed | Where applicable |
| Confidence impact documented | For recalibration workflow |
| Alternative comparison | Validation observation only — not decision support |

### Decision Validation Standards

| Standard | Requirement |
|----------|-------------|
| Decision referenced externally | Not stored as recommendation |
| Effectiveness assessed | Against observed outcomes |
| Not overridden | Executive agency preserved |
| Modification impact | Documented when decision modified recommendation |

### Assumption Validation Standards

| Standard | Requirement |
|----------|-------------|
| Assumptions sourced | From recommendation/inference — not newly generated |
| Each assumption evaluated | validated / failed / partial / inconclusive |
| Failed assumptions visible | Not hidden or minimized |
| Confidence impact documented | For recalibration |

### Pattern Validation Standards

| Standard | Requirement |
|----------|-------------|
| Patterns referenced from memory | Not re-identified in inference |
| Contradictory evidence reviewed | Per Governance Architecture |
| Single instance limited | Does not automatically reinforce |
| Reinforcement recommendation | Feeds reinforcement workflow |

## Validation Result Definitions

| Result | Definition | Use when |
|--------|------------|----------|
| Validated | Outcome evidence supports prior conclusion | Clear supporting evidence |
| Partially validated | Mixed or incomplete supporting evidence | Some indicators met, others not |
| Invalidated | Outcome evidence contradicts prior conclusion | Clear contradicting evidence |
| Inconclusive | Insufficient outcome evidence | Outcome window not elapsed or ambiguous |
| Not applicable | Validation target not relevant to this outcome | Recommendation rejected, no pattern, etc. |

## Attribution Standards

| Attribution level | Criteria |
|-------------------|----------|
| Strong | Action clearly influenced outcome; limited confounding factors |
| Moderate | Action likely contributed; other factors present |
| Weak | Action may have contributed; significant confounding factors |
| Unknown | Insufficient evidence to attribute |
| Not attributable | Outcome clearly independent of action |

## Validation Package Completeness

A Validation Package meets standards when:

- [ ] Outcome capture linked and complete
- [ ] Outcome assessment and attribution present
- [ ] Recommendation validation complete (when applicable)
- [ ] Decision validation complete (when applicable)
- [ ] Assumption validation complete (when assumptions material)
- [ ] Pattern validation complete (when patterns relevant)
- [ ] Confidence recalibration documented (when confidence impact exists)
- [ ] Reinforcement update documented (when pattern impact exists)
- [ ] Learning update present (when validated learning identified)
- [ ] Category separation maintained
- [ ] Traceability chain complete
- [ ] Outcome review checklist passed

## Inconclusive Validation

Inconclusive validation is valid when:

- Outcome window has not elapsed
- Outcome evidence is ambiguous
- Attribution cannot be determined
- Follow-up scheduled with documented rationale

Do not force validation results to avoid inconclusive status.

## Separation Standards

| Must remain separate | Violation |
|---------------------|-----------|
| Validation vs recommendation | New recommendation language in validation |
| Observed vs expected outcome | Expected consequences stated as observed |
| Action vs recommendation | Recommendation described as action taken |
| Learning vs speculation | Unvalidated belief promoted as learning |
| Validation vs inference | Re-interpretation of evidence in validation |
