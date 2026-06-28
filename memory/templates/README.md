# Memory Templates

Portable markdown templates for memory layer artifacts. Copy a template, fill in frontmatter, and register the artifact in `INDEX.md`.

Templates use YAML frontmatter for portability (Build 07 may map these fields to database columns without changing logical structure).

## Templates

| Template | Use for | Location |
|----------|---------|----------|
| `observation.md` | Initial interpretation — promotion stage | `observations/` |
| `executive-memory.md` | Executive Memory | `executive/` |
| `person-memory.md` | Person Memory | `person/` |
| `relationship-memory.md` | Relationship Memory | `relationship/` |
| `situation-memory.md` | Situation Memory | `situation/` |
| `decision-memory.md` | Decision Memory | `decision/` |
| `pattern-memory.md` | Pattern Memory | `pattern/` |
| `outcome-results-memory.md` | Outcome/Results Memory | `outcome-results/` |
| `outcome-reference.md` | Cross-layer link to outcomes evidence | Same folder as related memory |
| `promotion-record.md` | Audit record for promotion decisions | `promotion/` |

## Usage

1. Copy the appropriate template into the target folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Complete all required frontmatter fields.
4. Link to originating knowledge — never create memory without traceability.
5. Register in `memory/INDEX.md`.
6. For promotions, create a promotion record in `promotion/`.

## Governance

- Do not summarize source documents into memory templates.
- Observations are low confidence — do not treat them as memory.
- Patterns require repeated validated evidence — see `workflows/promote-to-pattern.md`.
- See `governance/source-fidelity/memory-layer.md`.

## Distinction: Observation vs Memory vs Pattern

| Stage | Template | Confidence |
|-------|----------|------------|
| Observation | `observation.md` | Low |
| Memory | Category templates | Retained |
| Pattern | `pattern-memory.md` | Validated |

Patterns are not memories until promoted through the pattern workflow.
