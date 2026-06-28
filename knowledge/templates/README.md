# Knowledge Templates

Portable markdown templates for knowledge layer artifacts. Copy a template, fill in frontmatter, and register the artifact in `INDEX.md`.

Templates use YAML frontmatter for portability (Build 07 may map these fields to database columns without changing logical structure).

## Templates

| Template | Use for | Location |
|----------|---------|----------|
| `knowledge-source.meta.md` | Companion metadata for source files | `source_material/` |
| `framework.md` | Leadership, communication, negotiation, behavioral frameworks | `frameworks/` |
| `concept.md` | Atomic concepts linked to frameworks | `frameworks/` (prefix filename with `concept-`) |
| `reference.md` | Derived reference and supporting materials | `reference/` |

## Usage

1. Copy the appropriate template into the target folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Complete all required frontmatter fields.
4. Add entry to `INDEX.md`.
5. For source files, place the raw file alongside its `.meta.md` companion.

## Governance

- Do not paraphrase authoritative sources in templates without marking the transformation visible.
- Framework and concept descriptions must cite traceable sources.
- See `governance/source-fidelity/knowledge-layer.md`.
