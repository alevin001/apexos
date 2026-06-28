# Workflow: Contradictory Evidence

Seek and document contradictory evidence during retrieval assembly.

## Architecture Reference

- Retrieval Architecture v1.0 — Contradictory Evidence Principle (AF-008)
- `docs/contradictory-evidence.md`

## Prerequisites

- Evidence package created via `evidence-assembly.md`
- Retrieval request defines contradictory evidence plan

## Steps

### 1. Identify potential conflicts

Review assembled evidence for:

| Conflict type | Where to look |
|---------------|---------------|
| Memory conflicts | Different memory artifacts on same topic |
| Outcome contradictions | Outcome/results memory vs patterns or decisions |
| Framework competition | Multiple frameworks in `knowledge/frameworks/` |
| Source conflicts | Primary sources vs memory distillations |
| Assumption challenges | Evidence that challenges situation framing |

### 2. Search for contradictory evidence

Even when no conflicts are obvious:

| Search | Scope |
|--------|-------|
| Weakened patterns | `memory/pattern/` with weakening status |
| Contradictory outcomes | `memory/outcome-results/` |
| Alternative frameworks | `knowledge/frameworks/` |
| Low-confidence memory | Memory with reduced confidence |
| Retired or superseded sources | Source metadata status |

### 3. Document findings

Copy `templates/contradictory-evidence.md` to `evidence/`.

Rename: `ret-con-{short-slug}.md`

For each conflict:

- Describe supporting and contradictory sides
- Link source paths for both sides
- Record confidence levels
- Set `resolution_status: unresolved`
- Note impact on interpretation — do not resolve

If no conflicts found:

- Set `conflict_type: none_identified`
- Document search scope in record

### 4. Update evidence package

Add contradictory evidence section.

Link contradictory evidence record(s) in frontmatter.

If contradictory evidence requires context weight adjustment, set `context_review_needed` in review — do not adjust silently.

### 5. Register

Add to `retrieval/INDEX.md` if separate record created.

## Governance Checklist

- [ ] Contradictory evidence search completed
- [ ] Conflicts documented with both sides and source paths
- [ ] Absence documented with search scope if none found
- [ ] No conflict resolution in retrieval — inference responsibility
- [ ] Evidence package updated with contradictory section

## Do Not

- Omit contradictory evidence when conflicts exist
- Resolve conflicts during retrieval
- Assume absence without documented search
- Hide contradictory evidence within tier sections only

## Next Step

`retrieval-validation.md`
