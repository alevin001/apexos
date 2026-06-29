# Build 10A — Operational Readiness Report

**Date:** 2026-06-29  
**Build:** 10A — Operational Readiness & Product Refinement  
**Verification:** Executive loop PASS · UI build PASS · Glass Box validated in browser

---

## Summary

Build 10A stabilizes ApexOS from a functioning implementation into a polished, trustworthy executive operating system. Runtime executes cleanly; the executive loop passes all validations; the UI loads and displays the complete decision provenance pipeline.

---

## Issues Found

| Issue | Severity | Layer |
|-------|----------|-------|
| Windows TLS: `tsx` child processes do not inherit `--use-system-ca` CLI flag | High (blocks fresh clone on Windows) | `scripts/` runtime |
| Executive UI dev/start did not use Windows CA store for Supabase HTTPS | Medium | `apps/executive-ui/` |
| Decision provenance existed in data model but had no executive-facing visualization | Medium | UI |
| Runtime observability metrics not exposed in executive interface | Low | UI |
| `.env.local` required but not auto-created from `.env.example` | Low | Documentation |

---

## Fixes Applied

### 1. Windows TLS runner (`scripts/run.mjs`)

Created a Node runner that sets `NODE_OPTIONS=--use-system-ca` before spawning `tsx`. This propagates the Windows certificate store to all child Node processes.

**Verification:** `cd scripts && npm run loop:scenario` → **PASS** (exit 0)

### 2. Executive UI TLS (`apps/executive-ui/package.json`)

Updated `dev` and `start` scripts to use `node --use-system-ca` for Supabase HTTPS on Windows.

### 3. Executive Glass Box

- New route: `/situations/[slug]/provenance`
- New service: `provenance-service.ts` — assembles full decision provenance from existing FK chain, artifacts, and components
- Expandable pipeline stages: Situation → Context → Retrieval → Evidence → Interpretation → Recommendation → Decision → Outcome → Learning
- Each stage exposes explainability Q&A, artifact content, component artifacts, and transformation log

### 4. Runtime Observability

- `RuntimeObservabilityBar` component on situation overview and Glass Box pages
- Metrics: active situation, context/evidence/contradiction counts, assumption count, interpretation/recommendation confidence, pipeline progress, uncertainty flags

### 5. Navigation

- Added **Glass Box** tab to situation workspace navigation
- Overview page includes Decision Provenance CTA linking to Glass Box

---

## Validation Results

```
Executive Loop: PASS
  Ingested: 1, Skipped: 17, Errors: 0
  Chain: CTX-PKG-001 → ... → OUT-LRN-001
  All validations PASSED
  Architecture Fidelity: PASS

Executive UI Build: PASS
  next build — compiled successfully
  Route /situations/[slug]/provenance — present

Browser Validation: PASS
  Home loads with situation data
  leadership-conflict-q2 overview — observability bar + pipeline bar
  Glass Box — all 9 stages visible and expandable
```

---

## Environment Setup (Fresh Clone)

```powershell
# 1. Clone and configure
git clone <repo-url> ApexOS
cd ApexOS
copy .env.example .env.local
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

# 2. Install and validate runtime
cd scripts
.\install.ps1          # Windows: npm install with system CA
npm run loop:scenario  # Ingest scenario + validate loop

# 3. Start executive UI
cd ..\apps\executive-ui
npm install
npm run dev            # http://localhost:3010
```

Open http://localhost:3010/situations/leadership-conflict-q2/provenance for the Glass Box experience.

---

## Remaining Known Limitations

| Limitation | Notes |
|------------|-------|
| No authentication UI | Service role server-side (Build 10 scope) |
| Pipeline orchestration for new situations | UI creates situation only; processing requires artifact creation + ingest |
| Memory promotion workflow | Documented in repository; not automated in UI |
| Doctrine references via `artifact_links` | Sparse in scenario data; Glass Box shows component artifacts as fallback |
| Architecture `.docx` files not in repo | Implementation relies on markdown layer docs |
| CI/CD not configured | Recommended in repository evolution pass |

These are documented scope boundaries, not regressions.

---

## Screenshots

See `build/screenshots/10a/`:
- `glass-box-provenance.png` — Full Glass Box pipeline with expanded Recommendation stage
- `situation-overview-observability.png` — Overview with runtime observability bar
