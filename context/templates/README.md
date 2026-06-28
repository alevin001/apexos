# Context Templates

Portable markdown templates for context layer artifacts. Copy a template, fill in frontmatter, and register the artifact in `INDEX.md`.

Templates use YAML frontmatter for portability (Build 07 may map these fields to database columns without changing logical structure).

## Templates

| Template | Use for | Location |
|----------|---------|----------|
| `context-package.md` | Relevance specification for retrieval handoff | `situation/` |
| `context-evaluation.md` | Domain evaluation record | `situation/` or domain folders |
| `context-weighting.md` | Weighting decisions and rationale | Same folder as evaluation |
| `context-review.md` | Post-outcome review of relevance decisions | Same folder as evaluation |

## Usage

1. Copy the appropriate template into the target folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Complete all required frontmatter fields.
4. Link to memory and knowledge references — never duplicate stored content.
5. Register in `context/INDEX.md`.
6. Hand off to retrieval via `workflows/context-assembly.md`.

## Governance

- Context templates document relevance — not evidence, inference, or recommendations.
- Do not populate assembled evidence in context templates — that is retrieval responsibility.
- See `governance/context-fidelity-checklist.md` and `governance/source-fidelity/context-layer.md`.

## Distinction: Context Evaluation vs Context Package

| Template | Layer output | Contains evidence? |
|----------|--------------|-------------------|
| `context-package.md` (this layer) | Relevance specification | No |
| Assembled package | `retrieval/context-package/` | Yes |

See `docs/context-packages.md`.
