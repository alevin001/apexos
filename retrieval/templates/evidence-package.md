---
# Evidence Package
# Naming: ret-evd-{short-slug}.md
# Layer: Retrieval — assembled evidence before Context Package creation

id:                          # e.g. RET-EVD-001
title:                       # required
assembly_date:               # YYYY-MM-DD
status: assembled
retrieval_request:           # required — path to retrieval request
context_reference:           # required — path to context specification
assembly_tiers:
  critical: []               # artifact paths with relevance notes
  supporting: []
  available: []
contradictory_evidence: []   # links to contradictory evidence records
exclusions: []                # artifacts considered but excluded — with rationale
gaps: []                      # expected evidence not found
transformation_log: []
---

# {title}

## Assembly Summary

<!-- What evidence was assembled? Smallest effective set achieved? -->

## Critical Context Evidence

| Artifact | Source path | Relevance | Confidence |
|----------|-------------|-----------|------------|
| | | | |

## Supporting Context Evidence

| Artifact | Source path | Relevance | Confidence |
|----------|-------------|-----------|------------|
| | | | |

## Available Context Evidence

| Artifact | Source path | Relevance | Confidence |
|----------|-------------|-----------|------------|
| | | | |

## Contradictory Evidence

<!-- Link to contradictory-evidence artifact or inline summary with source paths. -->

## Alternative Perspectives

| Perspective | Source path | Notes |
|-------------|-------------|-------|
| | | |

## Exclusions

<!-- Artifacts considered but not included — and why. -->

| Artifact | Source path | Reason excluded |
|----------|-------------|-----------------|
| | | |

## Gaps

<!-- Expected evidence not found. Impact on inference readiness. -->

| Expected evidence | Search scope | Impact |
|-------------------|--------------|--------|
| | | |

## Ranking Rationale

<!-- How ranking signals were applied within tiers. -->

## Traceability

| Field | Value |
|-------|-------|
| Retrieval request | |
| Context reference | |
| Contradictory evidence records | |

## Assembly Checklist

- [ ] All items link to source paths — no duplicated content
- [ ] Tiers match context specification
- [ ] Contradictory evidence sought and documented
- [ ] Exclusions documented
- [ ] Gaps documented
