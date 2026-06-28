# Knowledge Layer — Source Fidelity Controls

Knowledge-specific implementation of Governance Architecture fidelity principles.

## Architecture Reference

- **Governance Architecture v1.0 (DOC-006):** Fidelity Preservation Principle, No Silent Transformation Principle
- **Index:** LAD-010, LAD-011, AF-010
- **Charter Section 13:** Source quality standards, knowledge evolution principles

## Scope

Applies to all content in `knowledge/`:

- Doctrine indices
- Framework and concept artifacts
- Reference materials
- Source material metadata
- Derived content created during migration or ingestion

Architecture documents in `architecture/` are governed separately but by the same principles. See `governance/source-fidelity/README.md`.

## Fidelity Preservation (LAD-010)

When working with authoritative content, preserve:

- Meaning
- Structure
- Emphasis
- Hierarchy
- Examples
- Evaluative questions
- Rationale

Unless modification is explicitly requested and logged.

## No Silent Transformation (LAD-011)

The following transformations require explicit visibility and approval:

| Transformation | Visibility requirement |
|----------------|---------------------|
| Summarization | Log in `transformation_log`; mark `derivation_type` |
| Consolidation | Document what was merged and from where |
| Omission | Document what was omitted and why |
| Paraphrasing | Log original reference; mark as derived |
| Restructuring | Document structural changes |
| Reinterpretation | Mark as interpretation, not source fact |

All material transformations must be: **visible**, **intentional**, **reviewable**.

## Knowledge-Specific Rules

### Source files (`source_material/`)

- Store unmodified. Do not edit raw source content in place.
- If extraction is required, create a derived artifact in `reference/` with full traceability.
- Metadata summaries describe purpose — they do not replace the source.

### Frameworks and concepts (`frameworks/`)

- Cite traceable sources.
- Application guidance may be original operational content.
- Paraphrased framework content from books or courses must be logged.

### Reference materials (`reference/`)

- Always declare `derived_from` and `derivation_type`.
- Reference summaries are not equivalent to sources in retrieval weighting.
- Never present derived content as primary evidence.

### Doctrine indices (`doctrine/`)

- Index and link only. Never duplicate or paraphrase Charter doctrine.
- If doctrine interpretation is needed, reference the Charter section — do not restate it.

## Drift Defense (AF-010)

Drift often begins through seemingly harmless simplification. Small changes in wording, structure, emphasis, rationale, and examples accumulate into material divergence.

**Defense:** Treat every knowledge artifact as subject to review. Use `transformation_log` consistently.

## Review Triggers

Review knowledge artifacts when:

- Content is migrated from legacy locations
- AI-assisted tools generate summaries or extractions
- Framework effectiveness notes are updated based on outcomes
- A source is retired or superseded
- Retrieval produces unexpected interpretations traceable to knowledge content

## Relationship to Amendment Controls

Changes to doctrine or architecture follow `governance/amendment-controls/`. Changes to knowledge inventory follow the workflows in `knowledge/workflows/` with fidelity logging — they do not amend doctrine.

## Implementation

| Action | Control |
|--------|---------|
| Add source | `knowledge/workflows/add-knowledge-source.md` |
| Add framework | `knowledge/workflows/add-framework.md` |
| Add reference | `knowledge/workflows/add-reference.md` |
| Migrate legacy | `knowledge/workflows/migrate-legacy-materials.md` |
| Register artifact | Update `knowledge/INDEX.md` |
