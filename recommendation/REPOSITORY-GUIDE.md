# Recommendation Repository Guide

Build 06 implementation guide for the ApexOS Recommendation Layer.

## Purpose

This guide translates Recommendation Architecture v1.0 into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Executive agency, doctrine supremacy |
| Inference Architecture v1.0 (DOC-007) | Interpretation Package handoff |
| Governance Architecture v1.0 (DOC-006) | Fidelity, transparency, no silent transformation |
| Recommendation Architecture v1.0 (DOC-008) | Recommendation Model, Recommendation Outputs, Governance Controls |
| Architecture & Doctrine Index v2.0 | LAD-014, LAD-015, AF-014 |

## Design Intent

The Recommendation Layer transforms interpretation into defensible decision support.

```
Inference answers:       What conclusions are most supported by that evidence?
Recommendation answers:  What actions are most supported by that interpretation?
```

Recommendation exists to improve executive decision-making while preserving executive agency, uncertainty awareness, and continuous learning (AF-014). The objective is informed, transparent, doctrine-aligned decision support — not instructions or autonomous decisions.

## Recommendation Model

```
Interpretation Package → Objective Alignment → Option Generation → Doctrine Evaluation → Risk Evaluation → Opportunity Evaluation → Tradeoff Analysis → Confidence Assessment → Recommendation Formation → Executive Decision Support
```

Inference produces interpretation. Recommendation produces decision support. Recommendation should occur after inference. Recommendation operates upon the Interpretation Package rather than re-performing inference (LAD-013, DOC-008).

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `recommendation/decision-support/` | Recommendation Packages — primary output | Executive decisions |
| `recommendation/options/` | Option generation artifacts | Interpretation or evidence |
| `recommendation/recommendations/` | Primary and alternative recommendation artifacts | Validated outcomes |
| `recommendation/tradeoffs/` | Tradeoff analysis artifacts | Tradeoff elimination |
| `recommendation/templates/` | Artifact templates | Live recommendation content |
| `recommendation/workflows/` | Step-by-step operational workflows | Automated scripts |
| `recommendation/governance/` | Layer-specific fidelity and boundary controls | Cross-layer governance (see `governance/`) |

## Recommendation Responsibilities

Recommendation is limited to:

| Responsibility | Implementation |
|----------------|----------------|
| Objective alignment | `workflows/objective-alignment-workflow.md`, `templates/objective-alignment-template.md` |
| Option generation | `workflows/option-generation-workflow.md`, `templates/option-generation-template.md` |
| Doctrine evaluation | `workflows/doctrine-evaluation-workflow.md`, `templates/doctrine-evaluation-template.md` |
| Risk evaluation | `templates/risk-assessment-template.md`, `workflows/recommendation-workflow.md` |
| Opportunity evaluation | `templates/opportunity-assessment-template.md`, `workflows/recommendation-workflow.md` |
| Tradeoff analysis | `workflows/tradeoff-analysis-workflow.md`, `templates/tradeoff-analysis-template.md` |
| Recommendation confidence | `workflows/recommendation-confidence-workflow.md`, `templates/recommendation-confidence-template.md` |
| Recommendation package | `templates/recommendation-package-template.md`, `decision-support/` |
| Executive decision support | Recommendation Package delivery |

Recommendation does **not** perform inference, reinterpret evidence, validate outcomes, or make executive decisions.

## Category Separation

Recommendation must distinguish between categories — they are not interchangeable:

| Category | Definition | Location |
|----------|------------|----------|
| Evidence | Directly supported retrieved information | Referenced from Interpretation Package — not duplicated |
| Findings | Conclusions strongly supported by evidence | Referenced from Interpretation Package |
| Hypotheses | Plausible explanations not yet validated | Referenced from Interpretation Package |
| Assumptions | Provisional beliefs when information is incomplete | Referenced and carried forward — not hidden |
| Unknowns | Questions evidence cannot currently answer | Referenced from Interpretation Package |
| Recommendations | Potential courses of action supported by interpretation | Recommendation Package and component artifacts |
| Decisions | Executive choices | Outside ApexOS — not in recommendation artifacts |

