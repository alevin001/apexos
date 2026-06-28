# Reinforcement Rules

Rules for pattern reinforcement, weakening, and confidence recalibration based on observed outcomes.

## Architecture Reference

- Outcome & Results Architecture v1.0 — Pattern Reinforcement, Pattern Weakening, Confidence Recalibration, Reinforcement Update
- Memory Architecture v1.0 — Pattern Memory, Memory Promotion Model
- LAD-017, AF-016 — Dynamic confidence; pattern reinforcement based on outcomes

## Core Principle

Confidence should remain dynamic. Patterns must be reinforced or weakened based on observed outcomes — pattern existence does not guarantee future effectiveness (AF-016).

## Confidence Recalibration Rules

### Increase Confidence When

| Condition | Application | Limit |
|-----------|-------------|-------|
| Recommendations repeatedly succeed | Recommendation confidence | Requires repeated validation — not single instance |
| Assumptions repeatedly validate | Assumption confidence | Document validation history |
| Patterns repeatedly validate | Pattern reinforcement | Via pattern evaluation workflow |
| Outcomes consistently support prior conclusions | Target-specific recalibration | Proportional to evidence strength |

### Decrease Confidence When

| Condition | Application | Limit |
|-----------|-------------|-------|
| Recommendations repeatedly fail | Recommendation confidence | Document failure pattern |
| Assumptions repeatedly fail | Assumption confidence | Failed assumptions must remain visible |
| Patterns repeatedly fail | Pattern weakening | Via reinforcement workflow |
| Outcomes repeatedly contradict prior conclusions | Target-specific recalibration | Proportional to evidence strength |

### Maintain Confidence When

| Condition | Application |
|-----------|-------------|
| Single instance — insufficient for trend | Limited or no recalibration |
| Inconclusive outcome evidence | No change or slight decrease |
| External factors dominate attribution | Recalibration deferred |
| Contradictory evidence unresolved | Recalibration deferred pending review |

## Pattern Reinforcement Rules

### Reinforce Pattern When

- Outcome evidence supports pattern
- Multiple supporting instances (not single incident)
- Contradictory evidence reviewed and outweighed
- Pattern evaluation assigns `reinforced`

### Weaken Pattern When

- Outcome evidence contradicts pattern
- Repeated contradictory instances
- Pattern evaluation assigns `weakened`
- Contradictory evidence principle applied

### Maintain Pattern When

- Inconclusive outcome evidence
- Single neutral instance
- Pattern evaluation assigns `unchanged`
- Insufficient evidence for change

## Single Instance Rule

A single outcome instance must not cause maximum confidence swing:

| Target | Single instance maximum action |
|--------|-------------------------------|
| Recommendation confidence | Limited adjustment; note as single instance |
| Assumption confidence | Validate or fail single assumption; limited trend inference |
| Pattern reinforcement | Does not automatically reinforce; defer unless criteria met |

Repeated validation builds trend. Single instances inform but do not establish trend.

## Reinforcement Update Requirements

Every reinforcement update must document:

| Field | Required |
|-------|----------|
| Pattern reference | Yes |
| Pattern validation link | Yes |
| Outcome evidence | Yes |
| Prior reinforcement status | Yes |
| Updated reinforcement status | Yes |
| Update rationale | Yes |
| Historical integrity preserved | Yes — append only |

## Memory Integration Rules

| Action | Workflow | Direct edit prohibited |
|--------|----------|------------------------|
| Update pattern reinforcement status | `memory/workflows/review-memory.md` | Yes |
| Promote new pattern | `memory/workflows/promote-to-pattern.md` | Yes |
| Link outcome to pattern | `memory/workflows/link-outcome-reference.md` | Yes |

Reinforcement updates in `outcomes/reinforcement/` inform memory review — they do not directly modify pattern artifacts.

## Prohibited Reinforcement Actions

| Action | Why prohibited |
|--------|----------------|
| Reinforce pattern from single instance without review | Violates pattern validation standards |
| Weaken pattern without contradictory evidence | Violates evidence-first principle |
| Rewrite prior confidence in source artifacts | Violates historical integrity |
| Use reinforcement to generate recommendations | Violates LAD-015 |
| Ignore contradictory outcome evidence | Violates Governance Architecture |

## Review Triggers

Re-review reinforcement when:

- New outcome evidence contradicts prior reinforcement
- Pattern used in recommendation that subsequently fails
- Multiple inconclusive validations accumulate
- Executive follow-up reveals new evidence
