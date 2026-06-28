# Workflow: Package Delivery

Assemble and deliver the Context Package to inference.

## Architecture Reference

- Retrieval Architecture v1.0 — Context Package Assembly, Retrieval Output
- Inference Architecture v1.0 — Inference operates upon assembled evidence
- `docs/context-package-assembly.md`

## Prerequisites

- Retrieval validation passed
- Evidence package and contradictory evidence records complete
- Retrieval request `validation_status: passed`

## Steps

### 1. Create Context Package

Organize evidence package into tier structure in `context-package/`.

Naming: `ret-pkg-{short-slug}.md`

Structure:

1. Package summary — what inference can address
2. Critical Context — tier content from evidence package
3. Supporting Context — tier content
4. Available Context — tier content
5. Contradictory Evidence — cross-cutting section
6. Gaps and limitations — from evidence package
7. Traceability — links to request, evidence package, context reference

Use frontmatter from `REPOSITORY-GUIDE.md`:

- `id` (e.g., `RET-PKG-001`)
- `context_reference`, `retrieval_request`, `evidence_package`
- `status: delivered`

### 2. Final fidelity check

Re-run critical items from `governance/retrieval-fidelity-checklist.md`:

- No inference or recommendations in package
- All items have source paths
- Contradictory evidence section present

### 3. Link in retrieval request

Update retrieval request:

- `context_package: retrieval/context-package/ret-pkg-{slug}.md`
- `status: delivered`

### 4. Register delivery

Update `retrieval/INDEX.md` under Context Packages (Assembled).

### 5. Hand off to inference

Provide Context Package path to inference layer.

Document handoff date in package artifact.

**Inference is a separate layer.** Do not perform interpretation in this workflow.

### 6. Schedule post-inference review

When inference completes or outcomes are available:

- Re-run `retrieval-validation.md` as review
- Trigger context review if relevance gaps identified

## Governance Checklist

- [ ] Context Package tier structure matches context specification
- [ ] Contradictory evidence section included
- [ ] Gaps documented
- [ ] No inference in package
- [ ] Retrieval request and INDEX updated
- [ ] Handoff to inference documented

## Do Not

- Deliver without passed validation
- Modify context specification during delivery
- Include recommendations or decision support
- Silently add evidence after delivery — create new retrieval request instead

## Next Step

Inference layer (Build 05). After outcomes: retrieval review and optional context review.
