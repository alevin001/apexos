# Workflow: Context Assembly

Evaluate context domains, assign weights, and produce a relevance specification for retrieval handoff.

## Architecture Reference

- Context Architecture v1.0 — Context Domains, Context Weighting, Primary Output
- Retrieval Architecture v1.0 — Context determines relevance; retrieval assembles evidence
- AF-004, AF-005 — Context relevance and multi-signal weighting

## Prerequisites

- Situation intake completed via `situation-intake.md`
- Intake artifact exists in `situation/` with `status: draft`

## Steps

### 1. Complete domain evaluation

For each domain marked high or medium in intake scan:

1. Consult relevant `memory_references` and `knowledge_references`.
2. Document evaluation notes in the evaluation artifact or domain supplement.
3. Record domains intentionally excluded with rationale.

Use `templates/context-evaluation.md`. Extended domain analysis may create supplements in domain folders: `ctx-{domain}-{short-slug}.md`.

### 2. Assign domain weights

Copy `templates/context-weighting.md` alongside the evaluation artifact.

Apply weighting signals from `docs/context-weighting.md`:

| Weight | Criteria |
|--------|----------|
| critical | Must be understood before interpretation |
| supporting | Improves confidence and understanding |
| available | Useful but not immediately necessary |
| excluded | Evaluated and intentionally deprioritized |

Document rationale for every domain — especially excluded domains.

### 3. Produce relevance specification

Copy `templates/context-package.md` to `situation/`.

Rename: `ctx-pkg-{short-slug}.md`

Consolidate:

- Situation summary
- Domain weights and rationale
- Memory and knowledge references
- Retrieval tier intent (Critical / Supporting / Available)
- Handoff criteria and scope boundaries

Set evaluation artifact `status: active`.

### 4. Validate before handoff

Run `governance/context-fidelity-checklist.md`.

Resolve any failures before proceeding.

### 5. Hand off to retrieval

Create retrieval request using `retrieval/templates/retrieval-request.md`.

Link from context package: `retrieval_request: retrieval/requests/ret-{slug}.md`

Update context package `status: handed_off`.

Execute `retrieval/workflows/retrieval-pipeline.md`.

### 6. Update registry

Update `context/INDEX.md`:

- Context Evaluations table — add package artifact
- Mark intake status as `handed_off` or link to package

## Governance Checklist

- [ ] All evaluated domains have documented weights and rationale
- [ ] Excluded domains have documented rationale
- [ ] No evidence assembled in context artifacts
- [ ] No inference or recommendations in context artifacts
- [ ] Context fidelity checklist passed
- [ ] Retrieval request created and linked
- [ ] `INDEX.md` updated

## Do Not

- Assemble evidence — that is retrieval responsibility
- Override memory content in context artifacts
- Skip weighting and proceed directly to retrieval
- Hand off without fidelity checklist

## Next Steps

- Retrieval: `retrieval/workflows/retrieval-pipeline.md`
- After outcomes: `context-review.md`
