# Evidence Assembly

Rules and structure for assembling evidence before Context Package creation.

## Architecture Reference

- Retrieval Architecture v1.0 (DOC-005) — Evidence Assembly Principle
- Governance Architecture v1.0 (DOC-006) — Evidence First Principle (LAD-008)

## Purpose

Assemble the evidence required for interpretation — reducing confirmation bias, executive blind spots, organizational blind spots, and system drift.

Evidence assembly occurs in `retrieval/evidence/` before Context Package creation in `retrieval/context-package/`.

## Evidence Types

| Type | Description | Required when |
|------|-------------|---------------|
| Supporting evidence | Artifacts that support understanding the situation | Always |
| Contradictory evidence | Artifacts that challenge initial assumptions | Conflicts exist or are plausible |
| Alternative perspectives | Different interpretations of the same evidence | Multiple valid viewpoints exist |
| Competing interpretations | Frameworks or patterns that suggest different approaches | Strategic or decision situations |

See `contradictory-evidence.md` for contradictory evidence requirements.

## Assembly Process

```
Retrieval request
        ↓
Locate artifacts (knowledge/, memory/)
        ↓
Rank within context tiers
        ↓
Assemble evidence package
        ↓
Include contradictory evidence
        ↓
Validate assembly
        ↓
Create Context Package
```

Execute via `../workflows/evidence-assembly.md`.

## Evidence Package Structure

Use `../templates/evidence-package.md`:

| Section | Content |
|---------|---------|
| Supporting evidence | Ranked artifact list with source paths |
| Contradictory evidence | Challenges and conflicts |
| Alternative perspectives | Competing viewpoints |
| Assembly rationale | Why each artifact was included |
| Exclusions | What was considered but excluded and why |

## Source Paths

Every evidence item must link to a source path:

| Source type | Path pattern |
|-------------|--------------|
| Knowledge source | `knowledge/source_material/{type}/` + metadata |
| Framework | `knowledge/frameworks/` |
| Reference | `knowledge/reference/` |
| Memory artifact | `memory/{category}/` |
| Pattern | `memory/pattern/` |

Do not duplicate source content in evidence packages — link and summarize relevance only.

## Tier Assignment

Map evidence to Context Package tiers based on context domain weights:

| Context weight | Evidence tier |
|----------------|---------------|
| critical | Critical Context |
| supporting | Supporting Context |
| available | Available Context |

Retrieval ranking (see `retrieval-ranking.md`) orders artifacts within each tier.

## Quality Rules

- Prefer primary sources over derived reference when traceability matters
- Include memory artifacts by reference — not duplicated content
- Mark confidence levels from source artifact frontmatter
- Flag gaps where expected evidence was not found
- Document search scope — what was searched and what was not

## Evidence First

Maximize evidence quality before Context Package delivery. Do not deliver packages with known critical gaps without documenting them explicitly.

Inference must not begin before evidence assembly is complete and validated.
