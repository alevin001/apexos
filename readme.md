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
└── governance/                # Governance layer — integrity, fidelity, and drift protection
```

## Canonical Flow

```
Situation → Context → Retrieval → Evidence Assembly → Inference → Recommendation → Decision → Action → Outcome → Pattern Update → Future Executive Behavior
```

## Build Sequence

See `build/ApexOS V1 Build Plan.txt`. Builds 01–08 (repository structure through Supabase integration) are complete. Build 09 implements the end-to-end executive loop with ingestion and application services.

## Governance Rules

- No architectural layer may override Charter doctrine.
- No component is exempt from outcome validation.
- Evidence precedes inference.
- Recommendations do not equal decisions.
- Fidelity preservation is mandatory; no silent transformation of authoritative content.
