# ApexOS Storage Layout

## Overview

Supabase Storage holds binary source material and optional artifact exports. Metadata lives in Postgres (`knowledge_sources`).

## Buckets

| Bucket ID | Public | Size Limit | Purpose |
|-----------|--------|------------|---------|
| `knowledge-source-material` | No | 50 MB | Primary source documents from `knowledge/source_material/` |
| `apexos-artifacts` | No | 10 MB | Markdown/JSON exports, backups, interchange files |

Both buckets are **private**. Access requires authenticated Supabase session (see `SECURITY.md`).

## Object Path Convention

### Knowledge Source Material

```
knowledge-source-material/
  {source_type}/
    {external_id}/
      {original_filename}
```

Examples:

```
knowledge-source-material/transcript/SRC-001/jbl-management-meeting.vtt
knowledge-source-material/pdf/SRC-002/leadership-principles.pdf
knowledge-source-material/internal-document/SRC-003/q2-strategy-memo.docx
```

### Artifact Exports (optional)

```
apexos-artifacts/
  exports/
    {layer}/
      {external_id}.md
  backups/
    {YYYYMMDD}/
      registry.json
```

## Database Linkage

| Column | Table | Purpose |
|--------|-------|---------|
| `source_file_path` | `knowledge_sources` | Repository-relative path (Git) |
| `storage_object_path` | `knowledge_sources` | Supabase Storage object key |

Ingestion workflow:

1. Upload binary to Storage → get object path.
2. Insert/update `knowledge_sources` with `storage_object_path`.
3. Keep `source_file_path` aligned with Git repo for dual-source traceability.

## Allowed MIME Types

**knowledge-source-material:**

- `application/pdf`
- `text/plain`, `text/markdown`, `text/vtt`
- Word documents (`application/msword`, `.docx`)
- Images (`image/png`, `image/jpeg`, `image/webp`)

**apexos-artifacts:**

- `text/markdown`, `application/json`, `text/plain`

## Upload Operations

Use Supabase client or CLI:

```javascript
const { data, error } = await supabase.storage
  .from('knowledge-source-material')
  .upload('transcript/SRC-001/meeting.vtt', file, { upsert: false });
```

**Note:** Storage upsert requires INSERT + SELECT + UPDATE policies (all three are granted in migration `20250628120001`).

## Portability

Storage paths are convention-based, not Supabase-specific. To migrate off Supabase:

1. Export objects preserving path structure.
2. Update `storage_object_path` or replace with S3/GCS paths.
3. Metadata remains valid in Postgres.

## What Is Not Stored

- Pipeline artifact bodies — stored in `body_md` columns
- Embeddings or vectors — excluded by architecture
- Executive decision records — external references only (`executive_decision_reference` text field)

## Related Documentation

- `INGESTION.md` — upload workflow during repository sync
- `SECURITY.md` — storage RLS policies
- `knowledge/REPOSITORY-GUIDE.md` — source material organization
