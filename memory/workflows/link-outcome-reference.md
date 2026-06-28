# Workflow: Link Outcome Reference

Create cross-layer links between memory artifacts and outcome evidence.

## Architecture Reference

- Memory Architecture v1.0 — Outcome/Results Memory
- LAD-004 — Outcome/Results is the validation layer
- LAD-016, AF-017 — Action-to-outcome correlation is high-value evidence
- Outcome & Results Architecture v1.0 — Outcome capture and validation

## Prerequisites

- Memory artifact exists (typically decision, relationship, person, or pattern memory)
- Outcome evidence exists or is being captured — in `memory/outcome-results/` or pending in `outcomes/` (Build 06)

## Steps

### 1. Identify memory artifact

Locate the memory artifact that the outcome validates, contradicts, or informs.

Common targets:

| Memory category | Typical outcome link |
|-----------------|---------------------|
| Decision | Direct action-to-outcome correlation |
| Pattern | Pattern reinforcement or weakening |
| Relationship | Trust, alignment, communication effectiveness |
| Person | Behavioral tendency validation |

### 2. Identify outcome evidence

| Source | Location |
|--------|----------|
| Outcome/results memory | `memory/outcome-results/` |
| Outcomes layer (Build 06) | `outcomes/` |
| New outcome to capture | Create via `outcome-results-memory.md` template first |

Distinguish factual observations from interpretations.

### 3. Create outcome reference artifact

Copy `templates/outcome-reference.md` to the same folder as the related memory artifact.

Rename: `{memory-basename}.outcome-ref.md`

Complete:

- `related_memory` and `related_memory_id`
- `related_outcome_memory` or `related_outcome_layer`
- `validation_impact`: supports | contradicts | neutral | inconclusive
- `confidence_impact` if applicable

### 4. Update memory artifact

Add outcome reference to memory artifact frontmatter:

- `related_outcomes`
- `outcome_references` (for decision memory)

Update `confidence` or `reinforcement_status` if outcome warrants change.

### 5. Update outcome/results memory (if applicable)

Link back to the memory artifact from outcome/results memory `related_patterns` or notes.

### 6. Register artifacts

Add to `memory/INDEX.md` under Outcome References.

Assign ID (e.g., `OUTREF-001`).

## Governance Checklist

- [ ] Factual observations distinguished from interpretations
- [ ] Validation impact documented
- [ ] Memory artifact updated with cross-links
- [ ] Entry in `INDEX.md`

## Do Not

- Duplicate outcome capture architecture from `outcomes/` layer
- Silently update memory confidence without documentation
- Treat a single outcome as pattern validation without repeated evidence

## Related Workflows

- Pattern weakening/reinforcement: `review-memory.md`
- Full outcome validation (Build 06): `outcomes/` layer workflows
