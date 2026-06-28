# Workflow: Retrieval Pipeline

End-to-end retrieval from context handoff through Context Package delivery.

## Architecture Reference

- Retrieval Architecture v1.0 — Retrieval Flow
- Context Architecture v1.0 — Context determines relevance
- LAD-007 — Retrieval executes context relevance determinations

## Prerequisites

- Context relevance specification completed via `context/workflows/context-assembly.md`
- Context fidelity checklist passed
- Context package artifact exists with `status: handed_off`

## Steps

### 1. Create retrieval request

Copy `templates/retrieval-request.md` to `requests/`.

Rename: `ret-req-{short-slug}.md`

Populate from context specification:

- `context_reference` — link to context package
- `tier_requirements` — from context domain weights
- `retrieval_targets` — knowledge, memory, pattern, evidence
- `scope_summary` and `exclusions`

Set `status: draft`.

Register in `retrieval/INDEX.md`. Assign ID (e.g., `RET-REQ-001`).

### 2. Run evidence-first checklist

Execute `governance/evidence-first-checklist.md`.

Do not proceed if checklist fails.

### 3. Assemble evidence

Execute `evidence-assembly.md`.

Link `evidence_package` in retrieval request.

Set request `status: in_progress` → `assembled`.

### 4. Process contradictory evidence

Execute `contradictory-evidence-workflow.md`.

Link contradictory evidence records in evidence package.

### 5. Validate assembly

Execute `retrieval-validation.md`.

Set `validation_status` on request.

### 6. Deliver Context Package

Execute `package-delivery.md`.

Link `context_package` in retrieval request.

Set request `status: delivered`.

### 7. Hand off to inference

Deliver Context Package path to inference layer.

Document delivery in package artifact.

Do not begin inference within this workflow — inference is a separate layer.

## Governance Checklist

- [ ] Retrieval request linked to context specification
- [ ] Evidence-first checklist passed
- [ ] Evidence assembled with source paths
- [ ] Contradictory evidence processed
- [ ] Validation passed
- [ ] Context Package delivered
- [ ] `INDEX.md` updated at each stage

## Do Not

- Override context tier requirements without context review
- Skip contradictory evidence workflow
- Deliver package without validation
- Include inference or recommendations in retrieval artifacts

## Next Steps

- Inference: `inference/workflows/interpretation-workflow.md`
- After outcomes: `retrieval-validation.md` review cycle
- If relevance gaps found: `context/workflows/context-review.md`
