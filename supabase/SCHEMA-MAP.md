# ApexOS Schema Map

Repository artifact → Supabase table/column mapping for Build 08.

## Mapping Convention

| Repository | Database |
|------------|----------|
| YAML frontmatter field | Column (same name, snake_case) |
| Markdown body | `body_md` |
| `[]` reference arrays | `artifact_links` rows (+ optional denormalized JSONB on parent) |
| `INDEX.md` registry row | `artifact_registry` row |
| `source_material/` binary | Supabase Storage + `knowledge_sources.storage_object_path` |

## Foundations

| Repository | Table | Key Columns |
|------------|-------|-------------|
| `foundations/README.md` — Executive | `executives` | `slug`, `display_name`, `summary` |
| Person identity | `persons` | `slug`, `display_name` |
| Relationship identity | `relationships` | `slug`, `title` |
| Relationship participants | `relationship_participants` | `relationship_id`, `person_id` |
| Situation identity | `situations` | `slug`, `title`, `situation_type`, `situation_summary` |
| `memory/templates/decision-memory.md` | `decisions` + `memory_artifacts` (category=decision) | `decision_date`, `summary`, `rationale`, `situation_id` |
| `memory/templates/pattern-memory.md` | `patterns` + `memory_artifacts` (category=pattern) | `pattern_type`, `reinforcement_status`, `confidence` |

## Knowledge Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `knowledge-source.meta.md` | `knowledge_sources` | `title`, `author`, `source`, `type`→`source_type`, `source_file`→`source_file_path`, `summary`, `tags`, `date_acquired`, `charter_alignment`, `status`, `memory_promotion`, `transformation_log` |
| `framework.md` | `frameworks` | `name`, `description`, `source`, `source_type`, `tags`, `situation_types`, `status`, `effectiveness_notes`, `transformation_log` |
| `concept.md` | `concepts` | `name`, `definition`, `source`, `tags`, `status`, `transformation_log` |
| `reference.md` | `knowledge_references` | `title`, `topic`, `summary`, `derived_from`, `derivation_type`, `tags`, `status`, `transformation_log` |

**Link tables via `artifact_links`:**

- `related_frameworks`, `related_concepts` → `link_type = 'other'`
- `related_memory` → `link_type = 'memory_reference'`
- `source_files` → `link_type = 'derived_from'`

## Memory Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `observation.md` | `observations` | `title`, `summary`, `confidence`, `related_person`→`related_person_id`, `related_relationship`→`related_relationship_id`, `related_situation`→`related_situation_id`, `observation_date`, `observed_by`, `review_status`, `promotion_target`, `transformation_log` |
| `executive-memory.md` | `memory_artifacts` | `category='executive'`, `title`, `summary`, `confidence`, `review_status`, `last_reviewed`, `tags` |
| `person-memory.md` | `memory_artifacts` | `category='person'`, `person_slug`, `person_id`, `title`, `summary`, `confidence` |
| `relationship-memory.md` | `memory_artifacts` | `category='relationship'`, `relationship_id`, `title`, `summary`, `confidence`; `participants`→`artifact_links` |
| `situation-memory.md` | `memory_artifacts` | `category='situation'`, `situation_type`, `situation_id`, `title`, `summary`, `confidence` |
| `decision-memory.md` | `memory_artifacts` + `decisions` | `category='decision'`, `decision_date`, `decision_id`, `title`, `summary`, `confidence` |
| `pattern-memory.md` | `memory_artifacts` + `patterns` | `category='pattern'`, `pattern_type`, `pattern_id`, `reinforcement_status`, `confidence` |
| `outcome-results-memory.md` | `memory_artifacts` | `category='outcome-results'`, `outcome_date`, `outcome_type`, `title`, `summary`, `confidence` |
| `promotion-record.md` | `promotion_records` | `promotion_date`, `promotion_type`, `from_artifact`→FKs, `to_artifact`→FKs, `from_stage`, `to_stage`, `target_category`, `reviewed_by`, `approval_status`, `rationale`, `confidence_assigned` |
| `outcome-reference.md` | `outcome_references` | `summary`, `outcome_type`, `outcome_date`, `validation_impact`, `confidence_impact` |

**Shared memory link fields → `artifact_links`:**

- `originating_knowledge` → `originating_knowledge`
- `promoted_from` → `promoted_from`
- `related_outcomes`, `related_patterns`, `supporting_observations`, `supporting_decisions`, `supporting_outcomes` → respective link types

## Context Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `context-evaluation.md` | `context_evaluations` | `domain`, `title`, `situation_summary`, `evaluation_date`, `related_situation`→`related_situation_id`, `domains_evaluated`, `domains_excluded`, `review_status`, `status` |
| `context-package.md` | `context_relevance_specs` | `domain`, `title`, `situation_summary`, `evaluation_date`, `related_situation`→`related_situation_id`, `domain_weights`, `weighting_rationale`, `retrieval_tiers`, `retrieval_request`→`retrieval_request_id`, `review_status`, `status` |

**Reference arrays → `artifact_links`:**

- `memory_references` → `memory_reference`
- `knowledge_references` → `knowledge_reference`