## Core Principles

### Executive Agency (LAD-014, AF-014)

The executive remains responsible for decisions. ApexOS functions as an executive companion and decision-support system, not an autonomous decision-making system.

### Operates Upon Interpretation (DOC-008)

Recommendation operates upon the Interpretation Package. Recommendation should not re-perform inference or reinterpret evidence.

### Doctrine Supremacy

Recommendations should be evaluated against Charter doctrine. Doctrine influences recommendation quality and confidence.

### Cause-And-Effect Transparency

Recommendations must explain expected benefits, expected risks, supporting evidence, underlying assumptions, expected consequences, and confidence — not simply state "Do X."

### Recommendation Confidence Independence

Recommendation confidence is evaluated independently from inference confidence. A recommendation may have lower confidence than the underlying finding.

### Outcome-Oriented Without Validation

Recommendation may identify outcome tracking considerations. Outcome capture and validation remain the responsibility of `outcomes/`.

### Uncertainty Is Valid

When information is insufficient, ApexOS may conclude that recommendation confidence is low, multiple options are equally viable, or additional evidence is required. Transparency over unsupported certainty.

## Recommendation Flow

```
Interpretation Package (inference) → Objective Alignment → Option Generation → Doctrine Evaluation → Risk Assessment → Opportunity Assessment → Tradeoff Analysis → Recommendation Confidence → Recommendation Package → Executive Decision Support
```

Execute via `workflows/recommendation-workflow.md`. Individual workflows may run as focused reviews within the pipeline.

## Primary Output

The **Recommendation Package** containing:

- Objective assessment
- Primary recommendation
- Alternative recommendations
- Doctrine alignment assessment
- Risk assessment
- Opportunity assessment
- Tradeoff analysis
- Supporting evidence
- Supporting findings
- Assumptions
- Confidence assessment
- Expected consequences
- Uncertainty assessment
- Outcome tracking considerations

Template: `templates/recommendation-package-template.md`  
Location: `decision-support/`

## Recommendation Structures (Repository Conventions)

Portable markdown structures with YAML frontmatter. Build 08 may map these fields to database columns without changing logical structure.

### Common Fields (All Recommendation Artifacts)

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID (e.g., `REC-PKG-001`) |
| `title` | Yes | Human-readable title |
| `recommendation_date` | Yes | YYYY-MM-DD |
| `status` | Yes | `draft` \| `in_progress` \| `complete` \| `under_review` \| `delivered` \| `archived` |
| `interpretation_package` | Yes | Link to Interpretation Package from `inference/interpretation/` |
| `context_package` | Recommended | Link for full traceability chain |
| `retrieval_request` | Recommended | Link to retrieval request |
| `context_reference` | Recommended | Link to context relevance specification |
| `component_artifacts` | When applicable | Links to objective alignment, options, doctrine evaluation, etc. |
| `confidence_summary` | When complete | Overall recommendation confidence with rationale |
| `uncertainty_flags` | Recommended | insufficient_information, low_confidence, equally_viable_options, etc. |
| `review_status` | Recommended | `pending` \| `confirmed` \| `adjusted` \| `superseded` |
| `transformation_log` | When derived | Record of recommendation changes |

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Recommendation Package | `decision-support/` | `rec-pkg-{short-slug}.md` | `rec-pkg-leadership-conflict-q2.md` |
| Objective alignment | `decision-support/` | `rec-obj-{short-slug}.md` | `rec-obj-leadership-conflict-q2.md` |
| Option generation | `options/` | `rec-opt-{short-slug}.md` | `rec-opt-leadership-conflict-q2.md` |
| Doctrine evaluation | `recommendations/` | `rec-doc-{short-slug}.md` | `rec-doc-leadership-conflict-q2.md` |
| Risk assessment | `recommendations/` | `rec-rsk-{short-slug}.md` | `rec-rsk-leadership-conflict-q2.md` |
| Opportunity assessment | `recommendations/` | `rec-opp-{short-slug}.md` | `rec-opp-leadership-conflict-q2.md` |
| Tradeoff analysis | `tradeoffs/` | `rec-trd-{short-slug}.md` | `rec-trd-leadership-conflict-q2.md` |
| Recommendation confidence | `decision-support/` | `rec-con-{short-slug}.md` | `rec-con-leadership-conflict-q2.md` |
| Recommendation review | Same folder as package | `{package-basename}.review.md` | `rec-pkg-leadership-conflict-q2.review.md` |

