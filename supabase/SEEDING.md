# ApexOS Seeding

## Purpose

Define minimal seed data for local development and verification after Build 08 migrations.

Build 08 migrations create **schema only** — no seed data. This document specifies optional seed content for Build 09 and local testing.

## Seeding Strategy

| Approach | When |
|----------|------|
| SQL seed file (`supabase/seed.sql`) | Minimal foundation records for FK testing |
| Repository ingestion | Production path — sync from Git repo (Build 09) |
| Manual dashboard inserts | Ad-hoc testing |

Enable seeding in `config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

## Recommended Minimal Seed

Create one record per foundation type to validate FK chains:

### Executive

```sql
INSERT INTO executives (external_id, slug, display_name, summary)
VALUES ('EXE-001', 'primary-executive', 'Primary Executive', 'ApexOS system operator');
```

### Person

```sql
INSERT INTO persons (external_id, slug, display_name)
VALUES ('PER-001', 'jane-smith', 'Jane Smith');
```

### Relationship

```sql
INSERT INTO relationships (external_id, slug, title)
VALUES ('REL-001', 'exec-jane', 'Executive — Jane Smith');

INSERT INTO relationship_participants (relationship_id, person_id)
SELECT r.id, p.id
FROM relationships r, persons p
WHERE r.slug = 'exec-jane' AND p.slug = 'jane-smith';
```

### Situation

```sql
INSERT INTO situations (external_id, slug, title, situation_type, situation_summary)
VALUES (
  'SIT-001',
  'leadership-conflict-q2',
  'Q2 Leadership Conflict',
  'leadership-conflict',
  'Recurring leadership alignment challenge in Q2 planning cycle'
);
```

### Knowledge Source (metadata only)

```sql
INSERT INTO knowledge_sources (
  external_id, title, source, source_type, source_file_path, summary, status
) VALUES (
  'SRC-001',
  'Sample Leadership Transcript',
  'Internal management meeting',
  'transcript',
  'knowledge/source_material/transcripts/sample.vtt',
  'Sample source for pipeline testing',
  'active'
);
```

### Artifact Registry

Register each seed record:

```sql
INSERT INTO artifact_registry (external_id, title, architecture_layer, table_name, record_id, repository_path, status)
SELECT 'EXE-001', display_name, 'foundations', 'executives', id, 'foundations/README.md', 'active'
FROM executives WHERE slug = 'primary-executive';
-- Repeat for other seed records
```

## Pipeline Test Seed (Build 09)

Build 09 should seed a **complete minimal pipeline** from repository example artifacts:

1. Context relevance spec
2. Retrieval request + evidence package + assembled context package
3. Interpretation package
4. Recommendation package
5. Outcome capture + validation package

Use real markdown from `*/templates/` as starting points, populated with test content.

## What Not to Seed

- Production executive data without consent
- Credentials or API keys
- Large binary files (upload via Storage API separately)
- Embeddings or vector data

## Verification Queries

After seeding:

```sql
-- Foundation counts
SELECT 'executives' AS t, count(*) FROM executives
UNION ALL SELECT 'persons', count(*) FROM persons
UNION ALL SELECT 'situations', count(*) FROM situations;

-- Registry alignment
SELECT architecture_layer, count(*) FROM artifact_registry GROUP BY 1;

-- Link integrity
SELECT count(*) AS orphan_links
FROM artifact_links al
LEFT JOIN artifact_registry ar ON ar.record_id = al.target_id AND ar.table_name = al.target_table
WHERE ar.id IS NULL;
```

## Reset and Re-Seed

```bash
supabase db reset   # drops, migrates, seeds
```

## Related Documentation

- `INGESTION.md` — full repository sync
- `ENVIRONMENT.md` — connection configuration
- `IMPLEMENTATION-GUIDE.md` — deployment
