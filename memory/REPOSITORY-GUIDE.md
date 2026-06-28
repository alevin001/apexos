# Memory Repository Guide

Build 03 implementation guide for the ApexOS Memory Layer.

## Purpose

This guide translates Memory Architecture v1.0 into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Executive learning loop; outcome validation |
| Foundations Architecture v1.0 (DOC-002) | Core objects — Executive, Person, Relationship, Situation, Decision, Pattern |
| Memory Architecture v1.0 (DOC-003) | Memory categories, Source vs Memory Principle, Memory Promotion Model |
| Governance Architecture v1.0 (DOC-006) | Memory drift, fidelity, review, no silent transformation |
| Outcome & Results Architecture v1.0 (DOC-009) | Pattern validation, reinforcement, outcome evidence |
| Architecture & Doctrine Index v2.0 | LAD-005, AF-003, AF-016, LAD-016 |

## Design Intent

The Memory Layer stores **distilled executive intelligence** — not source material.

```
Knowledge (source)  →  memory/observations/  →  memory/{category}/  →  memory/pattern/  →  reinforcement
     ↑                         ↑                        ↑
source_material/          low confidence            retained intelligence
```

The Knowledge Layer stores usable source material. The Memory Layer stores what ApexOS retains to improve future outcomes and results (LAD-005, AF-003).

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `memory/observations/` | Initial interpretations of source information — low confidence, pre-promotion | Distilled memory; raw source files |
| `memory/executive/` | Executive Memory — how the operator leads, communicates, and operates | Raw transcripts; duplicated Charter content |
| `memory/person/` | Person Memory — individuals and how they think, communicate, respond | Static CRM records without executive relevance |
| `memory/relationship/` | Relationship Memory — evolution of leadership relationships | Person-only context without relationship dynamics |
| `memory/situation/` | Situation Memory — recurring situations and their context | Live situation assembly (see `context/`) |
| `memory/decision/` | Decision Memory — choices made, rationale, resulting outcomes | Recommendations (see `recommendation/`) |
| `memory/pattern/` | Pattern Memory — validated learning after repeated observation | Single observations; unvalidated hypotheses |
| `memory/outcome-results/` | Outcome/Results Memory — positive and negative results as validation evidence | Outcome validation architecture (see `outcomes/`) |
| `memory/promotion/` | Promotion audit records — reviewable promotion decisions | Memory content itself |
| `memory/templates/` | Artifact templates | Live memory content |
| `memory/workflows/` | Step-by-step operational workflows | Automated scripts |

## Memory Categories (Memory Architecture v1.0)

| Category | Folder | Purpose |
|----------|--------|---------|
| Executive Memory | `executive/` | Maintain understanding of the operator — not just who, but how |
| Person Memory | `person/` | Remember what matters about individuals and their tendencies |
| Relationship Memory | `relationship/` | Track evolution of leadership relationships over time |
| Situation Memory | `situation/` | Remember recurring situations and surrounding context |
| Decision Memory | `decision/` | Remember choices made and why — causal link to outcomes |
| Pattern Memory | `pattern/` | Store validated learning after repeated observation and confirmation |
| Outcome/Results Memory | `outcome-results/` | Store positive and negative results as validation evidence |

**Observation is not a memory category.** It is a promotion stage — initial interpretation stored in `observations/` until promoted or discarded.

**Patterns are not memories until validated.** A single observation does not become a pattern. Patterns emerge only after repeated validated observations (Memory Architecture — Pattern Memory).

## Source vs Memory Boundary

| Layer | Location | Role |
|-------|----------|------|
| Source Information | `knowledge/source_material/` | Raw evidence for traceability, validation, historical context |
| Observation | `memory/observations/` | Initial interpretation — useful, low confidence |
| Distilled intelligence | `memory/{category}/` | Primary layer for retrieval, learning, pattern recognition, executive guidance |
| Pattern | `memory/pattern/` | Repeatedly validated learning supported by multiple observations, decisions, and outcomes |

**Rules:**

- Do not store distilled intelligence in `knowledge/`.
- Do not store raw source files in `memory/` without explicit governance review.
- Do not summarize source documents into memory — distill executive-relevant intelligence with traceability.
- Never duplicate source documents into memory.

## Memory Promotion Model

```
Source Information → Observation → Memory → Pattern → Reinforcement
```

| Stage | Location | Confidence | Meaning |
|-------|----------|------------|---------|
| Source Information | `knowledge/source_material/` | Evidence | Raw conversations, documents, notes, meetings |
| Observation | `memory/observations/` | Low | Initial interpretation of source information |
| Memory | `memory/{category}/` | Retained | Distilled intelligence judged valuable for future use |
| Pattern | `memory/pattern/` | Validated | Repeatedly observed learning supported by evidence |
| Reinforcement | Confidence updates | Proven | Learning that actively influences future guidance |

Promotion must remain **reviewable**. Record every promotion in `memory/promotion/` using `templates/promotion-record.md`.

## Memory Structures (Repository Conventions)

Portable markdown structures with YAML frontmatter. Build 07 may map these fields to database columns without changing logical structure.

