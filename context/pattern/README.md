# Pattern Context

## Responsibility

Evaluate which validated learning patterns are relevant to the current situation — access to validated learning, not pattern storage.

## Architecture Reference

- **Primary:** `architecture/4 - ApexOS - Context Architecture v1.0.docx` (Pattern Context)

## Artifact Conventions (Build 04)

| Item | Convention |
|------|------------|
| Domain supplement | `../templates/context-evaluation.md` |
| Naming | `ctx-pattern-{slug}.md` |
| ID prefix | `CTX-PAT-` |
| Registry | `../INDEX.md` |

## Workflows

Evaluate during `../workflows/context-assembly.md`. Reference `memory/pattern/` by path for relevance assessment.

Retrieval of pattern evidence occurs in `retrieval/pattern/` during evidence assembly.

## Does Not Store

- Pattern memory (see `memory/pattern/`)
- Unvalidated observations (see `memory/observations/`)

## Distinction

| Layer | Role |
|-------|------|
| Pattern context (this folder) | Which patterns are relevant to the situation |
| Pattern memory (`memory/pattern/`) | Stored validated learning |
| Pattern retrieval (`retrieval/pattern/`) | Assembles pattern evidence for Context Package |
| Pattern recognition (`inference/pattern-recognition/`) | Inferential process on assembled evidence |

See `../docs/context-domains.md` and `../REPOSITORY-GUIDE.md`.
