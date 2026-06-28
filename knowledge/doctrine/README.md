# Doctrine

## Responsibility

Stores doctrine **indices and traceable references** to Charter-derived doctrines, prime doctrines, and behavioral doctrines. Governs how ApexOS links knowledge artifacts to governing doctrine.

**This folder does not store duplicated Charter content.**

## Architecture Reference

- **Primary:** `architecture/1 - ApexOS - Project Charter v1.0.docx` (Sections 4, 11, 14)
- **Index:** `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` (Section 3 — Prime Doctrines: PD-001 through PD-003)

## Artifacts

| File | Purpose |
|------|---------|
| `prime-doctrines-index.md` | Traceable index to PD-001 through PD-003 and related core principles |

## Prime Doctrines

Reference only — authoritative text remains in the Charter:

- **PD-001** — Leadership Creates Results
- **PD-002** — Results Validate Leadership
- **PD-003** — Principles Govern Tactics

## Storage Rules

| Do | Do not |
|----|--------|
| Create indices linking to Charter sections | Paraphrase or summarize Charter doctrine |
| Reference doctrine IDs (PD-*, CP-*, LAD-*) in knowledge artifacts | Store behavioral doctrine text extracted from Section 14 |
| Note alignment when adding frameworks or sources | Override or reinterpret doctrine in implementation artifacts |

## Governance Rule

The Charter remains the highest authority. No architectural layer may override Charter doctrine (LAD-001, LAD-002).

## Adding Doctrine References

When a knowledge artifact aligns with or is governed by specific doctrine:

1. Reference the doctrine ID in artifact frontmatter or tags.
2. Do not copy doctrine text — link to `architecture/1 - ApexOS - Project Charter v1.0.docx`.
3. If alignment is unclear, refer to the Charter before proceeding.

## Build Status

Build 02 complete. Doctrine storage conventions defined.
