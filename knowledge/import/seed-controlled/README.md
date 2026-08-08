# Controlled seed set — Build 18

Small, deliberate fixtures for dry-run and approved ingestion.

**Do not ingest silently.** Review a dry-run report first:

```powershell
cd runtime
npm run knowledge:ingest -- --dry-run --path ../knowledge/import/seed-controlled
```

Approved execute:

```powershell
cd runtime
npm run knowledge:ingest -- --execute --path ../knowledge/import/seed-controlled
```

Architecture `.docx` / diagram files under `architecture/` are **not** auto-included here. To seed those deliberately, use a manifest after dry-run review (see `architecture-seed.manifest.example.json`).
