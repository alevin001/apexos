# TLS Diagnosis — Windows `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**Date:** 2026-06-28  
**Scope:** HTTPS to Supabase and npm registry from Node.js on Windows

## Root Cause

**Windows certificate trust mismatch with Node.js bundled CA store** (not Supabase client configuration).

| Client | `registry.npmjs.org` | `*.supabase.co` |
|--------|---------------------|-----------------|
| PowerShell / Windows | 200 | 401 (expected) |
| Node.js (default) | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` |
| Node.js `--use-system-ca` | 200 | 401 (expected) |

Node v24 on Windows uses an embedded Mozilla CA bundle by default. This machine’s trusted chain is present in the **Windows certificate store** but **not** in Node’s bundled store — consistent with antivirus or SSL inspection that installs a local root CA into Windows only.

This affects **all** Node HTTPS (npm and `@supabase/supabase-js`), not Supabase-specific settings.

## Ruled Out

| Category | Finding |
|----------|---------|
| Supabase client configuration | Same error on raw `fetch()` to Supabase URL |
| Environment configuration (`.env.local`) | TLS fails before env is read |
| Supabase project / URL | PowerShell reaches endpoint; Node with `--use-system-ca` returns 401 |
| Global npm `strict-ssl false` | Not used; would be improper bypass |
| Antivirus/proxy blocking | Connection reaches server; failure is certificate verification, not timeout |
| `scripts/.npmrc` `node-options` | Does **not** fix npm’s own HTTPS client; `NODE_OPTIONS` env var does |

## Fix Applied (minimum)

1. **Runtime scripts** — `scripts/package.json` already runs `node --use-system-ca` for all `tsx` commands (Supabase ingestion/validation).
2. **npm install** — added `scripts/install.ps1` setting `NODE_OPTIONS=--use-system-ca` for the install session only.
3. **Documentation** — `EXECUTIVE-LOOP.md` and `.env.example` Windows TLS note.

No TLS bypass. No architecture or application logic changes.

## Operator Commands

```powershell
cd scripts
.\install.ps1          # npm install with Windows CA store
npm run loop:scenario  # Supabase HTTPS via --use-system-ca in script
```
