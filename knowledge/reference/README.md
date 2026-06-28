# Reference

## Responsibility

Stores reference materials that support executive guidance — summaries, insights, printouts, and supporting documents that are **derived from** primary sources rather than being primary sources themselves.

## Architecture Reference

- **Build Plan:** `build/ApexOS V1 Build Plan.txt` (Knowledge Layer — Reference material)
- **Technical:** `technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` (Knowledge Architecture)
- **Governance:** `architecture/6 - ApexOS - Governance Architecture v1.0.docx` (LAD-010, LAD-011)

## Reference vs Source Material

| Reference (`reference/`) | Source (`source_material/`) |
|--------------------------|----------------------------|
| Summaries, insights, printouts | Books, PDFs, raw transcripts |
| Derived supporting documents | Unmodified primary evidence |
| Synthesized guidance notes | Meeting recordings, original files |

## Templates and Workflow

| Resource | Location |
|----------|----------|
| Reference template | `../templates/reference.md` |
| Add workflow | `../workflows/add-reference.md` |
| Migration workflow | `../workflows/migrate-legacy-materials.md` |

## Organization

Organize by topic subfolders:

```
reference/
├── voice-profiles/
├── mindset-and-purpose/
├── communication/
└── {topic}/
```

## Legacy Materials

Pre-Build 02 reference materials reside in `docs/knowledge base/`. Migrate using `../workflows/migrate-legacy-materials.md`. See `../INDEX.md` for migration status.

## Governance

Reference materials are frequently derived content. All derivations must be:

- Explicitly marked in frontmatter (`derived_from`, `derivation_type`)
- Logged in `transformation_log` when content is summarized, paraphrased, or restructured
- Subject to fidelity preservation — see `governance/source-fidelity/knowledge-layer.md`

## Build Status

Build 02 complete. Organization rules and migration path defined.
