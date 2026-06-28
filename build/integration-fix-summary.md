# Build 09 — Integration Fix Summary

Runtime integration issues discovered and fixed during the verification pass. All fixes are narrowly scoped; no architecture, doctrine, or schema changes.

## Fixes Applied

### 1. Module import side-effect (`validation.ts`, `reviews.ts`)

**Issue:** `main()` ran unconditionally at import time. When `executive-loop.ts` imported these modules, validation ran before ingestion and crashed the loop.

**Fix:** Guard `main()` with direct-execution check (same pattern as `traceability.ts`).

**Files:** `scripts/loop/validation.ts`, `scripts/loop/reviews.ts`, `scripts/loop/traceability.ts`

---

### 2. Windows npm TLS certificate error

**Issue:** `npm install` failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` without system CA.

**Fix:** npm scripts invoke `node --use-system-ca` when running `tsx`.

**File:** `scripts/package.json`

---

### 3. Table mapping — assembled context package (`map-artifact.ts`)

**Issue:** `RET-CTX-001` mapped to `evidence_packages` because `assembly_tiers && retrieval_request` heuristic matched before `ret-ctx` prefix check.

**Fix:** Evaluate `ret-ctx` before `ret-evd` generic heuristic.

**File:** `scripts/ingest/map-artifact.ts`

---

### 4. Table mapping — learning update (`map-artifact.ts`)

**Issue:** `OUT-LRN-001` mapped to `outcome_components` because `out-lrn` prefix matched component map before learning update check.

**Fix:** Check `out-lrn` + `learning_type` before outcome component inference.

**File:** `scripts/ingest/map-artifact.ts`

---

### 5. Environment error message (`config.ts`)

**Issue:** Missing env var error did not guide operator to `.env.local`.

**Fix:** Clear message referencing `.env.example` and service role requirement.

**File:** `scripts/shared/config.ts`

---

### 6. Hosted environment template

**Issue:** `.env.example` pointed at local Supabase defaults.

**Fix:** Updated with hosted project URL and service role instructions.

**File:** `.env.example`

---

### 7. Environment file bootstrap

**Action:** Created `.env.local` (gitignored) with hosted URL. Operator must set `SUPABASE_SERVICE_ROLE_KEY`.

**File:** `.env.local` (not committed)

---

## Not Changed

- Supabase schema and migrations
- Repository structure and scenario artifacts
- Doctrine and architecture documents
- Build 09 application logic beyond mapping and import guards

## Remaining Operator Action

Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` from Supabase Dashboard → Project Settings → API → `service_role` (secret), then run:

```bash
cd scripts && npm run loop:scenario
```
