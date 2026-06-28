# Workflow: Situation Intake

Capture situation definition and initial domain scan — the entry point for all context evaluation.

## Architecture Reference

- Context Architecture v1.0 — Situation-Centered Context Model
- Foundations Architecture v1.0 — Situation object
- LAD-006 — Context exists to determine relevance, not store information

## Prerequisites

- Executive presents a leadership challenge, decision, or interaction requiring assistance
- No prior context evaluation exists for this situation, or a new evaluation supersedes a prior one

## Steps

### 1. Define the situation

Document:

| Field | Content |
|-------|---------|
| Situation type | Leadership disagreement, strategic decision, negotiation, etc. |
| Stakes | What outcomes are affected? |
| Time sensitivity | Urgency and decision timeline |
| Key individuals | People central to the situation |
| Initial scope | What the executive is asking for |

Do not infer conclusions, hypotheses, or recommendations.

### 2. Scan context domains

Identify which domains may be relevant:

| Domain | Initial relevance (high / medium / low / unknown) |
|--------|---------------------------------------------------|
| Situation | |
| Executive | |
| Person | |
| Relationship | |
| Organizational | |
| Strategic | |
| Pattern | |
| Outcome/Results | |

This is a scan — not final weighting.

### 3. Identify reference material

List memory and knowledge artifacts that may inform relevance evaluation:

| Type | Path | Why potentially relevant |
|------|------|--------------------------|
| Memory | | |
| Knowledge | | |

Do not duplicate content — record paths only.

### 4. Create intake artifact

Copy `templates/context-evaluation.md` to `situation/`.

Rename: `ctx-sit-{short-slug}.md`

Complete required frontmatter: `title`, `situation_summary`, `evaluation_date`, `domains_evaluated`.

Set `status: draft`.

### 5. Register the artifact

Add entry to `context/INDEX.md` under Active Situation Context.

Assign an ID (e.g., `CTX-SIT-001`).

## Governance Checklist

- [ ] Situation defined without inference or recommendations
- [ ] Domain scan completed — not final weights
- [ ] Memory and knowledge referenced by path — not duplicated
- [ ] Entry added to `INDEX.md`
- [ ] Status set to `draft`

## Do Not

- Store distilled intelligence in the intake artifact
- Assign final domain weights without `context-assembly.md`
- Hand off to retrieval without completed evaluation and weighting
- Produce recommendations or decision support

## Next Step

Proceed to `context-assembly.md` for domain evaluation, weighting, and retrieval handoff specification.
