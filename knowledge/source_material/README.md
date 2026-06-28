# Source Material

## Responsibility

Stores primary source documents — books, PDFs, articles, videos, presentations, meeting transcripts, internal documents, training material, and images — that serve as evidence and traceability inputs for the memory promotion model.

## Architecture Reference

- **Charter:** `architecture/1 - ApexOS - Project Charter v1.0.docx` (Section 13 — Knowledge Repository Principles)
- **Memory:** `architecture/3 - ApexOS - Memory Architecture v1.0.docx` (Source vs Memory Principle, Memory Promotion Model)
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Knowledge Sources)

## Supported Types (Technical Architecture v0.1)

Books, PDFs, articles, videos, presentations, internal documents, meeting transcripts, frameworks, images, training material.

## Folder Structure

```
source_material/
├── books/
├── pdfs/
├── articles/
├── videos/
├── presentations/
├── transcripts/
├── internal-documents/
├── images/
└── training/
```

## Storage Pattern

Each source consists of:

1. **Raw file** — unmodified primary document
2. **Companion metadata** — `{same-basename}.meta.md` using `../templates/knowledge-source.meta.md`

## Source vs Memory Principle

Source information is retained for traceability, validation, and historical context. Distilled intelligence serves as the primary memory layer used for retrieval, learning, pattern recognition, and executive guidance.

```
Source Information  →  Observation  →  Memory  →  Pattern  →  Reinforcement
```

Do not store observations or distilled intelligence in this folder. That is `memory/` scope (Build 03).

## Templates and Workflow

| Resource | Location |
|----------|----------|
| Metadata template | `../templates/knowledge-source.meta.md` |
| Add workflow | `../workflows/add-knowledge-source.md` |
| Migration workflow | `../workflows/migrate-legacy-materials.md` |

## Naming Convention

`{author-or-org}-{short-title}.{ext}` in kebab-case.

Example: `transcripts/jbl-management-meeting.vtt` + `transcripts/jbl-management-meeting.meta.md`

## Governance

- Do not modify source file content during ingestion
- Log any required transformations in metadata `transformation_log`
- See `governance/source-fidelity/knowledge-layer.md`

## Build Status

Build 02 complete. Folder structure, naming, and metadata conventions defined.
