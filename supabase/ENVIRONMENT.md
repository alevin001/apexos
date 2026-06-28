# ApexOS Environment Configuration

## Overview

Environment variables and Supabase project settings required to run ApexOS against local or remote Supabase.

## Local Development

After `supabase start`, the CLI prints connection details:

```bash
supabase status
```

Typical local values:

| Variable | Source | Example |
|----------|--------|---------|
| `SUPABASE_URL` | supabase status → API URL | `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | supabase status → anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase status → service_role key | `eyJ...` |
| `DATABASE_URL` | supabase status → DB URL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## Environment File Template

Create `.env.local` (never commit — add to `.gitignore`):

```env
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

# Direct Postgres (migrations, ingestion scripts)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Application (Build 09+)
APEXOS_ENV=local
APEXOS_EXECUTIVE_SLUG=primary-executive
```

## Remote / Production

From Supabase Dashboard → Project Settings → API:

| Variable | Location |
|----------|----------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

From Dashboard → Project Settings → Database:

| Variable | Location |
|----------|----------|
| `DATABASE_URL` | Connection string (use pooler for serverless) |

## Client vs Server Usage

| Context | Key | RLS |
|---------|-----|-----|
| Browser / mobile app | `SUPABASE_ANON_KEY` | Enforced |
| Ingestion scripts / CI | `SUPABASE_SERVICE_ROLE_KEY` | Bypassed |
| Direct SQL / migrations | `DATABASE_URL` | Bypassed (postgres role) |

**Never** expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or `NEXT_PUBLIC_*` variables.

## Supabase CLI Configuration

`supabase/config.toml` configures local stack:

- API port: 54321
- DB port: 54322
- Postgres major version: 15
- Auth enabled with local site URL
- Storage enabled (50 MB file limit)

Link remote project:

```bash
supabase login
supabase link --project-ref <project-ref>
```

Project ref is in Dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`

## CI/CD (Build 09+)

Recommended GitHub Actions secrets:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | CLI authentication |
| `SUPABASE_PROJECT_REF` | Target project |
| `SUPABASE_DB_PASSWORD` | Remote migration push |
| `SUPABASE_SERVICE_ROLE_KEY` | Ingestion in CI |

Workflow pattern:

```yaml
- run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
- run: supabase db push
```

## Schema Environment

No separate schema per environment. All environments share the same migration history.

Environment-specific differences:

- Auth users (local vs production)
- Storage contents
- Row data (seed vs production ingestion)

## Portability Notes

To migrate off Supabase:

1. Export `DATABASE_URL` dump: `pg_dump`
2. Export Storage objects preserving paths
3. Replace Supabase client with standard Postgres + S3-compatible storage
4. RLS policies transfer to any Postgres 15+ host

## Verification

```bash
# Test API connectivity
curl "$SUPABASE_URL/rest/v1/executives?select=count" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Test direct DB
psql "$DATABASE_URL" -c "SELECT count(*) FROM executives;"
```

## Related Documentation

- `IMPLEMENTATION-GUIDE.md` — deployment steps
- `SECURITY.md` — key handling
- `supabase/config.toml` — local CLI config
