# Retrieval Repository Guide

Build 04 implementation guide for the ApexOS Retrieval Layer.

## Purpose

This guide translates Retrieval Architecture v1.0 into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Evidence-based executive guidance |
| Context Architecture v1.0 (DOC-004) | Context determines relevance |
| Retrieval Architecture v1.0 (DOC-005) | Retrieval Objectives, Evidence Assembly, Ranking, Context Package Assembly |
| Memory Architecture v1.0 (DOC-003) | Retrieval targets from memory categories |
| Governance Architecture v1.0 (DOC-006) | Retrieval drift, fidelity, Evidence First Principle |
| Architecture & Doctrine Index v2.0 | LAD-007, LAD-008, AF-006, AF-007, AF-008 |

## Design Intent

The Retrieval Layer locates, assembles, prioritizes, and delivers the **smallest set** of information most likely to improve executive effectiveness.

```
Context answers:   What information matters?
Retrieval answers: How does ApexOS find the right information?
```

Retrieval executes the relevance determinations established by Context Architecture (LAD-007, AF-006). Retrieval is not search — retrieval is evidence assembly.

## Retrieval Flow

```
Situation → Context Determines Relevance → Retrieval Locates Evidence → Evidence Assembly → Context Package Creation → Inference
```

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `retrieval/requests/` | Retrieval request artifacts linked from context | Context evaluations (see `context/`) |
| `retrieval/knowledge/` | Knowledge retrieval scope and conventions | Knowledge content (see `knowledge/`) |
| `retrieval/memory/` | Memory retrieval scope and conventions | Memory content (see `memory/`) |
| `retrieval/evidence/` | Assembled evidence packages | Inference or recommendations |
| `retrieval/pattern/` | Pattern retrieval scope and conventions | Pattern storage (see `memory/pattern/`) |
| `retrieval/context-package/` | Assembled Context Packages for inference | Context relevance specifications (see `context/`) |
| `retrieval/docs/` | Implementation documentation | Architecture documents |
| `retrieval/templates/` | Artifact templates | Live retrieval content |
| `retrieval/workflows/` | Step-by-step operational workflows | Automated scripts |
| `retrieval/governance/` | Layer-specific fidelity and drift controls | Cross-layer governance (see `governance/`) |

## Retrieval Targets

| Target | Source Layer | Repository Path |
|--------|--------------|-----------------|
| Knowledge | Knowledge Layer | `knowledge/` via `retrieval/knowledge/` |
| Memory | Memory Layer | `memory/` via `retrieval/memory/` |
| Evidence | Multiple layers | `retrieval/evidence/` |
| Pattern | Memory Layer (Pattern Memory) | `memory/pattern/` via `retrieval/pattern/` |
| Context Package | Retrieval output | `retrieval/context-package/` |

## Core Principles

### Smallest Effective Set

Retrieval is optimized for relevance, usefulness, evidence quality, signal-to-noise ratio, and executive effectiveness — not completeness or maximum recall.

### Evidence First (LAD-008, AF-007)

Evidence precedes inference. Inference does not precede evidence. Retrieval maximizes evidence quality before inference occurs.

### Contradictory Evidence (AF-008)

Retrieval must include supporting evidence, contradictory evidence, alternative perspectives, and competing interpretations.

## Context Package Assembly

| Tier | Purpose |
|------|---------|
| Critical Context | Must be understood before interpretation |
| Supporting Context | Improves confidence and understanding |
| Available Context | Useful but not immediately necessary |

Tiers map from context domain weights (see `context/docs/context-weighting.md`).

## Retrieval Ranking Signals

Ranking signals apply within context-defined priorities:

| Signal | Meaning |
|--------|---------|
| Situation relevance | How directly the artifact affects the current situation |
| Outcome/results impact | Potential effect on outcomes if missed |
| Pattern strength | Confidence of validated patterns |
| Strategic significance | Alignment with mission and doctrine |
| Relationship significance | Importance of relationship dynamics |
| Recency | One factor among many |

Recency may influence retrieval. Recency should not dominate retrieval.

## Retrieval Structures (Repository Conventions)

Portable markdown structures with YAML frontmatter. Build 07 may map these fields to database columns without changing logical structure.

