# Context Repository Guide

Build 04 implementation guide for the ApexOS Context Layer.

## Purpose

This guide translates Context Architecture v1.0 into repository organization rules. It does not redefine doctrine or architecture.

**Architecture references:**

| Source | Section |
|--------|---------|
| Project Charter v1.0 (DOC-001) | Executive learning loop; situational guidance |
| Foundations Architecture v1.0 (DOC-002) | Core objects — Situation, Executive, Person, Relationship, Pattern |
| Context Architecture v1.0 (DOC-004) | Context Domains, Situation-Centered Model, Context Weighting, Context Lifecycle |
| Memory Architecture v1.0 (DOC-003) | Source vs Memory — context does not duplicate memory storage |
| Retrieval Architecture v1.0 (DOC-005) | Context determines relevance; retrieval executes assembly |
| Governance Architecture v1.0 (DOC-006) | Context drift, fidelity, review, no silent transformation |
| Architecture & Doctrine Index v2.0 | LAD-006, AF-004, AF-005 |

## Design Intent

The Context Layer determines **what information is most relevant** to the current situation. It does not store information.

```
Memory answers:   What does ApexOS know?
Context answers:  What matters right now?
Retrieval answers: How does ApexOS find the right information?
```

Context exists to determine relevance, not to store information (LAD-006, AF-004).

## Situation-Centered Model

```
Situation → Evaluate Context Domains → Load Relevant Context → Weight By Relevance → Context Evaluation → Retrieval
```

All context evaluation begins from a situation and flows through context domains before retrieval and inference.

## Repository Map

| Path | Stores | Does not store |
|------|--------|----------------|
| `context/situation/` | Situation-centered context evaluations and intake artifacts | Long-term intelligence (see `memory/`) |
| `context/executive/` | Executive context evaluation supplements | Executive memory (see `memory/executive/`) |
| `context/person/` | Person context evaluation supplements | Person memory (see `memory/person/`) |
| `context/relationship/` | Relationship context evaluation supplements | Relationship memory (see `memory/relationship/`) |
| `context/organizational/` | Organizational context evaluation supplements | Organizational memory (not a memory category) |
| `context/strategic/` | Strategic context evaluation supplements | Doctrine content (see `knowledge/doctrine/`) |
| `context/pattern/` | Pattern relevance evaluation — access to validated learning | Pattern storage (see `memory/pattern/`) |
| `context/outcome-results/` | Outcome/results relevance evaluation | Outcome/results memory (see `memory/outcome-results/`) |
| `context/docs/` | Implementation documentation | Architecture documents |
| `context/templates/` | Artifact templates | Live context content |
| `context/workflows/` | Step-by-step operational workflows | Automated scripts |
| `context/governance/` | Layer-specific fidelity and drift controls | Cross-layer governance (see `governance/`) |

## Context Domains (Context Architecture v1.0)

| Domain | Folder | Purpose |
|--------|--------|---------|
| Situation | `situation/` | Entry point — leadership disagreements, strategic decisions, negotiations, etc. |
| Executive | `executive/` | Current state of the executive — emotional state, priorities, concerns |
| Person | `person/` | Individual independent of any specific relationship |
| Relationship | `relationship/` | How two individuals interact |
| Organizational | `organizational/` | Current state of the organization — morale, alignment, pressures |
| Strategic | `strategic/` | Alignment against mission, objectives, priorities, doctrine |
| Pattern | `pattern/` | Access to validated learning relevant to the situation |
| Outcome/Results | `outcome-results/` | Evidence of what actually occurred — relevance to current situation |

**Context domains are evaluation lenses, not storage categories.** Domain folders hold situation-specific evaluation artifacts when a domain requires extended analysis. Distilled intelligence remains in `memory/`.

## Build Plan Functional Areas

The Build Plan lists three functional areas that span context domains:

| Functional Area | Implementation |
|-----------------|----------------|
| Situation assembly | `workflows/situation-intake.md` |
| Context construction | `workflows/context-assembly.md` |
| Relevant information selection | `docs/context-weighting.md`, `templates/context-weighting.md` |

These processes operate across domains — they are not separate storage categories.

## Context Weighting

Context is not weighted by recency alone. Weighting signals (Context Architecture v1.0):

| Signal | Meaning |
|--------|---------|
| Situation relevance | How directly the domain affects the current situation |
| Outcome/results impact | Potential effect on outcomes if this context is missed |
| Pattern strength | Confidence of validated patterns applicable to the situation |
| Strategic significance | Alignment with mission, objectives, and doctrine |
| Relationship significance | Importance of relationship dynamics to the situation |
| Recency | One factor among many — newer does not automatically mean more important |

See `docs/context-weighting.md` and `templates/context-weighting.md`.

## Context vs Memory Boundary

| Layer | Location | Role |
|-------|----------|------|
| Distilled intelligence | `memory/{category}/` | What ApexOS knows — retained for future use |
| Context evaluation | `context/{domain}/` | What matters right now for a specific situation |
| Source material | `knowledge/source_material/` | Raw evidence — never duplicated into context |

**Rules:**

- Do not store distilled intelligence in `context/`.
- Do not duplicate memory content into context artifacts — reference memory paths instead.
- Context artifacts are situation-specific and transient — not a substitute for memory promotion.
- Context evaluation informs retrieval; it does not assemble evidence (see `retrieval/`).

## Context Lifecycle

```
Situation Intake → Domain Evaluation → Context Weighting → Context Evaluation → Handoff to Retrieval → Context Review → Refresh or Archive
```

