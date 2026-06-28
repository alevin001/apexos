# ApexOS Executive Loop

Build 09 connects repository artifacts, Supabase persistence, and application services into the first working executive operating loop.

## Canonical Flow

```
Knowledge
  ↓
Memory
  ↓
Context
  ↓
Retrieval
  ↓
Evidence Assembly
  ↓
Inference
  ↓
Recommendation
  ↓
Decision (external)
  ↓
Outcome
  ↓
Validation
  ↓
Learning
```

Each step produces traceable artifacts. Historical records are immutable after terminal status.

## Architecture Layers

| Layer | Repository | Database | Role |
|-------|------------|----------|------|
| Knowledge | `knowledge/` | `knowledge_sources`, etc. | Source material and doctrine |
| Memory | `memory/` | `memory_artifacts`, `observations` | Distilled intelligence |
| Context | `context/` | `context_relevance_specs` | Relevance determination |
| Retrieval | `retrieval/` | `retrieval_requests`, `evidence_packages`, `assembled_context_packages` | Evidence assembly |
| Inference | `inference/` | `interpretation_packages`, `inference_components` | Evidence → interpretation |
| Recommendation | `recommendation/` | `recommendation_packages`, `recommendation_components` | Decision support |
| Outcomes | `outcomes/` | `outcome_captures`, `validation_packages`, `learning_updates` | Validation and learning |

Layers remain separate. Recommendations do not equal decisions. Outcomes do not rewrite recommendations.

## Build 09 Scenario

**Scenario:** Q2 Leadership Conflict (`scenarios/leadership-conflict-q2/`)

| Step | External ID | Artifact |
|------|-------------|----------|
| Situation | SIT-001 | Foundation situation |
| Memory | MEM-SIT-001 | Situation memory |
| Context | CTX-PKG-001 | Context relevance specification |
| Retrieval | RET-REQ-001 | Retrieval request |
| Evidence | RET-EVD-001 | Evidence package |
| Context Package | RET-CTX-001 | Assembled context package |
| Inference | INF-INT-001 | Interpretation package |
| Recommendation | REC-PKG-001 | Recommendation package |
| Outcome | OUT-CAP-001 | Outcome capture |
| Validation | OUT-VAL-001 | Validation package |
| Learning | OUT-LRN-001 | Learning update |

Executive decision `DEC-EXT-2026-Q2-001` is an external reference only — not stored in the `decisions` table.

## Running the Loop

### Prerequisites

1. Supabase local or remote with Build 08 migrations applied
2. Node.js 18+ and npm
3. Environment configured per `.env.example`

```bash
cd scripts
npm install
cp ../.env.example ../.env.local
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from `supabase status`
```

**Windows TLS:** If `npm install` or HTTPS fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, Node’s bundled CA store is not matching your Windows trust store (common with SSL inspection). Do **not** disable TLS verification. Use either:

```powershell
# Option A — one-time install helper
.\install.ps1

# Option B — session env (required for npm itself; runtime scripts already use --use-system-ca)
$env:NODE_OPTIONS = '--use-system-ca'
npm install
```

Runtime scripts (`npm run loop:scenario`, etc.) already invoke `node --use-system-ca` for Supabase requests.

### Commands

```bash
# Full executive loop (ingest + trace + validate + reviews)
npm run loop:scenario

# Ingestion only
npm run ingest:scenario

# Traceability query
npm run trace

# Validation suite
npm run validate

# Architecture reviews
npm run reviews
```

### Local Supabase Setup

```bash
supabase start
supabase db reset   # applies migrations
cd scripts && npm run loop:scenario
```

## Application Services

| Service | Path | Purpose |
|---------|------|---------|
| Ingestion pipeline | `scripts/ingest/` | Markdown → Supabase |
| Repository parser | `scripts/ingest/parse-frontmatter.ts` | YAML frontmatter + body |
| Artifact mapper | `scripts/ingest/map-artifact.ts` | Template → table routing |
| Persistence | `scripts/ingest/upsert.ts` | Idempotent upserts with integrity |
| Link resolver | `scripts/ingest/resolve-links.ts` | `artifact_links` + backfill |
| Traceability engine | `scripts/loop/traceability.ts` | FK chain verification |
| Validation engine | `scripts/loop/validation.ts` | Executive loop checks |
| Review runner | `scripts/loop/reviews.ts` | Architecture fidelity reviews |

## Historical Integrity

Application layer enforces LAD-010 and LAD-011:

- Terminal status rows (`complete`, `delivered`, `validated`, `archived`, `handed_off`, `assembled`, `active`) are not silently updated
- Corrections require supersession via new rows
- `transformation_log` is append-only
- Learning creates new records; never overwrites evidence, recommendations, or outcomes

See `outcomes/governance/historical-integrity.md`.

## Related Documentation

- `TRACEABILITY.md` — traceability chain requirements
- `INGESTION-FLOW.md` — ingestion workflow detail
- `supabase/INGESTION.md` — schema ingestion specification
- `build/build-09-end-to-end.md` — build outcome document