### Common Fields (All Retrieval Artifacts)

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID (e.g., `RET-REQ-001`) |
| `title` | Yes | Human-readable title |
| `request_date` | Yes | YYYY-MM-DD |
| `status` | Yes | `draft` \| `in_progress` \| `assembled` \| `delivered` \| `validated` \| `archived` |
| `context_reference` | Yes | Link to context relevance specification |
| `retrieval_targets` | Yes | knowledge, memory, evidence, pattern |
| `assembly_tiers` | When applicable | critical, supporting, available artifact lists |
| `evidence_package` | When assembled | Link to evidence package artifact |
| `context_package` | When delivered | Link to assembled Context Package |
| `contradictory_evidence` | Recommended | Links to contradictory evidence records |
| `validation_status` | Recommended | `pending` \| `passed` \| `failed` \| `adjusted` |
| `transformation_log` | When derived | Record of assembly decisions |

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Retrieval request | `requests/` | `ret-req-{short-slug}.md` | `ret-req-leadership-conflict-q2.md` |
| Evidence package | `evidence/` | `ret-evd-{short-slug}.md` | `ret-evd-leadership-conflict-q2.md` |
| Contradictory evidence | `evidence/` | `ret-con-{short-slug}.md` | `ret-con-leadership-conflict-q2.md` |
| Context Package | `context-package/` | `ret-pkg-{short-slug}.md` | `ret-pkg-leadership-conflict-q2.md` |
| Retrieval review | Same folder as request | `{request-basename}.review.md` | `ret-req-leadership-conflict-q2.review.md` |

## ID Conventions

| Prefix | Type |
|--------|------|
| `RET-REQ-` | Retrieval request |
| `RET-EVD-` | Evidence package |
| `RET-CON-` | Contradictory evidence record |
| `RET-PKG-` | Context Package (assembled) |
| `RET-REV-` | Retrieval review |

## Registry

`retrieval/INDEX.md` is the human-readable registry of retrieval requests, evidence packages, and Context Packages. Update it when creating, assembling, delivering, validating, or archiving content.

## Traceability Requirements

Every retrieval artifact must remain traceable:

1. **To context:** Link `context_reference` to context relevance specification.
2. **To sources:** Evidence items link to `knowledge/` or `memory/` paths — not duplicates.
3. **To assembly:** Evidence package links to retrieval request; Context Package links to evidence package.
4. **To validation:** Retrieval review links to outcome or inference feedback when available.

See `docs/retrieval-traceability.md`, `governance/traceability/README.md`, and `governance/source-fidelity/retrieval-layer.md`.

## Governance Requirements

All retrieval artifacts are subject to:

- **LAD-007** — Retrieval executes context relevance determinations
- **LAD-008, AF-007** — Evidence First Principle
- **AF-006** — Retrieval assembles evidence for executive effectiveness
- **AF-008** — Contradictory Evidence Principle
- **Retrieval drift monitoring** — Evidence assembly becoming biased or incomplete (Governance Architecture)

See `retrieval/governance/` and `governance/source-fidelity/retrieval-layer.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `context/` | Provides relevance specification — retrieval does not override without context review |
| `knowledge/` | Source of frameworks, reference, and source material |
| `memory/` | Source of distilled intelligence and validated patterns |
| `inference/` | Consumes assembled Context Package — does not influence evidence selection |
| `outcomes/` | Validates retrieval effectiveness through observed results |
| `governance/` | Retrieval drift detection, fidelity, review controls |

## Distinctions

| Concept | Location | Role |
|---------|----------|------|
| Context relevance specification | `context/` | What to retrieve |
| Evidence package | `retrieval/evidence/` | Assembled evidence before packaging |
| Context Package | `retrieval/context-package/` | Final output for inference |
| Knowledge retrieval | `retrieval/knowledge/` | Conventions for knowledge targets |
| Memory retrieval | `retrieval/memory/` | Conventions for memory targets |
| Search | Not an ApexOS layer | Retrieval is evidence assembly, not search |

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 04 | Retrieval layer artifacts | Complete |
| Build 05 | Inference layer artifacts | Complete |
| Build 06 | Recommendation layer artifacts | Complete |
| Build 07 | Outcome and learning design / Supabase | Pending |
