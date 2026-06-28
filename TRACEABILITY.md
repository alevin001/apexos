# ApexOS Traceability

Build 09 implements end-to-end traceability from repository artifacts through Supabase to the executive loop validation chain.

## Traceability Chain

Every object in the executive loop must trace to:

1. **Repository artifact** — `repository_path` column
2. **Architecture layer** — `architecture_layer` column
3. **Source document** — `source_document` column
4. **Registry entry** — `artifact_registry` row
5. **Cross-references** — `artifact_links` rows

## Full Pipeline Query

```sql
SELECT
  crs.external_id AS context_spec,
  crs.repository_path AS context_spec_path,
  rr.external_id AS retrieval_request,
  ep.external_id AS evidence_package,
  acp.external_id AS context_package,
  ip.external_id AS interpretation,
  rp.external_id AS recommendation,
  oc.external_id AS outcome_capture,
  vp.external_id AS validation,
  lu.external_id AS learning
FROM context_relevance_specs crs
JOIN retrieval_requests rr ON rr.context_reference_id = crs.id
JOIN evidence_packages ep ON ep.retrieval_request_id = rr.id
JOIN assembled_context_packages acp ON acp.retrieval_request_id = rr.id
JOIN interpretation_packages ip ON ip.assembled_context_package_id = acp.id
JOIN recommendation_packages rp ON rp.interpretation_package_id = ip.id
JOIN outcome_captures oc ON oc.recommendation_package_id = rp.id
JOIN validation_packages vp ON vp.outcome_capture_id = oc.id
LEFT JOIN learning_updates lu ON lu.validation_package_id = vp.id
WHERE crs.external_id = 'CTX-PKG-001';
```

## Build 09 Scenario Traceability

| Step | External ID | Repository Path | Architecture Layer |
|------|-------------|-----------------|-------------------|
| Context spec | CTX-PKG-001 | `scenarios/leadership-conflict-q2/context/ctx-pkg-leadership-conflict-q2.md` | context |
| Retrieval request | RET-REQ-001 | `scenarios/leadership-conflict-q2/retrieval/ret-req-leadership-conflict-q2.md` | retrieval |
| Evidence package | RET-EVD-001 | `scenarios/leadership-conflict-q2/retrieval/ret-evd-leadership-conflict-q2.md` | retrieval |
| Context package | RET-CTX-001 | `scenarios/leadership-conflict-q2/retrieval/ret-ctx-leadership-conflict-q2.md` | retrieval |
| Interpretation | INF-INT-001 | `scenarios/leadership-conflict-q2/inference/inf-int-leadership-conflict-q2.md` | inference |
| Recommendation | REC-PKG-001 | `scenarios/leadership-conflict-q2/recommendation/rec-pkg-leadership-conflict-q2.md` | recommendation |
| Outcome capture | OUT-CAP-001 | `scenarios/leadership-conflict-q2/outcomes/out-cap-leadership-conflict-q2.md` | outcomes |
| Validation | OUT-VAL-001 | `scenarios/leadership-conflict-q2/outcomes/val-pkg-leadership-conflict-q2.md` | outcomes |
| Learning | OUT-LRN-001 | `scenarios/leadership-conflict-q2/outcomes/out-lrn-leadership-conflict-q2.md` | outcomes |

## Artifact Links

Frontmatter reference arrays resolve to `artifact_links`:

| Frontmatter field | Link type |
|-------------------|-----------|
| `originating_knowledge` | `originating_knowledge` |
| `memory_references` | `memory_reference` |
| `knowledge_references` | `knowledge_reference` |
| `component_artifacts` | `component` |
| `promoted_from` | `promoted_from` |

## Artifact Registry

Every ingested record registers in `artifact_registry`:

```sql
SELECT external_id, architecture_layer, table_name, repository_path, status
FROM artifact_registry
WHERE external_id LIKE 'CTX%' OR external_id LIKE 'RET%' OR external_id LIKE 'INF%'
   OR external_id LIKE 'REC%' OR external_id LIKE 'OUT%'
ORDER BY created_at;
```

## Traceability Engine

The traceability engine (`scripts/loop/traceability.ts`) verifies:

1. Full FK chain from context spec to validation package
2. Each record has a non-null `repository_path`
3. Registry entries exist for all pipeline artifacts

Run: `npm run trace` from `scripts/`

## Governance References

- `governance/traceability/README.md`
- `context/docs/context-traceability.md`
- `retrieval/docs/retrieval-traceability.md`
- `inference/governance/inference-traceability.md`
- `recommendation/governance/recommendation-traceability.md`
- `outcomes/governance/outcome-traceability.md`

## Explainability Requirement

Traceability supports explainability at each transition:

- **Context → Retrieval:** Why these domains and weights?
- **Retrieval → Inference:** What evidence was assembled?
- **Inference → Recommendation:** What interpretation led to options?
- **Recommendation → Outcome:** What was recommended vs. what happened?
- **Outcome → Learning:** What validated learning emerged?

Every answer must point to specific artifacts — not silent transformations.
