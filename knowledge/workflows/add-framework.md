# Workflow: Add Framework

Add a framework artifact to `knowledge/frameworks/`.

## Architecture Reference

- Charter Section 13 — Framework selection standards, Proven Framework Reinforcement
- Technical Architecture v0.1 — Framework structure

## Prerequisites

- Framework is traceable to a credible source (book, author, established methodology)
- Framework aligns with Charter Section 13 quality standards

## Steps

### 1. Verify source traceability

Identify the authoritative origin: book, article, course, or internal validated practice.

### 2. Create framework artifact

Copy `templates/framework.md` to `frameworks/`.

Rename using kebab-case: `{framework-name}.md`

### 3. Complete frontmatter

Required fields: `name`, `description`, `source`.

Add `related_concepts` when concept artifacts exist.

### 4. Write application guidance

Describe when and how the executive applies this framework in real situations. This is operational guidance — not a duplicate of the source book.

If content is paraphrased from the source, log it in `transformation_log`.

### 5. Create related concepts (optional)

If the framework contains distinct atomic concepts, create `concept-{name}.md` files using `templates/concept.md`.

Link concepts in framework frontmatter (`related_concepts`).

### 6. Link source material (optional)

If a primary source document exists in `source_material/`, reference it in the framework and in `INDEX.md`.

### 7. Register the artifact

Add entry to `knowledge/INDEX.md` under Frameworks.

Assign an ID (e.g., `FW-001`).

## Governance Checklist

- [ ] Source is cited and traceable
- [ ] No silent paraphrasing of authoritative content
- [ ] Framework supports decision improvement, not mere cataloging
- [ ] Entry added to `INDEX.md`

## Charter Reinforcement Note

Charter Section 13 states frameworks should strengthen or weaken over time based on demonstrated real-world effectiveness. Use `effectiveness_notes` in frontmatter to record observed outcomes when available.
