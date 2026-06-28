# Knowledge Workflows

Step-by-step workflows for operating the Knowledge Layer. These are manual, founder-buildable processes — not application code.

## Workflows

| Workflow | Purpose |
|----------|---------|
| `add-knowledge-source.md` | Add a primary source document to `source_material/` |
| `add-framework.md` | Add a framework artifact to `frameworks/` |
| `add-reference.md` | Add derived reference material to `reference/` |
| `migrate-legacy-materials.md` | Migrate content from `docs/knowledge base/` |

## General Rules

1. Reference architecture documents before adding content.
2. Update `INDEX.md` after every addition or change.
3. Preserve source fidelity (LAD-010, LAD-011).
4. Do not store distilled memory in `knowledge/` — use `memory/workflows/` (Build 03 complete).
5. Do not duplicate Charter doctrine — reference it from `doctrine/` indices.

## AI-Assisted Development

These workflows are designed for AI-assisted execution in Cursor:

- Provide the workflow file and target content to the agent.
- Require the agent to use templates and update `INDEX.md`.
- Review all derived content for fidelity and visible transformation.
