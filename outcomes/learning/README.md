# Learning

## Responsibility

Store validated learning updates confirmed through outcome evidence — learning that may be promoted to memory after validation review.

## Architecture Reference

- **Primary:** `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx` (Learning Loop, Outcome Validation, Learning Promotion)

## Validation Questions

Was the desired outcome achieved? Did unintended outcomes occur? Did the action influence the outcome? Did the recommendation improve results?

## Principle

The objective is not to defend prior conclusions. The objective is continuous improvement through measured learning (AF-015). Learning is validated before promotion — unvalidated learning does not influence future retrieval, inference, or recommendations.

## Downstream Influence

Validated learning influences future retrieval, inference, recommendations, confidence assessments, and pattern weighting across all layers — only after validation review and memory promotion workflow.

## Artifact Conventions

| Template | Naming | Location |
|----------|--------|----------|
| `templates/learning-update-template.md` | `out-lrn-{short-slug}.md` | This folder |

## Workflow

Execute `workflows/learning-promotion-workflow.md` after Validation Package is complete.

## Distinction from Memory

This folder holds validated learning artifacts from the outcome layer. Durable retained intelligence lives in `memory/` after promotion via `memory/workflows/promote-to-memory.md`.
