# Workflow: Assumption Review

Actively identify and document assumptions influencing interpretation.

## Architecture Reference

- Inference Architecture v1.0 — Assumption Evaluation, Assumption Transparency Principle
- AF-012 — Assumptions must remain visible and challengeable
- Governance Architecture — Reflection Principle

## Prerequisites

- Evidence assessment complete or in progress
- Context Package available
- Template: `templates/assumption-register-template.md`

## Steps

### 1. Create assumption register

Copy template to `reasoning/`.

Rename: `inf-asm-{short-slug}.md`

Populate frontmatter:

- `context_package` — link to Context Package
- `id` — assign registry ID (e.g., `INF-ASM-001`)

### 2. Scan for material assumptions

Identify assumptions that may influence interpretation:

- Situational framing assumptions
- Behavioral assumptions about individuals
- Organizational assumptions
- Strategic assumptions
- Relational assumptions

Assumptions often influence interpretation more than evidence itself.

### 3. Document each material assumption

For each assumption, record:

- The assumption — explicit statement
- Why the assumption exists — what evidence gap requires it
- Evidence supporting the assumption — with source paths
- Evidence contradicting the assumption — with source paths
- Information required for validation

**Category rule:** Assumptions are not evidence. Assumptions are not findings. Assumptions are not conclusions.

### 4. Scan for hidden assumptions

Review for assumptions embedded in:

- Executive perspective framing
- Stakeholder narratives
- Organizational context
- Prior ApexOS conclusions
- Situation definition from context intake

Use challenge questions from template.

### 5. Assess materiality

Rate each assumption: high / medium / low materiality.

Focus interpretation transparency on high-materiality assumptions.

### 6. Complete register

Set artifact `status: complete`.

Update `assumption_count` in frontmatter.

Register in `inference/INDEX.md`.

## Assumption Transparency Principle

ApexOS may generate assumptions when evidence is incomplete. However:

- Assumptions must be explicitly identified
- Assumptions must remain visible and challengeable
- The purpose is not to eliminate assumptions — it is to make them visible

## Governance Checklist

- [ ] All material assumptions explicitly stated
- [ ] Assumptions distinguished from evidence and findings
- [ ] Supporting and contradicting evidence documented
- [ ] Hidden assumption scan completed
- [ ] Validation requirements identified
- [ ] No assumptions silently treated as facts

## Do Not

- Hide assumptions within findings
- Treat assumptions as evidence
- Eliminate assumptions without documenting them
- Generate recommendations based on unvalidated assumptions without flagging

## Next Step

`blind-spot-workflow.md` or continue within `interpretation-workflow.md`.
