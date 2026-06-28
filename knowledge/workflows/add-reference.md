# Workflow: Add Reference Material

Add derived reference material to `knowledge/reference/`.

## Architecture Reference

- Build Plan — Knowledge Layer (Reference material)
- Governance Architecture v1.0 — Fidelity Preservation (LAD-010), No Silent Transformation (LAD-011)

## When to Use Reference vs Source Material

| Use `reference/` | Use `source_material/` |
|------------------|--------------------------|
| Summaries, insights, printouts | Primary documents (books, PDFs, transcripts) |
| Derived supporting documents | Raw meeting recordings, original transcripts |
| Synthesized guidance notes | Unmodified source files |

If unsure, ask: **Is this the primary evidence, or something derived from it?**

## Steps

### 1. Identify topic folder

Create or use a topic subfolder: `reference/{topic}/`

Examples: `voice-profiles/`, `mindset-and-purpose/`, `communication/`

### 2. Create reference artifact

Copy `templates/reference.md` to the topic folder.

Rename using kebab-case: `{short-title}.md`

For binary files (PDF, images), store the file in the topic folder and create a companion `.md` with frontmatter describing it.

### 3. Complete frontmatter

Required fields: `title`, `topic`, `summary`, `derived_from`, `derivation_type`.

If content was summarized, paraphrased, or restructured, log every transformation in `transformation_log`.

### 4. Mark derivation explicitly

Reference materials are often derived. The derivation must be visible:

- What source was used?
- What type of derivation (summary, extraction, synthesis)?
- Who approved the derivation?

### 5. Link to source material

If the primary source exists in `source_material/`, link it in `source_files`.

### 6. Register the artifact

Add entry to `knowledge/INDEX.md` under Reference Materials.

Assign an ID (e.g., `REF-001`).

## Governance Checklist

- [ ] Derivation is explicit and visible
- [ ] `transformation_log` records any content changes from source
- [ ] Primary source is linked or identified
- [ ] Entry added to `INDEX.md`

## Do Not

- Store unmodified primary sources in `reference/`
- Silently summarize authoritative content without logging transformation
- Treat reference summaries as equivalent to source documents in retrieval
