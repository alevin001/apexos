# Retrieval Documentation

Implementation documentation for the Retrieval Layer. These documents translate Retrieval Architecture v1.0 into repository conventions — they do not redefine architecture.

## Documents

| Document | Purpose | Architecture Reference |
|----------|---------|------------------------|
| `retrieval-objectives.md` | Retrieval goals and optimization criteria | Retrieval Architecture — Core Principle |
| `evidence-assembly.md` | Evidence assembly rules and structure | Retrieval Architecture — Evidence Assembly Principle |
| `retrieval-ranking.md` | Ranking signals within context priorities | Retrieval Architecture — Retrieval Ranking |
| `context-package-assembly.md` | Context Package tiers and contents | Retrieval Architecture — Context Package Assembly |
| `contradictory-evidence.md` | Contradictory evidence requirements | Retrieval Architecture — Contradictory Evidence Principle |
| `retrieval-traceability.md` | Traceability fields and audit requirements | Governance Architecture — Transparency Principle |

## Usage

Read `../REPOSITORY-GUIDE.md` first for organization rules. Use these documents for operational detail when executing workflows in `../workflows/`.

## Boundaries

- Retrieval documentation describes evidence assembly — not relevance determination (see `context/docs/`).
- Retrieval documentation does not define inference or recommendations (see `inference/`, `recommendation/`).
