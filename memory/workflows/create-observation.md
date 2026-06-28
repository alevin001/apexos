# Workflow: Create Observation

Record initial interpretation of source information in the Observation stage of the Memory Promotion Model.

## Architecture Reference

- Memory Architecture v1.0 — Memory Promotion Model (Observation stage)
- Memory Architecture v1.0 — Source vs Memory Principle
- Governance Architecture v1.0 — No Silent Transformation Principle (LAD-011)

## Prerequisites

- Source material exists in `knowledge/source_material/` with companion `.meta.md`, or
- Framework/reference artifact exists with traceable source, and
- An interpretation worth recording — not a source summary

## Steps

### 1. Identify originating knowledge

Locate the source in `knowledge/`:

| Source type | Location |
|-------------|----------|
| Primary source | `source_material/{type}/` + `.meta.md` |
| Framework insight | `frameworks/` |
| Reference insight | `reference/` |

Record the path(s) in `originating_knowledge`.

### 2. Verify this is observation, not memory

| Question | Observation | Memory |
|----------|-------------|--------|
| Confidence | Low | Retained |
| Validation | Not yet validated | Judged valuable for future use |
| Content | Initial interpretation | Distilled intelligence |

If already validated and ready for retention, use `add-memory.md` with governance approval instead.

### 3. Create observation artifact

Copy `templates/observation.md` to `observations/`.

Rename: `obs-{short-slug}.md`

Complete required frontmatter: `title`, `summary`, `originating_knowledge`, `observation_date`.

### 4. Write the observation

State what was interpreted — not what was decided. Do not duplicate source content.

Log extraction method in `transformation_log` if AI-assisted.

### 5. Update source metadata (optional)

If originating from source material, update the `.meta.md` companion:

- Set `memory_promotion: observation`
- Add link to observation in `related_memory`

### 6. Register the artifact

Add entry to `memory/INDEX.md` under Observations.

Assign an ID (e.g., `OBS-001`).

## Governance Checklist

- [ ] Linked to originating knowledge — no orphan observations
- [ ] Not a source summary — initial interpretation only
- [ ] Confidence set to `low`
- [ ] Entry added to `INDEX.md`
- [ ] Source metadata updated if applicable

## Do Not

- Store observations in `knowledge/`
- Promote to memory without `promote-to-memory.md`
- Treat observations as patterns

## Next Step

When ready for promotion: `workflows/promote-to-memory.md`
