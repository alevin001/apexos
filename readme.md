# ApexOS

Doctrine-driven executive operating system.

## Purpose

ApexOS is a personalized executive intelligence and leadership operating system. It strengthens executive judgment through contextual intelligence, leadership reflection, organizational interpretation, and strategic decision support.

**Doctrine → Architecture → Implementation**

Implementation may support architecture. Implementation may not redefine architecture.

## Authoritative Sources

All implementation decisions must reference these documents before proceeding:

| Document | Location |
|----------|----------|
| Project Charter v1.0 | `architecture/1 - ApexOS - Project Charter v1.0.docx` |
| Foundations Architecture v1.0 | `architecture/2 - ApexOS - Foundations Architecture v1.0.docx` |
| Memory Architecture v1.0 | `architecture/3 - ApexOS - Memory Architecture v1.0.docx` |
| Context Architecture v1.0 | `architecture/4 - ApexOS - Context Architecture v1.0.docx` |
| Retrieval Architecture v1.0 | `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx` |
| Governance Architecture v1.0 | `architecture/6 - ApexOS - Governance Architecture v1.0.docx` |
| Inference Architecture v1.0 | `architecture/7 - ApexOS - Inference Architecture v1.0.docx` |
| Recommendation Architecture v1.0 | `architecture/8 - ApexOS - Recommendation Architecture v1.0.docx` |
| Outcome & Results Architecture v1.0 | `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx` |
| Architecture & Doctrine Index v2.0 | `architecture/99 - ApexOS - Minimum Viable Index v2.0.docx` |
| Technical Architecture v0.1 | `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` |

The Charter remains the highest authority. Architecture supports doctrine and may not redefine doctrine.

## Repository Structure

This repository maps directly to ApexOS architecture domains. Each top-level folder implements one architectural layer.

```
ApexOS/
├── architecture/              # Authoritative architecture documents (source of truth)
├── technical_architecture/    # Technical implementation architecture
├── build/                     # Build sequence and plans
├── docs/                      # General documentation and legacy reference materials
├── foundations/               # Core object model and executive learning loop
├── knowledge/                 # Knowledge layer — doctrine, frameworks, reference, source_material
│   ├── doctrine/              # Doctrine indices (references Charter — no duplication)
│   ├── frameworks/            # Frameworks and concept artifacts
│   ├── reference/             # Derived reference materials
│   ├── source_material/       # Primary source documents
│   ├── templates/             # Artifact templates (Build 02)
│   └── workflows/             # Operational workflows (Build 02)
├── memory/                    # Memory layer — distilled intelligence by category
├── context/                   # Context layer — relevance determination by domain
│   ├── docs/                  # Implementation documentation (Build 04)
│   ├── templates/             # Artifact templates (Build 04)
│   ├── workflows/             # Operational workflows (Build 04)
│   └── governance/            # Layer-specific governance (Build 04)
├── retrieval/                 # Retrieval layer — evidence assembly
│   ├── requests/              # Retrieval request artifacts (Build 04)
│   ├── docs/                  # Implementation documentation (Build 04)
│   ├── templates/             # Artifact templates (Build 04)
│   ├── workflows/             # Operational workflows (Build 04)
│   └── governance/            # Layer-specific governance (Build 04)
├── inference/                 # Inference layer — evidence to interpretation
│   ├── templates/             # Artifact templates (Build 05)
│   ├── workflows/             # Operational workflows (Build 05)
│   └── governance/            # Layer-specific governance (Build 05)
├── recommendation/            # Recommendation layer — interpretation to decision support (Build 06)
│   ├── templates/             # Artifact templates (Build 06)
│   ├── workflows/             # Operational workflows (Build 06)
│   └── governance/            # Layer-specific governance (Build 06)
├── outcomes/                  # Outcome & Results layer — validation and learning (Build 07)
│   ├── templates/             # Artifact templates (Build 07)
│   ├── workflows/             # Operational workflows (Build 07)
│   └── governance/            # Layer-specific governance (Build 07)
├── supabase/                  # Supabase implementation — schema, migrations, docs (Build 08)
│   ├── migrations/            # Versioned SQL migrations
│   └── config.toml            # Supabase CLI configuration
├── apps/
│   └── executive-ui/          # Executive interface (Build 10)
├── scripts/                   # Ingestion and validation runtime (Build 09)
└── governance/                # Governance layer — integrity, fidelity, and drift protection
```

## Canonical Flow

```
Situation → Context → Retrieval → Evidence Assembly → Inference → Recommendation → Decision → Action → Outcome → Pattern Update → Future Executive Behavior
```

## Build Sequence

See `build/ApexOS V1 Build Plan.txt`. Builds 01–09 (repository structure through end-to-end executive loop) are complete. **Build 10** implements the executive interface in `apps/executive-ui/`. **Build 10A** adds the Executive Glass Box (decision provenance) and operational readiness stabilization.

## Build 10A — Executive Glass Box

MVP stabilization milestone: decision provenance visualization, runtime observability, and operational readiness. See `build/build-10a-executive-glass-box.md`.

```bash
# Validate runtime
cd scripts && npm install && npm run loop:scenario

# Start executive UI
cd apps/executive-ui && npm install && npm run dev
```

Open http://localhost:3010/situations/leadership-conflict-q2/provenance for the Glass Box experience.

## Build 10 — Executive Interface

The first usable executive application exposes the validated runtime through a thin web UI. See `apps/executive-ui/docs/README.md`.

```bash
cd apps/executive-ui && npm install && npm run dev
```

Open http://localhost:3010. Requires repo root `.env.local` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Build 09 — Executive Loop

The first working executive operating loop connects repository artifacts to Supabase via the ingestion pipeline in `scripts/`. See `EXECUTIVE-LOOP.md` for setup and execution.

```bash
cd scripts && npm install && npm run loop:scenario
```

On Windows, npm scripts use `node --use-system-ca` for TLS. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` from the Supabase Dashboard (Project Settings → API → service_role).

## Governance Rules

- No architectural layer may override Charter doctrine.
- No component is exempt from outcome validation.
- Evidence precedes inference.
- Recommendations do not equal decisions.
- Fidelity preservation is mandatory; no silent transformation of authoritative content.
