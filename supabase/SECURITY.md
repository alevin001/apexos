# ApexOS Security Model

## Overview

Build 08 implements Row Level Security (RLS) on all ApexOS tables and storage buckets. The MVP assumes a **single executive operator** with authenticated access.

## Threat Model (MVP)

| Threat | Mitigation |
|--------|------------|
| Anonymous API access to data | RLS enabled; `anon` role revoked on public tables |
| Unauthenticated storage access | Private buckets; storage RLS requires `authenticated` |
| Service key exposure | Never use `service_role` in client code |
| User-editable JWT claims | Do not use `user_metadata` for authorization |
| Cross-tenant data leak | Single-tenant MVP; multi-tenant RLS deferred to future build |

## Database RLS

All 31 ApexOS tables have RLS **enabled**.

### Policy Model

For each table, four policies grant full CRUD to the `authenticated` role:

- `apexos_authenticated_select`
- `apexos_authenticated_insert`
- `apexos_authenticated_update`
- `apexos_authenticated_delete`

This is appropriate for single-executive MVP. Build 10+ may introduce:

- `executive_id` column on all tables
- Policies: `USING (executive_id = auth.uid())` or org-based claims in `app_metadata`

### Role Grants

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Service Role

Server-side ingestion and admin operations use `service_role`, which bypasses RLS. Restrict service role key to:

- CI/CD ingestion pipelines
- Local development scripts
- Never expose in frontend or mobile clients

## Storage RLS

Policies on `storage.objects` for buckets:

- `knowledge-source-material`
- `apexos-artifacts`

Authenticated users may SELECT, INSERT, UPDATE, DELETE objects in these buckets.

## Application-Layer Security (Build 09+)

Database RLS does not enforce:

- **Historical integrity** — terminal-status rows must not be updated (application enforced)
- **Category separation** — recommendations ≠ decisions (application enforced)
- **Append-only transformation_log** — application must append, not replace

These align with governance docs (`outcomes/governance/historical-integrity.md`).

## Auth Configuration

Local defaults in `config.toml`:

- Auth enabled
- Email signup enabled
- Confirmations disabled (local dev convenience)

Production: enable email confirmations; configure SMTP in Supabase dashboard.

## Security Checklist (Build 08)

- [x] RLS enabled on all public tables
- [x] Storage buckets private
- [x] Storage RLS policies for authenticated role
- [x] Anonymous access revoked on tables
- [x] No `security definer` functions in public schema
- [x] No triggers (reduces hidden privilege escalation paths)
- [x] Service role not referenced in repository code

## Future Hardening

| Item | Build |
|------|-------|
| Executive-scoped RLS | Post-MVP multi-user |
| Immutable status enforcement via application middleware | Build 09 |
| Audit log table for all writes | Build 10 |
| API rate limiting | Application layer |
| Storage signed URLs with expiry | Application layer |

## References

- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- `governance/README.md` — governance architecture
- Supabase skill security checklist (Cursor Supabase plugin)