| Stage | Location | Meaning |
|-------|----------|---------|
| Situation intake | `situation/` | Capture situation definition and initial domain scan |
| Domain evaluation | Domain folders | Extended evaluation when a domain requires separate analysis |
| Context weighting | Evaluation artifact | Weight domains and signals for retrieval priority |
| Context evaluation | Evaluation artifact | Document what matters and why — input to retrieval |
| Handoff to retrieval | `retrieval/workflows/` | Context relevance specification guides evidence assembly |
| Context review | `workflows/context-review.md` | Validate relevance decisions after outcomes |
| Refresh or archive | `INDEX.md` status update | Update active evaluations or mark complete |

See `docs/context-lifecycle.md`.

## Context Structures (Repository Conventions)

Portable markdown structures with YAML frontmatter. Build 08 may map these fields to database columns without changing logical structure.

### Common Fields (All Context Artifacts)

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Registry ID (e.g., `CTX-SIT-001`) |
| `domain` | Yes | Primary context domain |
| `title` | Yes | Human-readable title |
| `situation_summary` | Yes | What situation is being evaluated |
| `evaluation_date` | Yes | YYYY-MM-DD |
| `status` | Yes | `draft` \| `active` \| `under_review` \| `handed_off` \| `archived` |
| `related_situation` | Recommended | Situation slug or reference |
| `domain_weights` | When applicable | Weighting decisions per domain |
| `memory_references` | Recommended | Links to relevant `memory/` artifacts — not duplicates |
| `knowledge_references` | Optional | Links to relevant `knowledge/` artifacts for retrieval |
| `retrieval_request` | When handed off | Link to retrieval request artifact |
| `review_status` | Recommended | `pending` \| `confirmed` \| `adjusted` \| `superseded` |
| `transformation_log` | When derived | Record of any derivation |

### Context Evaluation Output vs Context Package

| Artifact | Layer | Contains |
|----------|-------|----------|
| Context evaluation (this layer) | `context/` | Relevance determination, domain weights, evaluation rationale — no assembled evidence |
| Context Package (assembled) | `retrieval/context-package/` | Evidence, perspectives, patterns, relationships — prepared for inference |

Context produces the relevance specification. Retrieval assembles the Context Package.

## Naming Conventions

Use lowercase kebab-case for folders and markdown filenames.

| Artifact | Location | Pattern | Example |
|----------|----------|---------|---------|
| Situation intake | `situation/` | `ctx-sit-{short-slug}.md` | `ctx-sit-leadership-conflict-q2.md` |
| Domain supplement | `{domain}/` | `ctx-{domain}-{short-slug}.md` | `ctx-executive-stress-q2-review.md` |
| Context evaluation | `situation/` or domain folder | `ctx-eval-{short-slug}.md` | `ctx-eval-leadership-conflict-q2.md` |
| Context review | Same folder as evaluation | `{evaluation-basename}.review.md` | `ctx-eval-leadership-conflict-q2.review.md` |

## ID Conventions

| Prefix | Domain / Type |
|--------|---------------|
| `CTX-SIT-` | Situation context |
| `CTX-EXE-` | Executive context |
| `CTX-PER-` | Person context |
| `CTX-REL-` | Relationship context |
| `CTX-ORG-` | Organizational context |
| `CTX-STR-` | Strategic context |
| `CTX-PAT-` | Pattern context |
| `CTX-OUT-` | Outcome/results context |
| `CTX-EVAL-` | Context evaluation (cross-domain) |
| `CTX-REV-` | Context review |

## Registry

`context/INDEX.md` is the human-readable registry of active and archived context evaluations. Update it when creating, handing off to retrieval, reviewing, or archiving content.

## Traceability Requirements

Every context artifact must remain traceable:

1. **To situation:** Document `situation_summary` and `related_situation`.
2. **To memory:** Link `memory_references` — do not duplicate memory content.
3. **To retrieval:** Link `retrieval_request` when handed off to `retrieval/`.
4. **To outcomes:** Update via `workflows/context-review.md` when outcome evidence is available.

See `docs/context-traceability.md`, `governance/traceability/README.md`, and `governance/source-fidelity/context-layer.md`.

## Governance Requirements

All context artifacts are subject to:

- **LAD-006** — Context exists to determine relevance, not store information
- **AF-004** — Context determines what matters
- **AF-005** — Context weighting uses multiple signals, not recency alone
- **Context drift monitoring** — Relevance decisions becoming inaccurate or distorted (Governance Architecture)

See `context/governance/` and `governance/source-fidelity/context-layer.md`.

## Relationship to Other Layers

| Layer | Relationship |
|-------|--------------|
| `memory/` | Source of distilled intelligence — context references, does not duplicate |
| `knowledge/` | Source material and frameworks — referenced for retrieval targeting |
| `retrieval/` | Executes relevance determinations; assembles Context Package |
| `inference/` | Operates on assembled Context Package — does not influence context selection |
| `outcomes/` | Validates context relevance decisions through observed results |
| `governance/` | Context drift detection, fidelity, review controls |

## Distinctions

| Concept | Location | Role |
|---------|----------|------|
| Context evaluation | `context/` | What matters right now |
| Context Package | `retrieval/context-package/` | Assembled evidence for inference |
| Situation memory | `memory/situation/` | Recurring situations ApexOS remembers |
| Organizational context | `context/organizational/` | Current organizational conditions — not a memory category |
| Pattern memory | `memory/pattern/` | Stored validated learning |
| Pattern context | `context/pattern/` | Relevance of validated learning to current situation |

## Build Status

| Build | Scope | Status |
|-------|-------|--------|
| Build 04 | Context layer artifacts | Complete |
| Build 05 | Inference layer artifacts | Complete |
| Build 06 | Recommendation layer artifacts | Complete |
| Build 07 | Outcome layer artifacts | Complete |
| Build 08 | Supabase / portable data structures | Pending |