## ID Conventions

| Prefix | Type |
|--------|------|
| `REC-PKG-` | Recommendation Package |
| `REC-OBJ-` | Objective alignment |
| `REC-OPT-` | Option generation |
| `REC-DOC-` | Doctrine evaluation |
| `REC-RSK-` | Risk assessment |
| `REC-OPP-` | Opportunity assessment |
| `REC-TRD-` | Tradeoff analysis |
| `REC-CON-` | Recommendation confidence |
| `REC-REV-` | Recommendation review |

## Registry

`recommendation/INDEX.md` is the human-readable registry of recommendation artifacts. Update it when creating, completing, reviewing, delivering to executive, or archiving content.

## Traceability Requirements

Every recommendation artifact must remain traceable:

1. **To inference:** Link `interpretation_package` to handed-off Interpretation Package.
2. **To retrieval:** Link `context_package` for full evidence chain.
3. **To context:** Link `context_reference` to context relevance specification.
4. **To evidence:** Reference source paths through Interpretation Package — do not duplicate evidence content.
5. **To components:** Link component artifacts in Recommendation Package.
6. **To outcomes:** Update via recommendation review when outcome evidence is available.

See `governance/recommendation-traceability.md`, `governance/traceability/README.md`, and `governance/source-fidelity/recommendation-layer.md`.

## Governance Requirements

All recommendation artifacts are subject to:

- **LAD-014, AF-014** — Executive agency preserved; recommendations support judgment
- **LAD-015** — Recommendations subject to future outcome validation
- **LAD-010, LAD-011** — Fidelity preservation; no silent transformation
- **Evidence First** — Recommendations grounded in evidence and interpretation
- **Doctrine Supremacy** — Recommendations aligned with Charter doctrine
- **Perspective Neutrality (CP-008)** — Competing perspectives evaluated fairly
- **Recommendation drift monitoring** — Recommendations becoming decisions or unsupported certainty (Governance Architecture)

See `recommendation/governance/` and `governance/source-fidelity/recommendation-layer.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `inference/` | Provides Interpretation Package — recommendation does not re-perform inference |
| `retrieval/` | Evidence chain through Context Package — recommendation does not assemble evidence |
| `context/` | Relevance determined upstream — recommendation does not redefine relevance |
| `knowledge/` | Doctrine referenced for evaluation — not duplicated |
| `memory/` | Historical learning referenced through interpretation — not re-validated in recommendation |
| `outcomes/` | Validates recommendations — recommendation identifies tracking considerations only |
| `governance/` | Recommendation drift detection, fidelity, review controls |

## Distinctions

| Concept | Location | Role |
|---------|----------|------|
| Interpretation Package | `inference/interpretation/` | Input to recommendation |
| Synthesized interpretation | Interpretation Package | Not a recommendation |
| Recommendation Package | `recommendation/decision-support/` | Decision support for executive |
| Executive decision | Outside ApexOS | Not stored as recommendation |
| Outcome validation | `outcomes/` | Not performed in recommendation |
| Inference risks/opportunities | Interpretation Package | Evidence-based identification — recommendation evaluates action implications |

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 06 | Recommendation layer artifacts | Complete |
| Build 07 | Outcome layer artifacts | Complete |
| Build 08 | Supabase / portable data structures | Pending |
