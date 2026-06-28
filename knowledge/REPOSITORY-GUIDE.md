# Knowledge Repository Guide

Build 02 implementation guide for the ApexOS Knowledge Layer.

## Purpose

This guide translates completed architecture into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Section 13 — Knowledge & Framework Sources |
| Technical Architecture v0.1 | Knowledge Architecture |
| Memory Architecture v1.0 (DOC-003) | Source vs Memory Principle, Memory Promotion Model |
| Governance Architecture v1.0 (DOC-006) | Fidelity Preservation (LAD-010), No Silent Transformation (LAD-011) |
| Architecture & Doctrine Index v2.0 | FAB-002 — Knowledge Repository Architecture (open backlog) |

## Design Intent

The Knowledge Layer is the **expandable intelligence layer** of ApexOS. It stores usable knowledge — not merely files.

```
Charter (doctrine)     →  architecture/     →  authoritative, frozen conceptual truth
Knowledge (inventory)  →  knowledge/         →  expandable, modular knowledge repository
Legacy materials       →  docs/knowledge base/  →  pre-Build 02 reference; migrate per workflow
```

Charter Section 13 intentionally separates governing philosophy from the evolving knowledge inventory. This repository implements that separation.

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `architecture/` | Authoritative architecture documents (DOC-001 through DOC-009, Index) | Implementation artifacts, derived summaries |
| `knowledge/doctrine/` | Doctrine indices and traceable references to Charter doctrine | Duplicated or paraphrased Charter content |
| `knowledge/frameworks/` | Framework artifacts and related concept artifacts | Raw source files (books, PDFs, transcripts) |
| `knowledge/reference/` | Derived reference materials supporting executive guidance | Primary source documents |
| `knowledge/source_material/` | Primary source documents and companion metadata | Distilled memory (see `memory/`) |
| `knowledge/templates/` | Artifact templates | Live knowledge content |
| `knowledge/workflows/` | Step-by-step operational workflows | Automated scripts |

## Knowledge Structures (Technical Architecture v0.1)

Three portable structures govern knowledge artifacts. These are **file conventions**, not database schemas.

### Knowledge Source

Primary evidence documents stored in `source_material/`. Each source should have a companion metadata file.

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Human-readable title |
| `author` | When known | Author, speaker, or originator |
| `source` | Yes | Origin (book, meeting, URL, internal document) |
| `type` | Yes | See supported types below |
| `summary` | Recommended | Brief purpose statement; not a substitute for the source |
| `tags` | Recommended | Retrieval and organization tags |

**Supported types (Technical Architecture v0.1):** books, PDFs, articles, videos, presentations, internal documents, meeting transcripts, frameworks, images.

### Framework

Structured leadership, communication, negotiation, or behavioral models stored in `frameworks/`.

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Framework name |
| `description` | Yes | What the framework is and when it applies |
| `source` | Yes | Traceable reference to authoritative origin |
| `related_concepts` | Recommended | Links to concept artifacts |

### Concept

Atomic ideas linked to frameworks, situations, and outcomes. Stored as markdown in `frameworks/` using the `concept-` filename prefix (see Naming Conventions).

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Concept name |
| `definition` | Yes | Clear definition |
| `related_frameworks` | Recommended | Framework artifacts that use this concept |
| `related_situations` | Optional | Situation types where concept applies |
| `related_outcomes` | Optional | Outcomes this concept has influenced |

## Source vs Memory Boundary

Memory Architecture defines a strict boundary. Build 02 establishes repository rules; Build 03 implements memory artifacts.

```
Source Information  →  Observation  →  Memory  →  Pattern  →  Reinforcement
     ↑                      ↑
source_material/         memory/ (Build 03)
```

| Layer | Location | Role |
|-------|----------|------|
| Source Information | `knowledge/source_material/` | Raw evidence retained for traceability, validation, historical context |
| Distilled intelligence | `memory/` | Primary layer for retrieval, learning, pattern recognition, executive guidance |

**Rule:** Do not store distilled intelligence in `knowledge/`. Do not store raw source files in `memory/` without explicit governance review.

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Source file | `source_material/{type}/` | `{author-or-org}-{short-title}.{ext}` | `source_material/transcripts/jbl-management-meeting.vtt` |
| Source metadata | Same folder as source | `{same-basename}.meta.md` | `jbl-management-meeting.meta.md` |
| Framework | `frameworks/` | `{framework-name}.md` | `frameworks/strategic-hierarchy.md` |
| Concept | `frameworks/` | `concept-{concept-name}.md` | `frameworks/concept-understanding-before-action.md` |
| Reference | `reference/{topic}/` | `{short-title}.md` | `reference/voice-profiles/original-voice-summary.md` |
| Doctrine index | `doctrine/` | `{index-name}.md` | `doctrine/prime-doctrines-index.md` |

## Folder Organization

### `source_material/`

Organize by type:

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

Place the binary or text source file and its `.meta.md` companion in the same folder.

### `frameworks/`

Flat or topical subfolders are permitted when volume grows. Start flat for simplicity.

### `reference/`

Organize by topic or domain (e.g., `voice-profiles/`, `mindset-and-purpose/`). Reference materials are derived or supporting — not primary sources.

### `doctrine/`

Indices and cross-reference cards only. All doctrine text remains authoritative in the Charter (`architecture/1 - ApexOS - Project Charter v1.0.docx`).

## Registry

`knowledge/INDEX.md` is the human-readable registry of all knowledge artifacts. Update it when adding, moving, or retiring artifacts.

## Governance Requirements

All knowledge artifacts are subject to:

- **LAD-010** — Fidelity preservation for authoritative content
- **LAD-011** — No silent transformation (summarization, paraphrasing, omission require visibility)
- **Charter Section 13** — Source quality standards and knowledge evolution principles

See `governance/source-fidelity/knowledge-layer.md` for knowledge-specific controls.

## Relationship to Retrieval

Retrieval accesses knowledge through `retrieval/knowledge/`. Retrieval ranking signals (Retrieval Architecture v1.0) apply: situation relevance, outcome impact, pattern strength, relationship significance, strategic significance, recency (as one factor).

Knowledge retrieval goal (Technical Architecture v0.1): retrieve knowledge that improves interpretation, recommendations, communication, leadership effectiveness, and outcomes.

## Legacy Materials

Pre-Build 02 materials live in `docs/knowledge base/`. Do not delete legacy files during migration. Follow `workflows/migrate-legacy-materials.md`.

## FAB-002 Status

FAB-002 (Knowledge Repository Architecture) remains open in the Architecture & Doctrine Index for digital system implementation (Build 07). Build 02 defines **repository-level** organization, templates, and workflows. Build 07 may extend these conventions into portable data structures without changing the logical architecture.

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 02 | Repository organization, templates, workflows | Complete |
| Build 03 | Memory layer artifacts | Pending |
| Build 07 | Supabase / portable data structures | Pending |