## Retrieval Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `retrieval-request.md` | `retrieval_requests` | `title`, `request_date`, `status`, `context_reference`→`context_reference_id`, `retrieval_targets`, `scope_summary`, `tier_requirements`, `exclusions`, `contradictory_evidence_required`, `validation_status`, `evidence_package`→`evidence_package_id`, `context_package`→`assembled_context_package_id` |
| `evidence-package.md` | `evidence_packages` | `title`, `assembly_date`, `status`, `retrieval_request_id`, `context_reference_id`, `assembly_tiers`, `exclusions`, `gaps` |
| `contradictory-evidence.md` | `contradictory_evidence_records` | `title`, `retrieval_request_id`, `conflicting_sources`, `resolution_status` |
| Assembled Context Package | `assembled_context_packages` | `title`, `assembly_date`, `retrieval_request_id`, `evidence_package_id`, `context_reference_id`, `assembly_tiers`, `status` |

## Inference Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `interpretation-package-template.md` | `interpretation_packages` | `title`, `interpretation_date`, `status`, `context_package`→`assembled_context_package_id`, `retrieval_request_id`, `context_reference_id`, `confidence_summary`, `uncertainty_flags`, `review_status` |
| Component templates (`inf-*`) | `inference_components` | `component_type`, `title`, `interpretation_package_id`, `status`, `body_md` |

## Recommendation Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `recommendation-package-template.md` | `recommendation_packages` | `title`, `recommendation_date`, `status`, `interpretation_package_id`, `context_package`→`assembled_context_package_id`, `retrieval_request_id`, `context_reference_id`, `confidence_summary`, `uncertainty_flags`, `review_status` |
| Component templates (`rec-*`) | `recommendation_components` | `component_type`, `title`, `recommendation_package_id`, `status`, `body_md` |

## Outcomes Layer

| Template | Table | Frontmatter → Columns |
|----------|-------|----------------------|
| `outcome-capture-template.md` | `outcome_captures` | `title`, `capture_date`, `status`, `recommendation_package_id`, `interpretation_package_id`, `context_package`→`assembled_context_package_id`, `executive_decision_reference`, `recommendation_followed`, `action_taken`, `observed_outcome`, `measurable_results`, `unexpected_consequences`, `capture_method`, `related_validation_package_id` |
| `validation-package-template.md` | `validation_packages` | `title`, `validation_date`, `status`, pipeline FKs, `outcome_capture_id`, `executive_decision_reference`, `action_taken_summary`, `observed_outcome_summary`, `validation_summary`, `learning_promoted_id`, `review_status` |
| Outcome component templates | `outcome_components` | `component_type`, `title`, `validation_package_id`, `status`, `body_md` |
| `learning-update-template.md` | `learning_updates` | `title`, `learning_date`, `status`, `validation_package_id`, `outcome_capture_id`, `learning_type`, `validation_basis`, `promotion_status`, `promoted_to_memory_id` |
| `reinforcement-update-template.md` | `reinforcement_updates` | `title`, `validation_package_id`, `pattern_id`, `prior_confidence`, `new_confidence`, `reinforcement_action` |

## Cross-Cutting

| Repository | Table | Purpose |
|------------|-------|---------|
| `*/INDEX.md` | `artifact_registry` | Digital registry replacing markdown indexes |
| Frontmatter `[]` arrays | `artifact_links` | Polymorphic references with `link_type` and optional `tier` |

## Enums

| Enum | Values |
|------|--------|
| `confidence_level` | low, medium, high, validated, insufficient |
| `memory_category` | executive, person, relationship, situation, decision, pattern, outcome-results |
| `context_domain` | situation, executive, person, relationship, organizational, strategic, pattern, outcome-results |
| `tier_level` | critical, supporting, available, excluded |
| `inference_component_type` | evidence_assessment, assumption_register, blind_spot_review, hypothesis_evaluation, confidence_assessment, competing_interpretations |
| `recommendation_component_type` | objective_alignment, option_generation, doctrine_evaluation, risk_assessment, opportunity_assessment, tradeoff_analysis, recommendation_confidence |
| `outcome_component_type` | recommendation_validation, decision_validation, assumption_validation, pattern_validation, confidence_recalibration, reinforcement_update, learning_update, executive_follow_up |
| `artifact_link_type` | originating_knowledge, derived_from, promoted_from, memory_reference, knowledge_reference, component, evidence_item, related_outcome, related_pattern, related_decision, related_person, related_relationship, superseded_by, doctrine_reference, executive_decision, other |

## Architecture Document Mapping

| Layer | `source_document` default |
|-------|--------------------------|
| Foundations | `architecture/2 - ApexOS - Foundations Architecture v1.0.docx` |
| Knowledge | `architecture/2 - ApexOS - Foundations Architecture v1.0.docx` |
| Memory | `architecture/3 - ApexOS - Memory Architecture v1.0.docx` |
| Context | `architecture/4 - ApexOS - Context Architecture v1.0.docx` |
| Retrieval | `architecture/5 - ApexOS - Retrieval Architecture v1.0.docx` |
| Inference | `architecture/7 - ApexOS - Inference Architecture v1.0.docx` |
| Recommendation | `architecture/8 - ApexOS - Recommendation Architecture v1.0.docx` |
| Outcomes | `architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx` |
