# Build 04 — Context & Retrieval

**Status:** Complete  
**Deliverable:** Context and Retrieval repository organization

## Scope

Translate Context Architecture and Retrieval Architecture into repository implementation artifacts:

- Context domain organization and relevance determination
- Retrieval target organization and evidence assembly
- Templates for context evaluation and retrieval artifacts
- Workflows for situation intake through package delivery
- Context and retrieval governance and traceability controls
- Registries

## Out of Scope (Preserved for Later Builds)

- Database schemas, SQL, application code (Build 07)
- Inference and recommendation implementation (Build 05)
- Outcome validation architecture workflows (Build 06)
- Digital system implementation (Build 07)

## Artifacts Created — Context Layer

| Path | Purpose |
|------|---------|
| `context/REPOSITORY-GUIDE.md` | Master organization guide |
| `context/INDEX.md` | Artifact registry |
| `context/docs/` | Context domains, packages, weighting, lifecycle, governance, traceability |
| `context/templates/` | Context package (relevance spec), evaluation, weighting, review |
| `context/workflows/` | Situation intake, assembly, review, refresh, promotion |
| `context/governance/` | Fidelity checklist, drift detection, architecture mapping |
| `governance/source-fidelity/context-layer.md` | Context-specific fidelity and governance controls |

## Artifacts Created — Retrieval Layer

| Path | Purpose |
|------|---------|
| `retrieval/REPOSITORY-GUIDE.md` | Master organization guide |
| `retrieval/INDEX.md` | Artifact registry |
| `retrieval/requests/` | Retrieval request artifact location |
| `retrieval/docs/` | Objectives, evidence assembly, ranking, package assembly, contradictory evidence, traceability |
| `retrieval/templates/` | Evidence package, retrieval request, contradictory evidence, retrieval review |
| `retrieval/workflows/` | Pipeline, evidence assembly, contradictory evidence, validation, package delivery |
| `retrieval/governance/` | Evidence first checklist, retrieval fidelity checklist, architecture mapping |
| `governance/source-fidelity/retrieval-layer.md` | Retrieval-specific fidelity and governance controls |

## Artifacts Updated

| Path | Change |
|------|--------|
| `context/README.md` | Build 04 complete; links to guides, templates, workflows |
| `context/{domain}/README.md` | Template, workflow, and naming conventions (all 8 domains) |
| `retrieval/README.md` | Build 04 complete; links to guides, templates, workflows |
| `retrieval/knowledge/README.md` | Retrieval workflows mapped to Build 04 structure |
| `retrieval/memory/README.md` | Retrieval workflows mapped to Build 04 structure |
| `retrieval/evidence/README.md` | Evidence assembly workflows and templates |
| `retrieval/pattern/README.md` | Pattern retrieval mapped to Build 04 workflows |
| `retrieval/context-package/README.md` | Package delivery workflow and assembly docs |
| `governance/source-fidelity/README.md` | Links to context-layer and retrieval-layer controls |
| `governance/traceability/README.md` | Context and retrieval traceability fields |
| `memory/REPOSITORY-GUIDE.md` | Build 04 status; link to context guide |
| `knowledge/REPOSITORY-GUIDE.md` | Build 04 status; link to retrieval guide |
| `readme.md` | Build 04 status |

## Architecture Traceability

| Architecture Source | Implementation Artifact |
|--------------------|------------------------|
| Context Architecture — LAD-006, AF-004 | `context/REPOSITORY-GUIDE.md`, `context-layer.md` |
| Context Architecture — Situation-Centered Model | `context/situation/`, `workflows/situation-intake.md` |
| Context Architecture — Context Domains | `context/docs/context-domains.md`, domain folders |
| Context Architecture — Context Weighting | `context/docs/context-weighting.md`, `templates/context-weighting.md` |
| Context Architecture — Context Lifecycle | `context/docs/context-lifecycle.md`, workflows |
| Context Architecture — Primary Output | `templates/context-package.md` (relevance spec) |
| Retrieval Architecture — LAD-007, AF-006 | `retrieval/REPOSITORY-GUIDE.md`, `retrieval-layer.md` |
| Retrieval Architecture — LAD-008, AF-007 | `governance/evidence-first-checklist.md` |
| Retrieval Architecture — AF-008 | `docs/contradictory-evidence.md`, contradictory workflow |
| Retrieval Architecture — Evidence Assembly | `retrieval/evidence/`, `workflows/evidence-assembly.md` |
| Retrieval Architecture — Context Package Assembly | `retrieval/context-package/`, `workflows/package-delivery.md` |
| Retrieval Architecture — Retrieval Ranking | `retrieval/docs/retrieval-ranking.md` |
| Governance Architecture — Context Drift | `context/governance/context-drift-detection.md` |
| Governance Architecture — Retrieval Drift | `retrieval/governance/retrieval-fidelity-checklist.md` |
| Build Plan Build 04 | This deliverable |

## Next Build

**Build 05 — Inference**

Translate Inference Architecture into implementation artifacts.

## Validation Checklist

- [x] Build 01 context and retrieval folder structure preserved
- [x] No architecture redesign — guides implement existing Context and Retrieval Architecture
- [x] Context determines relevance — retrieval assembles evidence — strict separation maintained
- [x] Context Package distinction preserved — relevance spec (context) vs assembled package (retrieval)
- [x] Evidence First and Contradictory Evidence principles implemented
- [x] Traceability to context, knowledge, and memory required
- [x] No database schemas, SQL, or application code
- [x] Organizational context vs organizational memory distinction preserved
