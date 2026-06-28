# Inference Repository Guide

Build 05 implementation guide for the ApexOS Inference Layer.

## Purpose

This guide translates Inference Architecture v1.0 into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Evidence-based executive guidance |
| Retrieval Architecture v1.0 (DOC-005) | Evidence assembly; inference operates upon assembled evidence |
| Governance Architecture v1.0 (DOC-006) | Fidelity, transparency, no silent transformation |
| Inference Architecture v1.0 (DOC-007) | Interpretation Model, Inference Outputs, Governance Controls |
| Architecture & Doctrine Index v2.0 | LAD-008, LAD-013, AF-007, AF-011, AF-012, AF-013, CP-008 |

## Design Intent

The Inference Layer transforms assembled evidence into defensible interpretation.

```
Retrieval answers:  What evidence should be assembled?
Inference answers:  What conclusions are most supported by that evidence?
```

Inference exists to convert evidence into interpretation while preserving transparency, uncertainty, and challengeability (AF-011). The objective is the most defensible interpretation supported by available evidence — not false certainty.

## Interpretation Model

```
Situation → Evidence Evaluation → Perspective Evaluation → Assumption Evaluation → Blind Spot Evaluation → Hypothesis Generation → Confidence Assessment → Interpretive Findings → Interpretation → Recommendation Inputs
```

Retrieval assembles evidence. Inference interprets evidence. Retrieval should occur before inference. Inference operates upon assembled evidence rather than influencing evidence selection (LAD-013, AF-007).

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `inference/interpretation/` | Interpretation Packages — primary output | Recommendations or decision support |
| `inference/reasoning/` | Evidence, perspective, assumption, and blind spot evaluation artifacts | Assembled evidence (see `retrieval/`) |
| `inference/hypothesis-generation/` | Hypothesis evaluation artifacts | Validated patterns (see `memory/pattern/`) |
| `inference/pattern-recognition/` | Pattern evaluation within inferential analysis | Pattern storage (see `memory/pattern/`) |
| `inference/templates/` | Artifact templates | Live inference content |
| `inference/workflows/` | Step-by-step operational workflows | Automated scripts |
| `inference/governance/` | Layer-specific fidelity and boundary controls | Cross-layer governance (see `governance/`) |

## Inference Responsibilities

Inference is limited to:

| Responsibility | Implementation |
|----------------|----------------|
| Evidence evaluation | `workflows/evidence-evaluation-workflow.md`, `templates/evidence-assessment-template.md` |
| Perspective evaluation | `workflows/evidence-evaluation-workflow.md` (perspective section) |
| Assumption identification | `workflows/assumption-review-workflow.md`, `templates/assumption-register-template.md` |
| Blind spot identification | `workflows/blind-spot-workflow.md`, `templates/blind-spot-review-template.md` |
| Hypothesis generation | `workflows/interpretation-workflow.md`, `templates/hypothesis-evaluation-template.md` |
| Confidence assessment | `workflows/confidence-calibration-workflow.md`, `templates/confidence-assessment-template.md` |
| Competing interpretation evaluation | `workflows/competing-interpretation-workflow.md`, `templates/competing-interpretations-template.md` |
| Interpretive findings | `templates/interpretation-package-template.md` |
| Synthesized interpretation | `interpretation/` — Interpretation Package |

Inference does **not** generate recommendations. Recommendation inputs are produced for `recommendation/` (Build 06 complete).

## Category Separation

Inference must distinguish between categories — they are not interchangeable:

| Category | Definition | Location |
|----------|------------|----------|
| Evidence | Directly supported retrieved information | Referenced from `retrieval/` — not duplicated |
| Findings | Conclusions strongly supported by evidence | Interpretation Package findings section |
| Hypotheses | Plausible explanations not yet validated | `hypothesis-generation/`, hypothesis template |
| Assumptions | Provisional beliefs when information is incomplete | `reasoning/`, assumption register template |
| Unknowns | Questions evidence cannot currently answer | Interpretation Package unknowns section |
| Recommendations | Action guidance | `recommendation/` — not inference |

## Core Principles

### Evidence First (LAD-008, AF-007)

Evidence precedes inference. Inference does not precede evidence. Inference operates upon assembled Context Package from retrieval.

### Evidence Versus Inference

Evidence supports inference. Inference should not be presented as evidence. The strength of an inference depends upon the strength of supporting evidence.

### Perspective Neutrality (CP-008)

No perspective receives automatic authority. The objective is not to determine who is right — it is to determine what is most supported by evidence and most likely to improve outcomes/results.

### Assumption Transparency (AF-012)

Assumptions must remain visible and challengeable. Assumptions are not evidence, findings, or conclusions.

### Uncertainty Is Valid (AF-013)

When evidence is incomplete, contradictory, or insufficient, ApexOS may conclude that more evidence is required or confidence is insufficient. Uncertainty is a valid output.

### Inferential Transparency

Evidence, findings, hypotheses, assumptions, and unknowns must remain visible and distinguishable at every stage.

## Inference Flow

```
Context Package (retrieval) → Evidence Evaluation → Perspective Evaluation → Assumption Review → Blind Spot Review → Hypothesis Evaluation → Confidence Calibration → Competing Interpretations → Interpretation Package → Handoff to Recommendation
```

Execute via `workflows/interpretation-workflow.md`. Individual workflows may run as focused reviews within the pipeline.

## Primary Output

The **Interpretation Package** containing:

- Evidence assessment
- Perspective assessment
- Assumption assessment
- Blind spot assessment
- Hypotheses
- Confidence assessments
- Risks
- Opportunities
- Competing interpretations
- Unknowns
- Interpretive findings
- Synthesized interpretation

