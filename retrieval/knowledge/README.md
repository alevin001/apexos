# Knowledge Retrieval

## Responsibility

Retrieve knowledge from the Knowledge Layer that improves interpretation, recommendations, communication, leadership effectiveness, and outcomes.

## Architecture Reference

- **Primary:** `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx`
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Knowledge Retrieval Goal)
- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Knowledge retrieval)

## Retrieval Targets (Build 02)

Knowledge retrieval locates artifacts in `knowledge/` by category:

| Category | Location | Retrieval use |
|----------|----------|---------------|
| Doctrine references | `knowledge/doctrine/` | Align interpretation and recommendations to governing doctrine |
| Frameworks | `knowledge/frameworks/` | Situational framework application |
| Concepts | `knowledge/frameworks/concept-*.md` | Atomic ideas linked to frameworks and situations |
| Reference | `knowledge/reference/` | Supporting derived guidance |
| Source material | `knowledge/source_material/` | Primary evidence and traceability |

Use `knowledge/INDEX.md` as the registry for locating registered artifacts.

## Retrieval Ranking Signals

Situation relevance, outcome/results impact, pattern strength, relationship significance, strategic significance, recency (as one factor among many).

Recency may influence retrieval. Recency should not dominate retrieval. Newer does not automatically mean more important.

## Source vs Memory in Retrieval

| Retrieve from | When |
|---------------|------|
| `knowledge/` | Framework application, source evidence, doctrine alignment, reference guidance |
| `memory/` | Distilled intelligence, validated patterns, executive/people/relationship context (Build 03) |

Do not treat reference summaries as equivalent to primary sources. Retrieval should prefer primary evidence when traceability matters.

## Knowledge Retrieval Goal

Retrieve knowledge that improves:

- Interpretation
- Recommendations
- Communication
- Leadership effectiveness
- Outcomes

Knowledge exists to improve decisions, not merely preserve information.

## Registry and Metadata

Artifact frontmatter fields (defined in `knowledge/templates/`) support retrieval filtering:

- `tags` — topical retrieval
- `situation_types` — situational relevance
- `related_concepts` / `related_frameworks` — linked artifact retrieval
- `status` — exclude draft or retired artifacts unless explicitly requested

## Build Status

Build 02 defines knowledge organization that retrieval targets. Full retrieval implementation workflows are defined in Build 04.

| Workflow | Location |
|----------|----------|
| Evidence assembly | `retrieval/workflows/evidence-assembly.md` |
| Retrieval pipeline | `retrieval/workflows/retrieval-pipeline.md` |
| Package delivery | `retrieval/workflows/package-delivery.md` |

See `../REPOSITORY-GUIDE.md` and `../workflows/evidence-assembly.md`.
