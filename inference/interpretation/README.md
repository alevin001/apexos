# Interpretation

## Responsibility

Produces the primary output of Inference Architecture — synthesized understanding from inferential analysis.

## Architecture Reference

- **Primary:** `architecture/7 - ApexOS - Inference Architecture v1.0.docx` (Interpretation Model, Inference Outputs)

## Build 05 Conventions

| Convention | Value |
|------------|-------|
| Template | `templates/interpretation-package-template.md` |
| Naming | `inf-int-{short-slug}.md` |
| ID prefix | `INF-INT-` |
| Workflow | `workflows/interpretation-workflow.md` |
| Pre-handoff checklist | `governance/inference-review-checklist.md` |

## Output

The Interpretation Package — trustworthy inputs for recommendations, decisions, communication, leadership actions, and organizational improvement.

Contains: evidence assessment, perspective assessment, assumption assessment, blind spot assessment, hypotheses, confidence assessments, risks, opportunities, competing interpretations, unknowns, interpretive findings, and synthesized interpretation.

## Component Artifacts

Interpretation Packages link to component artifacts in `reasoning/` and `hypothesis-generation/` via frontmatter `component_artifacts`.

## Downstream Consumer

`recommendation/` operates upon the Interpretation Package. Recommendation should not re-perform inference.

## Do Not Store Here

- Recommendations or decision support
- Assembled evidence (see `retrieval/context-package/`)
- Raw source material (see `knowledge/`)
