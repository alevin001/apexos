# Context Lifecycle

Stages of a context evaluation from situation intake through archive.

## Architecture Reference

- Context Architecture v1.0 (DOC-004) — Context Lifecycle
- Retrieval Architecture v1.0 (DOC-005) — Handoff to retrieval

## Lifecycle Stages

```
Situation Intake → Domain Evaluation → Context Weighting → Context Evaluation → Handoff to Retrieval → Context Review → Refresh or Archive
```

| Stage | Workflow | Output | Status |
|-------|----------|--------|--------|
| Situation intake | `situation-intake.md` | Situation definition, initial domain scan | `draft` |
| Domain evaluation | `context-assembly.md` | Domain-specific evaluation supplements | `active` |
| Context weighting | `context-assembly.md` | Documented weights per domain | `active` |
| Context evaluation | `context-assembly.md` | Relevance specification | `active` |
| Handoff to retrieval | `context-assembly.md` → `retrieval/workflows/retrieval-pipeline.md` | Linked retrieval request | `handed_off` |
| Context review | `context-review.md` | Review record after outcomes or retrieval | `under_review` |
| Refresh | `context-refresh.md` | Updated evaluation for evolved situation | `active` |
| Archive | `context-review.md` | Completed evaluation retained for traceability | `archived` |

## Stage Details

### Situation Intake

Capture what the executive needs assistance with. Identify situation type, stakes, and time sensitivity. Do not infer conclusions or recommendations.

### Domain Evaluation

Evaluate relevant context domains. Extended analysis may produce domain supplements in domain folders. Reference memory and knowledge — do not duplicate content.

### Context Weighting

Assign weights using signals defined in `context-weighting.md`. Document rationale for each weight and exclusion.

### Context Evaluation

Consolidate intake, domain evaluation, and weighting into a relevance specification. Ready for retrieval handoff.

### Handoff to Retrieval

Create retrieval request linked from context evaluation. Context layer responsibility ends at relevance specification — retrieval assembles evidence.

### Context Review

After inference, recommendation, action, or outcome — review whether context relevance decisions were effective. Update weights or archive.

### Refresh

When a situation evolves but is not complete, refresh the evaluation rather than creating an orphan duplicate. Log changes in `transformation_log`.

### Archive

Mark completed evaluations as `archived` in `INDEX.md`. Retain for traceability — context artifacts are not memory and do not promote to memory without the memory promotion workflow.

## Status Transitions

```
draft → active → handed_off → under_review → archived
                    ↓
                 active (refresh)
```

Invalid transitions:

- `draft` → `handed_off` without evaluation and weighting
- `archived` → `active` without refresh workflow and documented rationale

## Registry Updates

Update `context/INDEX.md` at every status transition.

## Distinction from Memory Lifecycle

| Context lifecycle | Memory lifecycle |
|-------------------|------------------|
| Situation-specific, transient | Retained distilled intelligence |
| Archive after situation resolves | Active until weakened or retired |
| Does not promote to memory automatically | Promotes through observation → memory → pattern |

If context evaluation produces insights worth retaining, create an observation via `memory/workflows/create-observation.md` — do not store distilled intelligence in context artifacts.
