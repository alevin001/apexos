# Workflow: Add Knowledge Source

Add a primary source document to `knowledge/source_material/`.

## Architecture Reference

- Charter Section 13 — Knowledge & Framework Sources
- Technical Architecture v0.1 — Knowledge Source structure
- Memory Architecture v1.0 — Source vs Memory Principle

## Prerequisites

- Source file available (book excerpt, PDF, transcript, video, etc.)
- Source meets Charter Section 13 quality standards (credible, proven, strategically useful, philosophically aligned)

## Steps

### 1. Classify the source type

Choose folder per `REPOSITORY-GUIDE.md`:

| Type | Folder |
|------|--------|
| Book | `source_material/books/` |
| PDF | `source_material/pdfs/` |
| Article | `source_material/articles/` |
| Video | `source_material/videos/` |
| Presentation | `source_material/presentations/` |
| Meeting transcript | `source_material/transcripts/` |
| Internal document | `source_material/internal-documents/` |
| Image | `source_material/images/` |
| Training material | `source_material/training/` |

### 2. Name the source file

Use kebab-case: `{author-or-org}-{short-title}.{ext}`

Example: `jbl-management-meeting.vtt`

### 3. Copy the source file

Place the raw file in the appropriate type folder. Do not modify the source file content.

### 4. Create companion metadata

Copy `templates/knowledge-source.meta.md` to the same folder.

Rename to `{same-basename}.meta.md`.

Complete all required frontmatter fields.

### 5. Register the artifact

Add entry to `knowledge/INDEX.md` under Source Material.

Assign an ID (e.g., `SRC-001`).

### 6. Assess memory promotion (optional)

If distilled intelligence should be extracted, do **not** store it in `knowledge/`. Note intended memory promotion in metadata (`memory_promotion` field). Build 03 defines memory artifact creation.

## Governance Checklist

- [ ] Source file is unmodified (or modifications are logged in `transformation_log`)
- [ ] Metadata cites traceable origin
- [ ] No silent summarization of authoritative content in metadata
- [ ] Entry added to `INDEX.md`

## Do Not

- Store observations or distilled intelligence in `source_material/`
- Paraphrase source content in metadata as a substitute for the source file
- Add sources that conflict with Charter governing principles
