# Retrieval Templates

Portable markdown templates for retrieval layer artifacts. Copy a template, fill in frontmatter, and register the artifact in `INDEX.md`.

Templates use YAML frontmatter for portability (Build 07 may map these fields to database columns without changing logical structure).

## Templates

| Template | Use for | Location |
|----------|---------|----------|
| `retrieval-request.md` | Scope retrieval from context handoff | `requests/` |
| `evidence-package.md` | Assembled evidence before packaging | `evidence/` |
| `contradictory-evidence.md` | Contradictory evidence record | `evidence/` |
| `retrieval-review.md` | Post-delivery validation record | Same folder as request |

Context Package structure is documented in `docs/context-package-assembly.md` — assembled packages are stored in `context-package/` using the evidence package structure organized by tiers.

## Usage

1. Copy the appropriate template into the target folder.
2. Rename using conventions in `REPOSITORY-GUIDE.md`.
3. Complete all required frontmatter fields.
4. Link all evidence items to source paths — never duplicate content.
5. Register in `retrieval/INDEX.md`.
6. Validate before delivery via `workflows/retrieval-validation.md`.

## Governance

- Run `governance/evidence-first-checklist.md` before evidence assembly.
- Run `governance/retrieval-fidelity-checklist.md` before package delivery.
- See `governance/source-fidelity/retrieval-layer.md`.

## Distinction: Evidence Package vs Context Package

| Template | Output | Purpose |
|----------|--------|---------|
| `evidence-package.md` | Evidence package | Raw assembly with ranking and exclusions |
| Context Package | `context-package/` | Tier-organized delivery for inference |

See `docs/context-package-assembly.md`.
