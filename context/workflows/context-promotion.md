# Workflow: Context Promotion

Hand off insights from context evaluation to the memory observation pipeline when insights are worth retaining long-term.

## Architecture Reference

- Context Architecture v1.0 — Context does not store information (LAD-006)
- Memory Architecture v1.0 — Memory Promotion Model, Source vs Memory Principle
- Governance Architecture v1.0 — No Silent Transformation Principle (LAD-011)

## Purpose

Context evaluation may surface insights worth retaining — but context artifacts are not memory. This workflow creates a visible bridge to the memory promotion pipeline.

**Context promotion is not automatic.** Retained intelligence requires explicit observation and promotion workflows.

## Prerequisites

- Context review or evaluation identified insight worth retaining
- Insight is distilled executive-relevant intelligence — not a situation log or source summary
- Traceability to originating knowledge or context evaluation exists

## Steps

### 1. Verify this is memory-worthy

| Question | Memory-worthy | Not memory-worthy |
|----------|---------------|-------------------|
| Improves future outcomes if retained? | Yes | No |
| Distilled intelligence vs situation log? | Intelligence | Log |
| Validated or validation path exists? | Yes or planned | No |
| Belongs in a memory category? | Yes | Unclear |

If not memory-worthy, archive the context evaluation — do not promote.

### 2. Identify target memory category

| Insight type | Target category |
|--------------|-----------------|
| Executive tendencies observed | `memory/executive/` |
| Person-specific insight | `memory/person/` |
| Relationship dynamic | `memory/relationship/` |
| Recurring situation type | `memory/situation/` |
| Decision-related insight | `memory/decision/` |
| Validated repeated learning | `memory/pattern/` (requires pattern workflow) |
| Outcome evidence | `memory/outcome-results/` |

Do not promote directly to pattern without `memory/workflows/promote-to-pattern.md`.

### 3. Create observation

Execute `memory/workflows/create-observation.md`:

- Set `originating_knowledge` to relevant knowledge sources
- Set `promoted_from` context path in observation notes
- Link to context evaluation in observation `transformation_log`

### 4. Document the promotion bridge

In the context evaluation artifact:

- Add note in transformation log: observation created at `{path}`
- Do not copy observation content into context artifact

### 5. Proceed through memory promotion

When ready: `memory/workflows/promote-to-memory.md`

Pattern promotion requires: `memory/workflows/promote-to-pattern.md`

## Governance Checklist

- [ ] Insight is distilled intelligence — not situation log or source summary
- [ ] Target memory category identified
- [ ] Observation created via memory workflow — not stored in context
- [ ] Traceability chain preserved: context → observation → memory
- [ ] No silent promotion — observation stage visible

## Do Not

- Store retained intelligence in context artifacts
- Skip observation stage and write directly to memory
- Promote single observations to pattern
- Treat context evaluation as a substitute for memory

## Next Step

`memory/workflows/promote-to-memory.md` when observation is validated
