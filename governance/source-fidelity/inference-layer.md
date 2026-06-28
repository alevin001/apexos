# Inference Layer — Source Fidelity and Governance Controls

Inference-specific implementation of Governance Architecture principles for evidence interpretation.

## Architecture Reference

- **Inference Architecture v1.0 (DOC-007):** Evidence Evaluation, Inferential Transparency, Governance Controls, LAD-013
- **Retrieval Architecture v1.0 (DOC-005):** Evidence First — inference operates upon assembled evidence
- **Governance Architecture v1.0 (DOC-006):** Fidelity Preservation, No Silent Transformation, LAD-008 through LAD-011
- **Index:** LAD-013, AF-007, AF-011, AF-012, AF-013, CP-008

## Scope

Applies to all content in `inference/`:

- Interpretation Packages (`interpretation/`)
- Evidence assessments (`reasoning/`)
- Assumption registers (`reasoning/`)
- Blind spot reviews (`reasoning/`)
- Hypothesis evaluations (`hypothesis-generation/`)
- Confidence assessments (`reasoning/`)
- Competing interpretation artifacts (`reasoning/`)
- Inference reviews

Retrieval controls in `retrieval-layer.md` govern evidence assembly. Context controls govern relevance determination.

## Core Inference Governance Rules

### Evidence First (LAD-008, AF-007)

| Rule | Requirement |
|------|-------------|
| Evidence precedes inference | Operate only on validated Context Package |
| No pre-evidence inference | Do not interpret before retrieval delivery |
| No evidence selection influence | Request new retrieval — do not bias assembly |
| Reference evidence by path | Do not duplicate source content |

### Inference Operates Upon Evidence (LAD-013, AF-011)

| Rule | Requirement |
|------|-------------|
| Interpret assembled evidence | Context Package is the input |
| Convert evidence to interpretation | Primary layer responsibility |
| Do not generate recommendations | Produce Interpretation Package only |
| Maintain category separation | Evidence, findings, hypotheses, assumptions, unknowns |

### Assumption Transparency (AF-012)

| Rule | Requirement |
|------|-------------|
| Assumptions explicitly identified | Assumption register required |
| Assumptions remain challengeable | Document supporting/contradicting evidence |
| Assumptions are not evidence | Category enforcement in review |
| Hidden assumptions scanned | Hidden assumption scan in workflow |

### Uncertainty Is Valid (AF-013)

| Rule | Requirement |
|------|-------------|
| Declare insufficient evidence | When warranted — not failure |
| Prefer uncertainty over unsupported certainty | Confidence calibration required |
| Document unknowns | Explicit unknowns section |
| Request additional evidence | New retrieval request when needed |

### Perspective Neutrality (CP-008)

| Rule | Requirement |
|------|-------------|
| No automatic perspective authority | All perspectives evaluated equally |
| Evidence support determines weight | Not role or status |
| Competing interpretations evaluated | Not prematurely eliminated |

## Fidelity Preservation (LAD-010) — Inference Context

When interpreting evidence:

- Reference source paths from Context Package — do not duplicate content
- Preserve meaning from evidence — do not distort source intent in findings
- Preserve confidence levels from source artifacts where cited
- Document evidence weighting rationale

## No Silent Transformation (LAD-011) — Inference Context

| Transformation | Visibility requirement |
|----------------|----------------------|
| Hypothesis → finding | Explicit reclassification with evidence justification |
| Assumption → fact | Forbidden without validation evidence |
| Finding → recommendation | Move to recommendation layer |
| Confidence adjustment | Document in confidence assessment |
| Post-handoff modification | New inference cycle — do not silently edit handed-off packages |
| Category conflation | Reclassify and document in transformation_log |

## Inference Drift

Inference drift occurs when interpretation becomes unsupported certainty, hidden assumptions, or category confusion (Governance Architecture).

| Indicator | Response |
|-----------|----------|
| Hypotheses presented as findings | Reclassify; update artifact |
| Assumptions hidden in conclusions | Extract to assumption register |
| Confidence overstated | Re-run confidence calibration |
| Contradictory evidence ignored | Re-run evidence evaluation |
| Recommendations in inference artifacts | Remove; defer to recommendation layer |
| Evidence selection influenced by conclusion | New retrieval request; re-infer |
| Forced conclusions despite gaps | Declare insufficient evidence (AF-013) |

See `inference/governance/inference-review-checklist.md` and `inference/governance/interpretation-boundaries.md`.

## Review Requirements

- Validate every Interpretation Package before recommendation handoff
- Re-validate when Context Package is materially updated
- Review when outcome evidence contradicts interpretation
- Review when recommendation layer identifies inference gaps
- No inference workflow exempt from validation (LAD-009)

## Checklists and Workflows

| Control | Location |
|---------|----------|
| Pre-handoff | `inference/governance/inference-review-checklist.md` |
| Boundaries | `inference/governance/interpretation-boundaries.md` |
| Traceability | `inference/governance/inference-traceability.md` |
| Pipeline | `inference/workflows/interpretation-workflow.md` |

## Relationship to Retrieval

Receive Context Package from retrieval. If inference requires additional evidence, create a new retrieval request — do not informally expand scope or influence prior assembly.

## Relationship to Recommendation

Deliver Interpretation Package to recommendation. Recommendation operates upon interpretation — it does not re-perform inference. Do not include recommendations in inference artifacts.
