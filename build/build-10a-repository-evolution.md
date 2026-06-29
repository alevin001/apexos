# Build 10A — Repository Evolution Recommendations

**Date:** 2026-06-29  
**Scope:** Incremental improvements after Builds 01–10A  
**Constraint:** Preserve architecture and doctrine; no reorganization for its own sake

---

## README Consistency

| Current State | Recommendation |
|---------------|----------------|
| Root `readme.md` (lowercase) vs standard `README.md` | Keep `readme.md` for now (git tracks it); add redirect note if GitHub display matters |
| Build 10 documented; Build 10A not yet in root readme | **Done in Build 10A** — update root readme with Glass Box section |
| `.env.example` Windows TLS note present but easy to miss | Add one-line TLS note to Quick Start in root readme |

## Naming Conventions

| Observation | Recommendation |
|-------------|----------------|
| `recommendation/` and `recommendations/` both exist | Document that `recommendations/` is legacy; prefer `recommendation/` in new artifacts |
| `readme.md` vs `README.md` mixed across folders | Standardize on `README.md` for new files; rename incrementally when touching a folder |
| Build docs use `build-NN-*.md` pattern consistently | Continue pattern; add `build-10a-*.md` prefix for 10A deliverables |

## Documentation Organization

| Gap | Recommendation |
|-----|----------------|
| Build plan text file ends at Build 08 | Add Build 09–10A summary section to `build/ApexOS V1 Build Plan.txt` or create `build/BUILD-INDEX.md` |
| Architecture `.docx` referenced but not in repo | Add `architecture/MISSING-DOCS.md` noting which docs are external-only |
| UI docs in `apps/executive-ui/docs/` separate from build docs | Cross-link from `build/build-10a-acceptance-checklist.md` to UI docs |

## Folder Clarity

| Area | Status | Note |
|------|--------|------|
| Layer folders map to architecture | Good | No change needed |
| `scripts/` for runtime, `apps/` for UI | Good | Clear separation |
| `scenarios/` for test data | Good | Add second scenario when ready |
| `build/screenshots/` | New in 10A | Use for UI demonstration artifacts |

## Navigation & Discoverability

| Improvement | Priority |
|-------------|----------|
| Add `build/BUILD-INDEX.md` linking all build outcome documents | High |
| Add `INDEX.md` at repo root pointing to layer INDEX files | Medium |
| Cross-link Glass Box from `EXECUTIVE-LOOP.md` | Medium |
| Add `apps/executive-ui/docs/GLASS-BOX.md` describing provenance UI | **Done in 10A** |

## Repository Indexing

| Action | Rationale |
|--------|-----------|
| Ensure each layer `INDEX.md` links to REPOSITORY-GUIDE | Already present in most layers |
| Add provenance-related files to `governance/traceability/README.md` UI section | Links CLI traceability to Glass Box |
| Tag Build 10A in `apps/executive-ui/package.json` version 0.10.1 | Done |

## Cross-Linking

Suggested links to add incrementally:

```
readme.md → build/build-10a-operational-readiness-report.md
EXECUTIVE-LOOP.md → /situations/[slug]/provenance (Glass Box)
apps/executive-ui/docs/README.md → provenance route
governance/traceability/README.md → Glass Box UI
```

## CI/CD (Deferred but Recommended)

Add `.github/workflows/apexos-ci.yml`:

```yaml
# On PR: cd scripts && npm ci && npm run loop:scenario
# On PR: cd apps/executive-ui && npm ci && npm run build
```

This validates fresh-clone operational readiness on every change.

---

## Summary

The repository structure faithfully maps to architecture. Build 10A improvements should focus on **indexing, cross-linking, and CI** rather than folder reorganization. The strongest incremental wins are a build index document and CI workflow for loop + UI build validation.
