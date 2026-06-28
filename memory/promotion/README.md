# Promotion Records

## Responsibility

Stores audit records for memory promotion decisions. Promotion must remain **reviewable** (Memory Architecture — Memory Promotion Model; Governance Architecture — No Silent Transformation Principle).

## Architecture Reference

- **Primary:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx` (Memory Promotion Model)
- **Governance:** `governance/source-fidelity/memory-layer.md`

## What Belongs Here

- Records of observation → memory promotion
- Records of memory → pattern promotion
- Records of promotion rejection or deferral
- Review notes and approval rationale

## What Does Not Belong Here

- Memory content itself — store in category folders
- Raw observations — store in `observations/`
- Source files — store in `knowledge/source_material/`

## Template and Workflow

| Artifact | Path |
|----------|--------|
| Template | `templates/promotion-record.md` |
| Promote to memory | `workflows/promote-to-memory.md` |
| Promote to pattern | `workflows/promote-to-pattern.md` |

## Registry

Register every promotion record in `memory/INDEX.md` under Promotion Records.
