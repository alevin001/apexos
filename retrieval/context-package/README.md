# Context Package

## Responsibility

Assemble the primary output of Retrieval Architecture — a Context Package prepared for inference.

## Architecture Reference

- **Primary:** `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx` (Retrieval Output, Context Package Assembly)

## Distinction from Context Layer

| Artifact | Layer | Location |
|----------|-------|----------|
| Relevance specification | Context | `context/templates/context-package.md` |
| Assembled Context Package | Retrieval | `context-package/` (this folder) |

Context determines what to retrieve. Retrieval assembles evidence into the Context Package.

## Package Contents

Relevant evidence, relevant perspectives, relevant outcomes/results, relevant patterns, relevant relationships, and relevant strategic considerations.

## Assembly Tiers

| Tier | Purpose |
|------|---------|
| Critical Context | Must be understood before interpretation |
| Supporting Context | Improves confidence and understanding |
| Available Context | Useful but not immediately necessary |

Tiers map from context domain weights. See `../docs/context-package-assembly.md`.

## Artifact Conventions

| Item | Convention |
|------|------------|
| Naming | `ret-pkg-{short-slug}.md` |
| ID prefix | `RET-PKG-` |
| Source | Assembled from validated evidence package |

## Workflows

| Workflow | Purpose |
|----------|---------|
| `../workflows/package-delivery.md` | Create and deliver Context Package |
| `../workflows/retrieval-validation.md` | Validate before delivery |

## Downstream Consumer

The Context Package feeds Inference Architecture (`inference/`). Inference operates upon assembled evidence — it does not influence evidence selection.

## Registry

Register in `../INDEX.md` under Context Packages (Assembled).

## Governance

Run `../governance/retrieval-fidelity-checklist.md` before delivery.

See `../governance/source-fidelity/retrieval-layer.md`.