Template: `templates/interpretation-package-template.md`  
Location: `interpretation/`

## Inference Structures (Repository Conventions)

Portable markdown structures with YAML frontmatter. Build 08 may map these fields to database columns without changing logical structure.

### Common Fields (All Inference Artifacts)

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID (e.g., `INF-INT-001`) |
| `title` | Yes | Human-readable title |
| `interpretation_date` | Yes | YYYY-MM-DD |
| `status` | Yes | `draft` \| `in_progress` \| `complete` \| `under_review` \| `handed_off` \| `archived` |
| `context_package` | Yes | Link to assembled Context Package from `retrieval/context-package/` |
| `retrieval_request` | Recommended | Link to retrieval request for traceability chain |
| `context_reference` | Recommended | Link to context relevance specification |
| `component_artifacts` | When applicable | Links to evidence assessment, assumption register, etc. |
| `confidence_summary` | When complete | Overall confidence level with rationale |
| `uncertainty_flags` | Recommended | insufficient_evidence, competing_interpretations, missing_information |
| `review_status` | Recommended | `pending` \| `confirmed` \| `adjusted` \| `superseded` |
| `transformation_log` | When derived | Record of interpretation changes |

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Interpretation Package | `interpretation/` | `inf-int-{short-slug}.md` | `inf-int-leadership-conflict-q2.md` |
| Evidence assessment | `reasoning/` | `inf-evd-{short-slug}.md` | `inf-evd-leadership-conflict-q2.md` |
| Assumption register | `reasoning/` | `inf-asm-{short-slug}.md` | `inf-asm-leadership-conflict-q2.md` |
| Blind spot review | `reasoning/` | `inf-bls-{short-slug}.md` | `inf-bls-leadership-conflict-q2.md` |
| Hypothesis evaluation | `hypothesis-generation/` | `inf-hyp-{short-slug}.md` | `inf-hyp-leadership-conflict-q2.md` |
| Confidence assessment | `reasoning/` | `inf-con-{short-slug}.md` | `inf-con-leadership-conflict-q2.md` |
| Competing interpretations | `reasoning/` | `inf-cmp-{short-slug}.md` | `inf-cmp-leadership-conflict-q2.md` |
| Inference review | Same folder as package | `{package-basename}.review.md` | `inf-int-leadership-conflict-q2.review.md` |

## ID Conventions

| Prefix | Type |
|--------|------|
| `INF-INT-` | Interpretation Package |
| `INF-EVD-` | Evidence assessment |
| `INF-ASM-` | Assumption register |
| `INF-BLS-` | Blind spot review |
| `INF-HYP-` | Hypothesis evaluation |
| `INF-CON-` | Confidence assessment |
| `INF-CMP-` | Competing interpretations |
| `INF-REV-` | Inference review |

## Registry

`inference/INDEX.md` is the human-readable registry of inference artifacts. Update it when creating, completing, reviewing, handing off to recommendation, or archiving content.

## Traceability Requirements

Every inference artifact must remain traceable:

1. **To retrieval:** Link `context_package` to assembled Context Package.
2. **To context:** Link `context_reference` to context relevance specification.
3. **To evidence:** Reference source paths from Context Package — do not duplicate evidence content.
4. **To components:** Link component artifacts (evidence assessment, assumptions, etc.) in Interpretation Package.
5. **To outcomes:** Update via inference review when outcome evidence is available.

See `governance/inference-traceability.md`, `governance/traceability/README.md`, and `governance/source-fidelity/inference-layer.md`.

## Governance Requirements

All inference artifacts are subject to:

- **LAD-008, AF-007** — Evidence precedes inference
- **LAD-013, AF-011** — Inference operates upon evidence; converts evidence to interpretation
- **AF-012** — Assumptions remain visible and challengeable
- **AF-013** — Uncertainty is a valid output
- **CP-008** — Perspective neutrality
- **LAD-010, LAD-011** — Fidelity preservation; no silent transformation
- **Inference drift monitoring** — Interpretation becoming unsupported certainty (Governance Architecture)

See `inference/governance/` and `governance/source-fidelity/inference-layer.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `retrieval/` | Provides assembled Context Package — inference does not influence evidence selection |
| `context/` | Context relevance determined upstream — inference does not redefine relevance |
| `knowledge/` | Source material referenced through retrieval — not duplicated in inference |
| `memory/` | Distilled intelligence referenced through retrieval — not duplicated in inference |
| `recommendation/` | Consumes Interpretation Package — should not re-perform inference |
| `outcomes/` | Validates inference through observed results |
| `governance/` | Inference drift detection, fidelity, review controls |

## Distinctions

| Concept | Location | Role |
|---------|----------|------|
| Context Package | `retrieval/context-package/` | Assembled evidence for inference |
| Evidence assessment | `inference/reasoning/` | Evaluation of assembled evidence |
| Interpretation Package | `inference/interpretation/` | Synthesized interpretation for recommendation |
| Pattern memory | `memory/pattern/` | Stored validated learning |
| Pattern recognition | `inference/pattern-recognition/` | Inferential evaluation of patterns in evidence |
| Recommendation | `recommendation/` | Decision support — not inference |
| Observations | `memory/observations/` | Pre-promotion interpretations — not inference findings |

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 05 | Inference layer artifacts | Complete |
| Build 06 | Recommendation layer artifacts | Complete |
| Build 07 | Outcome layer artifacts | Complete |
| Build 08 | Supabase / portable data structures | Pending |
