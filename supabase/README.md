# ApexOS Supabase Implementation

Build 08 — first technical implementation of the ApexOS repository in Supabase Postgres.

## Purpose

This folder maps repository artifacts (Builds 02–07) to portable database tables while preserving:

- Doctrine and architecture as source of truth
- Canonical processing flow: Knowledge → Memory → Context → Retrieval → Inference → Recommendation → Outcomes
- Traceability, historical integrity, and category separation
- Founder buildability and future portability

## Contents

| File | Purpose |
|------|---------|
| `IMPLEMENTATION-GUIDE.md` | How to deploy and operate the schema |
| `SCHEMA-MAP.md` | Repository artifact → table/column mapping |
| `MIGRATION-PLAN.md` | Migration strategy and ordering |
| `STORAGE.md` | Storage bucket layout |
| `SECURITY.md` | RLS model and access controls |
| `INGESTION.md` | Repository-to-database ingestion workflow |
| `SEEDING.md` | Initial data and registry seeding |
| `ENVIRONMENT.md` | Environment configuration |
| `config.toml` | Supabase CLI local configuration |
| `migrations/` | Versioned SQL migrations |

## Quick Start

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase init   # if not already initialized
supabase start  # local Postgres + Auth + Storage
supabase db reset  # apply all migrations
```

Link to a remote project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Architecture Authority

Implementation follows the source-of-truth hierarchy:

1. Project Charter
2. Architecture Documents
3. Approved Repository Implementation (Builds 01–07)
4. Technical Implementation (this folder)

If implementation conflicts with architecture, preserve architecture.

## Scope Boundaries

**Included:** Tables, relationships, indexes, storage buckets, RLS, traceability columns.

**Excluded (by design):** Triggers, background jobs, vector search, embeddings, edge functions.

## Pipeline Tables

The executive loop is represented as a chain of linked tables:

```
context_relevance_specs
  → retrieval_requests → evidence_packages → assembled_context_packages
  → interpretation_packages → recommendation_packages
  → outcome_captures → validation_packages → learning_updates
```

Foundation objects (`executives`, `persons`, `relationships`, `situations`, `decisions`, `patterns`) anchor memory and outcomes.

## Next Build

**Build 10 — Application Layer & Executive Interface** wires the executive UI, auth, and CI. See `build/build-10-transition-package.md`.
