# ApexOS Executive Scenarios

Runnable end-to-end scenarios for validating the executive operating loop.

## Available Scenarios

| Scenario | Path | Description |
|----------|------|-------------|
| Q2 Leadership Conflict | `leadership-conflict-q2/` | Full pipeline from situation through learning |

## Running a Scenario

```bash
cd scripts
npm install
npm run loop:scenario
```

Or ingest only:

```bash
npm run ingest:scenario
```

## Scenario Structure

Each scenario contains:

- `manifest.json` — ingestion order (respects FK dependencies)
- `foundations/` — executive, persons, relationships, situations
- `knowledge/` — source material and metadata
- `memory/` — distilled intelligence
- `context/` — relevance specifications
- `retrieval/` — requests, evidence, assembled context
- `inference/` — interpretation packages and components
- `recommendation/` — recommendation packages and components
- `outcomes/` — captures, validation, learning
- `INDEX.md` — artifact registry for the scenario

## Adding Scenarios

1. Copy `leadership-conflict-q2/` structure
2. Update `manifest.json` ingestion order
3. Assign unique external IDs (e.g. `CTX-PKG-002`)
4. Maintain FK chain in frontmatter references
5. Run `npm run ingest -- --scenario your-scenario-slug`

See `INGESTION-FLOW.md` for ingestion details.
