# Inference Review Checklist

Pre-handoff validation checklist for Interpretation Packages and component artifacts.

## Architecture Reference

- Inference Architecture v1.0 (DOC-007) — Inference Outputs, Governance Controls, Inferential Transparency Principle
- Governance Architecture v1.0 (DOC-006) — LAD-008, LAD-009, LAD-011, LAD-013
- AF-011, AF-012, AF-013 — Inference principles

## Evidence Foundation

- [ ] Context Package linked and retrieval validation passed
- [ ] Inference operates upon assembled evidence — not pre-evidence speculation
- [ ] All evidence referenced by source path — not duplicated
- [ ] Strongest and weakest evidence identified in evidence assessment
- [ ] Contradictory evidence evaluated — not ignored or prematurely resolved
- [ ] Missing and unreliable evidence documented

## Perspective Evaluation (CP-008)

- [ ] Multiple perspectives evaluated
- [ ] No perspective granted automatic authority
- [ ] Evidence support and contradiction documented per perspective
- [ ] Objective is evidence support — not determining who is right

## Assumption Transparency (AF-012)

- [ ] Material assumptions explicitly identified
- [ ] Assumptions distinguished from evidence and findings
- [ ] Supporting and contradicting evidence documented for assumptions
- [ ] Hidden assumption scan completed
- [ ] No assumptions silently treated as facts

## Blind Spot Review

- [ ] Executive blind spots evaluated
- [ ] Stakeholder blind spots evaluated
- [ ] Organizational blind spots evaluated
- [ ] System-generated conclusion risks assessed
- [ ] Underrepresented perspectives identified

## Hypothesis Evaluation

- [ ] Hypotheses distinguished from findings and evidence
- [ ] Multiple alternative explanations considered
- [ ] Strengthening and invalidating evidence identified
- [ ] No hypothesis presented as conclusion

## Confidence Assessment (AF-013)

- [ ] Confidence explicitly evaluated — not assumed
- [ ] Per-finding confidence documented with rationale
- [ ] Overall confidence assessed
- [ ] Insufficient evidence declared if applicable
- [ ] Higher confidence not presented as certainty
- [ ] Uncertainty documented where warranted

## Competing Interpretations

- [ ] Multiple plausible interpretations evaluated
- [ ] Most supported interpretation identified with rationale
- [ ] Unresolved competition documented where applicable
- [ ] Competing interpretations not prematurely eliminated

## Category Separation

- [ ] Evidence distinguished from findings
- [ ] Findings distinguished from hypotheses
- [ ] Assumptions distinguished from findings
- [ ] Unknowns documented where evidence insufficient
- [ ] No recommendations or decision support content

## Interpretation Package Completeness

- [ ] Evidence assessment section populated
- [ ] Perspective assessment section populated
- [ ] Assumption assessment section populated
- [ ] Blind spot assessment section populated
- [ ] Hypotheses section populated
- [ ] Confidence assessments section populated
- [ ] Risks and opportunities evidence-based
- [ ] Competing interpretations section populated
- [ ] Unknowns section populated (or N/A documented)
- [ ] Interpretive findings documented
- [ ] Synthesized interpretation documented
- [ ] All component artifacts linked in frontmatter

## Boundary Compliance

- [ ] No recommendations in inference artifacts
- [ ] No evidence assembly in inference artifacts
- [ ] No relevance redefinition
- [ ] No decision support content
- [ ] Recommendation inputs only — not recommendations

## Traceability

- [ ] Context Package linked
- [ ] Retrieval request linked
- [ ] Context reference linked
- [ ] Component artifacts linked
- [ ] All artifacts registered in `inference/INDEX.md`

## Failure Response

If any item fails:

1. Do not hand off Interpretation Package to recommendation
2. Re-run failed workflow (evidence evaluation, assumption review, etc.)
3. Reclassify content if category violation detected
4. Document in inference review artifact
5. Re-run checklist after correction
6. If evidence contamination suspected — new retrieval request and re-inference

## Sign-Off

| Field | Value |
|-------|-------|
| Interpretation Package ID | |
| Checklist date | |
| Passed | yes / no |
| Reviewer | |
