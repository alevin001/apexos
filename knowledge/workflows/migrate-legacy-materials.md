# Workflow: Migrate Legacy Materials

Migrate pre-Build 02 content from `docs/knowledge base/` into the Knowledge Layer.

## Purpose

`docs/knowledge base/` contains legacy reference materials created before repository structure was established. This workflow moves them into `knowledge/` without deleting originals until migration is verified.

## Architecture Reference

- Build 02 — Knowledge repository organization
- Charter Section 13 — Knowledge Repository Principles
- Memory Architecture v1.0 — Source vs Memory Principle

## Migration Principles

1. **Do not delete legacy files** until migration is verified and registered.
2. **Classify before moving** — determine source vs reference per `REPOSITORY-GUIDE.md`.
3. **Rename to conventions** — kebab-case, type-appropriate folders.
4. **Create metadata** — every migrated source gets a `.meta.md` companion.
5. **Update registry** — mark migration status in `INDEX.md`.
6. **Preserve fidelity** — do not modify source content during migration.

## Classification Guide

| Legacy content type | Target | Workflow |
|--------------------|--------|----------|
| Meeting transcripts (.vtt, transcript .docx) | `source_material/transcripts/` | `add-knowledge-source.md` |
| Original PDFs, books | `source_material/pdfs/` or `books/` | `add-knowledge-source.md` |
| Videos (.mp4) | `source_material/videos/` | `add-knowledge-source.md` |
| Images (.png) | `source_material/images/` or `reference/` | Classify by primary vs derived |
| Summaries, insights, printouts | `reference/{topic}/` | `add-reference.md` |
| Internal documents (.docx) | `source_material/internal-documents/` or `reference/` | Classify by primary vs derived |

## Steps (Per File)

### 1. Review legacy file

Open the file. Determine: primary source or derived reference?

### 2. Plan target location

Consult the Legacy Materials table in `INDEX.md` for proposed targets.

### 3. Copy (do not move yet)

Copy the file to the target location with kebab-case naming.

### 4. Create artifact metadata

Follow the appropriate workflow (`add-knowledge-source.md` or `add-reference.md`).

Set `derived_from` or `source` to the legacy path for traceability.

### 5. Update INDEX.md

Change migration status from `pending` to `migrated`.

Record both legacy path and new path.

### 6. Verify

Confirm the new artifact is findable, metadata is complete, and source content is unmodified.

### 7. Retire legacy path (optional)

After verification, add a note in the legacy location pointing to the new path. Do not delete without explicit approval.

Example stub in legacy folder:

```
# Migrated

This file has been migrated to: knowledge/source_material/transcripts/jbl-management-meeting.vtt

See knowledge/INDEX.md for registry entry.
```

## Batch Migration Order

Recommended order based on current legacy inventory:

1. **Transcripts** — highest traceability value for memory promotion (Build 03)
2. **PDFs and primary documents**
3. **Reference summaries and insights**
4. **Videos and images**
5. **Miscellaneous printouts and notes**

## Current Legacy Inventory

See `knowledge/INDEX.md` — Legacy Materials section for the full list and status.

## Do Not

- Bulk-move files without classification
- Summarize or transform content during migration
- Delete legacy files without verification
- Store migrated content in `memory/` — that is Build 03 scope
