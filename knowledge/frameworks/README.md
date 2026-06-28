# Frameworks

## Responsibility

Stores leadership, communication, negotiation, behavioral psychology, and executive performance frameworks that ApexOS applies situationally through contextual recall.

Concept artifacts (atomic ideas linked to frameworks) are stored in this folder using the `concept-` filename prefix.

## Architecture Reference

- **Primary:** `architecture/1 - ApexOS - Project Charter v1.0.docx` (Section 13 — Knowledge & Framework Sources, Proven Framework Reinforcement)
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Framework structure, Concept structure)

## Framework Structure (Technical Architecture v0.1)

| Field | Required |
|-------|----------|
| Name | Yes |
| Description | Yes |
| Source | Yes |
| Related concepts | Recommended |

## Concept Structure (Technical Architecture v0.1)

Concepts use the same folder with `concept-{name}.md` naming.

| Field | Required |
|-------|----------|
| Name | Yes |
| Definition | Yes |
| Related frameworks | Recommended |
| Related situations | Optional |
| Related outcomes | Optional |

## Templates and Workflow

| Resource | Location |
|----------|----------|
| Framework template | `../templates/framework.md` |
| Concept template | `../templates/concept.md` |
| Add workflow | `../workflows/add-framework.md` |

## Storage Rules

- One framework per markdown file in kebab-case naming.
- Every framework must cite a traceable source.
- Frameworks must remain aligned with Charter Section 13 quality standards.
- Record observed effectiveness in frontmatter when outcomes are known (Charter reinforcement principle).

## Organization

Start with a flat folder structure. Add topical subfolders only when volume warrants it.

## Governance

Frameworks are subject to fidelity preservation and no-silent-transformation principles. See `governance/source-fidelity/knowledge-layer.md`.

## Build Status

Build 02 complete. Storage conventions and templates defined.