### Common Fields (All Memory Artifacts)

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID (e.g., `MEM-PER-001`) |
| `category` | Yes | Memory category |
| `title` | Yes | Human-readable title |
| `summary` | Yes | Distilled intelligence — not a source summary |
| `confidence` | Yes | `low` \| `medium` \| `high` \| `validated` |
| `originating_knowledge` | When applicable | Links to `knowledge/` sources — required for promotion from source |
| `promoted_from` | When applicable | Link to observation or prior memory artifact |
| `related_outcomes` | Recommended | Links to outcome/results evidence |
| `related_patterns` | Optional | Links to pattern artifacts |
| `review_status` | Yes | `draft` \| `active` \| `under_review` \| `weakened` \| `retired` |
| `last_reviewed` | Recommended | YYYY-MM-DD |
| `transformation_log` | When derived | Record of any derivation from source |

### Outcome Reference

Lightweight cross-layer links between memory artifacts and the Outcomes layer. Use `templates/outcome-reference.md` — stored in the category folder of the related memory artifact or in `outcome-results/` when the reference itself is outcome evidence.

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Observation | `observations/` | `obs-{short-slug}.md` | `obs-jbl-meeting-communication-style.md` |
| Executive memory | `executive/` | `{aspect-or-topic}.md` | `executive/communication-tendencies.md` |
| Person memory | `person/` | `{person-slug}.md` | `person/jane-smith.md` |
| Relationship memory | `relationship/` | `{person-a}-{person-b}.md` | `relationship/executive-jane-smith.md` |
| Situation memory | `situation/` | `{situation-type-slug}.md` | `situation/leadership-conflict-team-alignment.md` |
| Decision memory | `decision/` | `{decision-slug}.md` | `decision/q2-reorg-approval.md` |
| Pattern memory | `pattern/` | `{pattern-slug}.md` | `pattern/direct-feedback-builds-trust.md` |
| Outcome/results memory | `outcome-results/` | `{outcome-slug}.md` | `outcome-results/q2-reorg-morale-impact.md` |
| Promotion record | `promotion/` | `prom-{YYYYMMDD}-{slug}.md` | `promotion/prom-20250628-jane-smith-observation.md` |
| Outcome reference | Same folder as related memory | `{memory-basename}.outcome-ref.md` | `decision/q2-reorg-approval.outcome-ref.md` |

## ID Conventions

| Prefix | Category |
|--------|----------|
| `OBS-` | Observation |
| `MEM-EXE-` | Executive Memory |
| `MEM-PER-` | Person Memory |
| `MEM-REL-` | Relationship Memory |
| `MEM-SIT-` | Situation Memory |
| `MEM-DEC-` | Decision Memory |
| `MEM-PAT-` | Pattern Memory |
| `MEM-OUT-` | Outcome/Results Memory |
| `PROM-` | Promotion record |
| `OUTREF-` | Outcome reference |

## Registry

`memory/INDEX.md` is the human-readable registry of all memory artifacts, observations, and promotion records. Update it when adding, promoting, weakening, or retiring content.

## Traceability Requirements

Every memory artifact must remain traceable to its originating knowledge:

1. **From source:** Link `originating_knowledge` to `knowledge/source_material/` metadata or framework/reference artifacts.
2. **From observation:** Link `promoted_from` to the observation artifact in `observations/`.
3. **From outcome:** Link `related_outcomes` to outcome/results memory or outcome layer artifacts.
4. **To pattern:** Document supporting observations, decisions, and outcomes in pattern frontmatter before promotion to `pattern/`.

See `governance/traceability/README.md` and `governance/source-fidelity/memory-layer.md`.

## Governance Requirements

All memory artifacts are subject to:

- **LAD-005** — Memory exists to improve future outcomes
- **LAD-010, LAD-011** — Fidelity and no silent transformation when deriving from sources
- **LAD-016** — Action-to-outcome correlation as high-value evidence for decision memory
- **AF-003** — Memory exists to improve future outcomes
- **AF-016** — Patterns must be reinforced or weakened based on results
- **Memory drift monitoring** — Stored learning becoming inaccurate or distorted (Governance Architecture)

See `governance/source-fidelity/memory-layer.md` and `memory/workflows/review-memory.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `knowledge/` | Source material — never duplicate into memory |
| `context/` | Determines which memory is relevant for a situation — see `context/REPOSITORY-GUIDE.md` |
| `retrieval/memory/` | Retrieves from memory categories as evidence — see `retrieval/REPOSITORY-GUIDE.md` |
| `outcomes/` | Validates memory; provides outcome capture and confidence recalibration |
| `inference/pattern-recognition/` | Inferential process — distinct from pattern memory storage |
| `governance/` | Memory drift detection, fidelity, review controls |

## Distinctions

| Concept | Location | Role |
|---------|----------|------|
| Pattern memory | `memory/pattern/` | Stored validated learning |
| Pattern recognition | `inference/pattern-recognition/` | Inferential process on assembled evidence |
| Outcome/results memory | `memory/outcome-results/` | What ApexOS knows about past results |
| Outcomes layer | `outcomes/` | Validation architecture — capture, learning, feedback |
| Organizational conditions | `context/organizational/` | Not a memory category (see `memory/README.md`) |

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 03 | Memory layer artifacts | Complete |
| Build 04 | Context and retrieval design | Complete |
| Build 05 | Inference and recommendation design | Pending |
| Build 06 | Outcome and learning design | Pending |
| Build 07 | Supabase / portable data structures | Pending |
