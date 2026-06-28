# Context Package Assembly

Rules for assembling the primary output of Retrieval Architecture — the Context Package prepared for inference.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Context Package Assembly, Retrieval Output
- Context Architecture v1.0 (DOC-004) — Context vs assembled package distinction

## Purpose

The Context Package is the primary retrieval output. It contains relevant evidence, perspectives, outcomes/results, patterns, relationships, and strategic considerations prepared for interpretation.

## Distinction from Context Layer

| Artifact | Layer | Contains |
|----------|-------|----------|
| Context relevance specification | `context/` | What to retrieve — no evidence |
| Context Package (this document) | `retrieval/context-package/` | Assembled evidence for inference |

## Assembly Tiers

| Tier | Purpose | Source |
|------|---------|--------|
| Critical Context | Must be understood before interpretation | Context domains weighted `critical` |
| Supporting Context | Improves confidence and understanding | Context domains weighted `supporting` |
| Available Context | Useful but not immediately necessary | Context domains weighted `available` |

Tiers map directly from context domain weights. Do not reassign tiers without context review.

## Package Contents

Each tier may include:

| Content type | Source |
|--------------|--------|
| Relevant evidence | `knowledge/`, `memory/` |
| Relevant perspectives | Evidence assembly — alternative viewpoints |
| Relevant outcomes/results | `memory/outcome-results/` |
| Relevant patterns | `memory/pattern/` |
| Relevant relationships | `memory/relationship/` |
| Relevant strategic considerations | `knowledge/doctrine/`, strategic context evidence |

## Assembly Process

1. Start from validated evidence package (`retrieval/evidence/`)
2. Organize evidence into tiers per context weights
3. Include contradictory evidence section (not tier-specific — applies to whole package)
4. Add assembly summary — what the package enables inference to address
5. Document gaps — expected evidence not found
6. Link all items to source paths
7. Validate via `../workflows/retrieval-validation.md`
8. Deliver via `../workflows/package-delivery.md`

Use `../templates/` and store in `context-package/`.

## Downstream Consumer

The Context Package feeds Inference Architecture (`inference/`).

Inference operates upon assembled evidence — it does not influence evidence selection. If inference requires additional evidence, create a new retrieval request — do not modify delivered packages silently.

## Package Quality Criteria

| Criterion | Requirement |
|-----------|-------------|
| Tier alignment | Matches context relevance specification |
| Traceability | Every item links to source path |
| Contradictory evidence | Included when conflicts exist |
| Smallest effective set | No unnecessary artifacts |
| Gap documentation | Missing expected evidence explicitly noted |
| No inference | Package contains evidence — not conclusions |

## Naming and Storage

| Item | Convention |
|------|------------|
| Location | `retrieval/context-package/` |
| Template | Assembled from evidence package structure |
| Naming | `ret-pkg-{short-slug}.md` |
| ID prefix | `RET-PKG-` |

## Registry

Register in `retrieval/INDEX.md` under Context Packages (Assembled).
