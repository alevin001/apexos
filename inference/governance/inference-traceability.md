# Inference Traceability

Traceability requirements for inference layer artifacts.

## Architecture Reference

- Inference Architecture v1.0 — Inferential Transparency Principle, Governance Controls
- Governance Architecture v1.0 — Transparency Principle
- Retrieval Architecture v1.0 — Context Package traceability chain

## Purpose

Maintain explainability for why interpretations were reached, what evidence was considered, and how confidence was assessed. Sufficient transparency to support trust, validation, and improvement — not perfect explainability.

## Traceability Chain

```
Context relevance specification
  → Retrieval request
    → Evidence package
      → Context Package
        → Inference component artifacts
          → Interpretation Package
            → Recommendation (future)
              → Outcomes (validation)
```

Every inference artifact must link backward through this chain.

## Frontmatter Traceability Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID |
| `context_package` | Yes | Link to assembled Context Package |
| `retrieval_request` | Recommended | Link to retrieval request |
| `context_reference` | Recommended | Link to context relevance specification |
| `component_artifacts` | Interpretation Package | Links to all component artifacts |
| `related_interpretation` | Component artifacts | Link to parent Interpretation Package |
| `confidence_summary` | Interpretation Package | Overall confidence with rationale |
| `uncertainty_flags` | Recommended | Active uncertainty indicators |
| `review_status` | Recommended | Review outcome |
| `transformation_log` | When derived | Record of interpretation changes |

## Evidence Traceability

Inference references evidence — it does not duplicate it:

1. Every evidence reference links to source path in Context Package
2. Context Package items link to `knowledge/` or `memory/` paths
3. No inference artifact contains duplicated source content
4. Evidence strength and reliability notes preserved from assessment

## Component Artifact Traceability

| Component | Links to | Registered in |
|-----------|----------|-----------------|
| Evidence assessment | Context Package | `INDEX.md` Component Artifacts |
| Assumption register | Context Package, evidence assessment | Same |
| Blind spot review | Context Package, evidence assessment | Same |
| Hypothesis evaluation | Context Package, evidence assessment | Same |
| Confidence assessment | All prior components | Same |
| Competing interpretations | Assumption register, blind spot review | Same |
| Interpretation Package | All components | `INDEX.md` Interpretation Packages |

## Category Traceability

Each category must remain traceable and distinguishable in artifacts:

| Category | Traceability requirement |
|----------|-------------------------|
| Evidence | Source path from Context Package |
| Findings | Link to supporting evidence paths and confidence |
| Hypotheses | Link to supporting/contradicting evidence; status tracked |
| Assumptions | Link to validation requirements and evidence |
| Unknowns | Link to evidence gaps or unresolved competition |
| Risks / Opportunities | Link to evidence support and confidence |

## Outcome Traceability

When outcome evidence becomes available:

1. Create inference review artifact: `{package-basename}.review.md`
2. Link to outcome evidence in `outcomes/`
3. Update `review_status` on Interpretation Package
4. Register in `INDEX.md` Inference Reviews
5. Trigger confidence recalibration if warranted

## Transformation Log

Record in `transformation_log` when:

- Interpretation Package materially updated
- Category reclassification performed
- Confidence recalibrated after review
- Component artifact superseded
- Post-outcome adjustment made

Format:

```yaml
transformation_log:
  - date: YYYY-MM-DD
    action: recalibrated_confidence | reclassified_finding | superseded_by
    rationale: brief explanation
    reviewer: optional
```

## Cross-Layer References

| Layer | Traceability document |
|-------|----------------------|
| Context | `context/docs/context-traceability.md` |
| Retrieval | `retrieval/docs/retrieval-traceability.md` |
| Inference | This document |
| Governance | `governance/traceability/README.md` |
| Source fidelity | `governance/source-fidelity/inference-layer.md` |

## Registry Requirements

Update `inference/INDEX.md` when:

- Creating any inference artifact
- Completing component artifacts
- Completing Interpretation Package
- Handing off to recommendation
- Creating inference review
- Archiving artifacts

Do not duplicate content in registry — index only.
