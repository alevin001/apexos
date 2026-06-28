-- ApexOS Build 08 — Initial Schema
-- Maps repository artifacts (Builds 02–07) to portable Postgres tables.
-- No triggers. No vectors. No edge functions. No background jobs.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

CREATE TYPE confidence_level AS ENUM (
  'low',
  'medium',
  'high',
  'validated',
  'insufficient'
);

CREATE TYPE memory_category AS ENUM (
  'executive',
  'person',
  'relationship',
  'situation',
  'decision',
  'pattern',
  'outcome-results'
);

CREATE TYPE context_domain AS ENUM (
  'situation',
  'executive',
  'person',
  'relationship',
  'organizational',
  'strategic',
  'pattern',
  'outcome-results'
);

CREATE TYPE tier_level AS ENUM (
  'critical',
  'supporting',
  'available',
  'excluded'
);

CREATE TYPE inference_component_type AS ENUM (
  'evidence_assessment',
  'assumption_register',
  'blind_spot_review',
  'hypothesis_evaluation',
  'confidence_assessment',
  'competing_interpretations'
);

CREATE TYPE recommendation_component_type AS ENUM (
  'objective_alignment',
  'option_generation',
  'doctrine_evaluation',
  'risk_assessment',
  'opportunity_assessment',
  'tradeoff_analysis',
  'recommendation_confidence'
);

CREATE TYPE outcome_component_type AS ENUM (
  'recommendation_validation',
  'decision_validation',
  'assumption_validation',
  'pattern_validation',
  'confidence_recalibration',
  'reinforcement_update',
  'learning_update',
  'executive_follow_up'
);

CREATE TYPE artifact_link_type AS ENUM (
  'originating_knowledge',
  'derived_from',
  'promoted_from',
  'memory_reference',
  'knowledge_reference',
  'component',
  'evidence_item',
  'related_outcome',
  'related_pattern',
  'related_decision',
  'related_person',
  'related_relationship',
  'superseded_by',
  'doctrine_reference',
  'executive_decision',
  'other'
);

-- ---------------------------------------------------------------------------
-- Traceability helper: columns repeated on persistent tables
-- architecture_layer, repository_path, source_document, schema_version,
-- transformation_log (jsonb append-only), created_at, updated_at,
-- superseded_by_id (uuid, resolved via artifact_registry)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Foundations — core object model (Build 01 / Foundations Architecture)
-- ---------------------------------------------------------------------------

CREATE TABLE executives (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  summary         text,
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'foundations/README.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE persons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'memory/templates/person-memory.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE relationships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'memory/templates/relationship-memory.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE relationship_participants (
  relationship_id uuid NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  person_id       uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (relationship_id, person_id)
);

CREATE TABLE situations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  situation_summary text,
  situation_type  text,
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'memory/templates/situation-memory.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE decisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  decision_date   date,
  summary         text,
  rationale       text,
  expected_outcome text,
  situation_id    uuid REFERENCES situations(id) ON DELETE SET NULL,
  executive_decision_reference text,
  confidence      confidence_level,
  review_status   text NOT NULL DEFAULT 'draft',
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'memory/templates/decision-memory.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patterns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  pattern_type    text,
  summary         text,
  confidence      confidence_level NOT NULL DEFAULT 'validated',
  reinforcement_status text,
  review_status   text NOT NULL DEFAULT 'draft',
  last_reviewed   date,
  architecture_layer text NOT NULL DEFAULT 'foundations',
  repository_path text DEFAULT 'memory/templates/pattern-memory.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Knowledge layer (Build 02)
-- ---------------------------------------------------------------------------

CREATE TABLE knowledge_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  author          text,
  source          text NOT NULL,
  source_type     text NOT NULL,
  source_file_path text,
  storage_object_path text,
  summary         text,
  tags            text[] NOT NULL DEFAULT '{}',
  date_acquired   date,
  charter_alignment text,
  memory_promotion text,
  status          text NOT NULL DEFAULT 'draft',
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  repository_path text DEFAULT 'knowledge/templates/knowledge-source.meta.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE frameworks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  name            text NOT NULL,
  description     text NOT NULL,
  source          text NOT NULL,
  source_type     text NOT NULL,
  tags            text[] NOT NULL DEFAULT '{}',
  situation_types text[] NOT NULL DEFAULT '{}',
  effectiveness_notes text,
  status          text NOT NULL DEFAULT 'draft',
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  repository_path text DEFAULT 'knowledge/templates/framework.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE concepts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  name            text NOT NULL,
  definition      text NOT NULL,
  source          text,
  tags            text[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'draft',
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  repository_path text DEFAULT 'knowledge/templates/concept.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE knowledge_references (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  topic           text NOT NULL,
  summary         text NOT NULL,
  derived_from    text NOT NULL,
  derivation_type text NOT NULL,
  tags            text[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'draft',
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  repository_path text DEFAULT 'knowledge/templates/reference.md',
  source_document text DEFAULT 'architecture/2 - ApexOS - Foundations Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Memory layer (Build 03)
-- ---------------------------------------------------------------------------

CREATE TABLE observations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  summary         text NOT NULL,
  confidence      confidence_level NOT NULL DEFAULT 'low',
  related_person_id uuid REFERENCES persons(id) ON DELETE SET NULL,
  related_relationship_id uuid REFERENCES relationships(id) ON DELETE SET NULL,
  related_situation_id uuid REFERENCES situations(id) ON DELETE SET NULL,
  observation_date date,
  observed_by     text,
  review_status   text NOT NULL DEFAULT 'draft',
  promotion_target memory_category,
  architecture_layer text NOT NULL DEFAULT 'memory',
  repository_path text DEFAULT 'memory/templates/observation.md',
  source_document text DEFAULT 'architecture/3 - ApexOS - Memory Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memory_artifacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  category        memory_category NOT NULL,
  title           text NOT NULL,
  summary         text NOT NULL,
  confidence      confidence_level,
  person_id       uuid REFERENCES persons(id) ON DELETE SET NULL,
  relationship_id uuid REFERENCES relationships(id) ON DELETE SET NULL,
  situation_id    uuid REFERENCES situations(id) ON DELETE SET NULL,
  decision_id     uuid REFERENCES decisions(id) ON DELETE SET NULL,
  pattern_id      uuid REFERENCES patterns(id) ON DELETE SET NULL,
  person_slug     text,
  situation_type  text,
  decision_date   date,
  outcome_date    date,
  outcome_type    text,
  pattern_type    text,
  reinforcement_status text,
  review_status   text NOT NULL DEFAULT 'draft',
  last_reviewed   date,
  tags            text[] NOT NULL DEFAULT '{}',
  architecture_layer text NOT NULL DEFAULT 'memory',
  repository_path text NOT NULL,
  source_document text DEFAULT 'architecture/3 - ApexOS - Memory Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promotion_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  promotion_date  date NOT NULL,
  promotion_type  text NOT NULL,
  from_observation_id uuid REFERENCES observations(id) ON DELETE SET NULL,
  from_memory_id  uuid REFERENCES memory_artifacts(id) ON DELETE SET NULL,
  to_memory_id    uuid REFERENCES memory_artifacts(id) ON DELETE SET NULL,
  from_stage      text NOT NULL,
  to_stage        text NOT NULL,
  target_category memory_category,
  reviewed_by     text,
  approval_status text NOT NULL DEFAULT 'pending',
  rationale       text NOT NULL,
  confidence_assigned confidence_level,
  architecture_layer text NOT NULL DEFAULT 'memory',
  repository_path text DEFAULT 'memory/templates/promotion-record.md',
  source_document text DEFAULT 'architecture/3 - ApexOS - Memory Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  review_status   text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outcome_references (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  related_memory_id uuid REFERENCES memory_artifacts(id) ON DELETE SET NULL,
  related_decision_id uuid REFERENCES decisions(id) ON DELETE SET NULL,
  related_outcome_capture_id uuid,
  summary         text NOT NULL,
  outcome_type    text,
  outcome_date    date,
  validation_impact text,
  confidence_impact text,
  architecture_layer text NOT NULL DEFAULT 'memory',
  repository_path text DEFAULT 'memory/templates/outcome-reference.md',
  source_document text DEFAULT 'architecture/3 - ApexOS - Memory Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'active',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Context layer (Build 04)
-- ---------------------------------------------------------------------------

CREATE TABLE context_evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  domain          context_domain NOT NULL,
  title           text NOT NULL,
  situation_summary text NOT NULL,
  evaluation_date date NOT NULL,
  related_situation_id uuid REFERENCES situations(id) ON DELETE SET NULL,
  domains_evaluated context_domain[] NOT NULL DEFAULT '{}',
  domains_excluded context_domain[] NOT NULL DEFAULT '{}',
  review_status   text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'context',
  repository_path text DEFAULT 'context/templates/context-evaluation.md',
  source_document text DEFAULT 'architecture/4 - ApexOS - Context Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE context_relevance_specs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  domain          context_domain NOT NULL DEFAULT 'situation',
  title           text NOT NULL,
  situation_summary text NOT NULL,
  evaluation_date date NOT NULL,
  related_situation_id uuid REFERENCES situations(id) ON DELETE SET NULL,
  domain_weights  jsonb NOT NULL DEFAULT '{}'::jsonb,
  weighting_rationale text NOT NULL,
  retrieval_tiers jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_status   text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'context',
  repository_path text DEFAULT 'context/templates/context-package.md',
  source_document text DEFAULT 'architecture/4 - ApexOS - Context Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Retrieval layer (Build 04)
-- ---------------------------------------------------------------------------

CREATE TABLE retrieval_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  request_date    date NOT NULL,
  context_reference_id uuid NOT NULL REFERENCES context_relevance_specs(id) ON DELETE RESTRICT,
  retrieval_targets text[] NOT NULL DEFAULT '{}',
  scope_summary   text NOT NULL,
  tier_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  exclusions      text[] NOT NULL DEFAULT '{}',
  contradictory_evidence_required boolean NOT NULL DEFAULT true,
  validation_status text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'retrieval',
  repository_path text DEFAULT 'retrieval/templates/retrieval-request.md',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evidence_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  assembly_date   date NOT NULL,
  retrieval_request_id uuid NOT NULL REFERENCES retrieval_requests(id) ON DELETE RESTRICT,
  context_reference_id uuid NOT NULL REFERENCES context_relevance_specs(id) ON DELETE RESTRICT,
  assembly_tiers  jsonb NOT NULL DEFAULT '{}'::jsonb,
  exclusions      jsonb NOT NULL DEFAULT '[]'::jsonb,
  gaps            jsonb NOT NULL DEFAULT '[]'::jsonb,
  architecture_layer text NOT NULL DEFAULT 'retrieval',
  repository_path text DEFAULT 'retrieval/templates/evidence-package.md',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'assembled',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contradictory_evidence_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  retrieval_request_id uuid REFERENCES retrieval_requests(id) ON DELETE SET NULL,
  conflicting_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution_status text NOT NULL DEFAULT 'open',
  architecture_layer text NOT NULL DEFAULT 'retrieval',
  repository_path text DEFAULT 'retrieval/templates/contradictory-evidence.md',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assembled_context_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  assembly_date   date NOT NULL,
  retrieval_request_id uuid NOT NULL REFERENCES retrieval_requests(id) ON DELETE RESTRICT,
  evidence_package_id uuid NOT NULL REFERENCES evidence_packages(id) ON DELETE RESTRICT,
  context_reference_id uuid NOT NULL REFERENCES context_relevance_specs(id) ON DELETE RESTRICT,
  assembly_tiers  jsonb NOT NULL DEFAULT '{}'::jsonb,
  architecture_layer text NOT NULL DEFAULT 'retrieval',
  repository_path text DEFAULT 'retrieval/docs/context-package-assembly.md',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'delivered',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Link context relevance spec to retrieval request after handoff
ALTER TABLE context_relevance_specs
  ADD COLUMN retrieval_request_id uuid REFERENCES retrieval_requests(id) ON DELETE SET NULL;

ALTER TABLE retrieval_requests
  ADD COLUMN evidence_package_id uuid REFERENCES evidence_packages(id) ON DELETE SET NULL,
  ADD COLUMN assembled_context_package_id uuid REFERENCES assembled_context_packages(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Inference layer (Build 05)
-- ---------------------------------------------------------------------------

CREATE TABLE interpretation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  interpretation_date date NOT NULL,
  assembled_context_package_id uuid NOT NULL REFERENCES assembled_context_packages(id) ON DELETE RESTRICT,
  retrieval_request_id uuid REFERENCES retrieval_requests(id) ON DELETE SET NULL,
  context_reference_id uuid REFERENCES context_relevance_specs(id) ON DELETE SET NULL,
  confidence_summary confidence_level,
  uncertainty_flags text[] NOT NULL DEFAULT '{}',
  review_status   text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'inference',
  repository_path text DEFAULT 'inference/templates/interpretation-package-template.md',
  source_document text DEFAULT 'architecture/7 - ApexOS - Inference Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inference_components (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  component_type  inference_component_type NOT NULL,
  title           text NOT NULL,
  interpretation_package_id uuid NOT NULL REFERENCES interpretation_packages(id) ON DELETE CASCADE,
  architecture_layer text NOT NULL DEFAULT 'inference',
  repository_path text NOT NULL,
  source_document text DEFAULT 'architecture/7 - ApexOS - Inference Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Recommendation layer (Build 06)
-- ---------------------------------------------------------------------------

CREATE TABLE recommendation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  recommendation_date date NOT NULL,
  interpretation_package_id uuid NOT NULL REFERENCES interpretation_packages(id) ON DELETE RESTRICT,
  assembled_context_package_id uuid REFERENCES assembled_context_packages(id) ON DELETE SET NULL,
  retrieval_request_id uuid REFERENCES retrieval_requests(id) ON DELETE SET NULL,
  context_reference_id uuid REFERENCES context_relevance_specs(id) ON DELETE SET NULL,
  confidence_summary confidence_level,
  uncertainty_flags text[] NOT NULL DEFAULT '{}',
  review_status   text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'recommendation',
  repository_path text DEFAULT 'recommendation/templates/recommendation-package-template.md',
  source_document text DEFAULT 'architecture/8 - ApexOS - Recommendation Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recommendation_components (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  component_type  recommendation_component_type NOT NULL,
  title           text NOT NULL,
  recommendation_package_id uuid NOT NULL REFERENCES recommendation_packages(id) ON DELETE CASCADE,
  architecture_layer text NOT NULL DEFAULT 'recommendation',
  repository_path text NOT NULL,
  source_document text DEFAULT 'architecture/8 - ApexOS - Recommendation Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Outcomes layer (Build 07)
-- ---------------------------------------------------------------------------

CREATE TABLE outcome_captures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  capture_date    date NOT NULL,
  recommendation_package_id uuid NOT NULL REFERENCES recommendation_packages(id) ON DELETE RESTRICT,
  interpretation_package_id uuid REFERENCES interpretation_packages(id) ON DELETE SET NULL,
  assembled_context_package_id uuid REFERENCES assembled_context_packages(id) ON DELETE SET NULL,
  executive_decision_reference text,
  recommendation_followed text,
  action_taken    text NOT NULL,
  observed_outcome text NOT NULL,
  measurable_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  unexpected_consequences jsonb NOT NULL DEFAULT '[]'::jsonb,
  capture_method  text,
  architecture_layer text NOT NULL DEFAULT 'outcomes',
  repository_path text DEFAULT 'outcomes/templates/outcome-capture-template.md',
  source_document text DEFAULT 'architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outcome_references
  ADD CONSTRAINT outcome_references_outcome_capture_fk
  FOREIGN KEY (related_outcome_capture_id) REFERENCES outcome_captures(id) ON DELETE SET NULL;

CREATE TABLE validation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  validation_date date NOT NULL,
  recommendation_package_id uuid NOT NULL REFERENCES recommendation_packages(id) ON DELETE RESTRICT,
  interpretation_package_id uuid REFERENCES interpretation_packages(id) ON DELETE SET NULL,
  assembled_context_package_id uuid REFERENCES assembled_context_packages(id) ON DELETE SET NULL,
  retrieval_request_id uuid REFERENCES retrieval_requests(id) ON DELETE SET NULL,
  context_reference_id uuid REFERENCES context_relevance_specs(id) ON DELETE SET NULL,
  outcome_capture_id uuid NOT NULL REFERENCES outcome_captures(id) ON DELETE RESTRICT,
  executive_decision_reference text,
  action_taken_summary text,
  observed_outcome_summary text,
  validation_summary text,
  review_status   text NOT NULL DEFAULT 'pending',
  architecture_layer text NOT NULL DEFAULT 'outcomes',
  repository_path text DEFAULT 'outcomes/templates/validation-package-template.md',
  source_document text DEFAULT 'architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outcome_captures
  ADD COLUMN related_validation_package_id uuid REFERENCES validation_packages(id) ON DELETE SET NULL;

CREATE TABLE outcome_components (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  component_type  outcome_component_type NOT NULL,
  title           text NOT NULL,
  validation_package_id uuid NOT NULL REFERENCES validation_packages(id) ON DELETE CASCADE,
  architecture_layer text NOT NULL DEFAULT 'outcomes',
  repository_path text NOT NULL,
  source_document text DEFAULT 'architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learning_updates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  learning_date   date NOT NULL,
  validation_package_id uuid NOT NULL REFERENCES validation_packages(id) ON DELETE RESTRICT,
  outcome_capture_id uuid NOT NULL REFERENCES outcome_captures(id) ON DELETE RESTRICT,
  learning_type   text NOT NULL,
  validation_basis text NOT NULL,
  promotion_status text NOT NULL DEFAULT 'pending',
  promoted_to_memory_id uuid REFERENCES memory_artifacts(id) ON DELETE SET NULL,
  architecture_layer text NOT NULL DEFAULT 'outcomes',
  repository_path text DEFAULT 'outcomes/templates/learning-update-template.md',
  source_document text DEFAULT 'architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE validation_packages
  ADD COLUMN learning_promoted_id uuid REFERENCES learning_updates(id) ON DELETE SET NULL;

CREATE TABLE reinforcement_updates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  validation_package_id uuid NOT NULL REFERENCES validation_packages(id) ON DELETE RESTRICT,
  pattern_id      uuid REFERENCES patterns(id) ON DELETE SET NULL,
  prior_confidence confidence_level,
  new_confidence  confidence_level,
  reinforcement_action text,
  architecture_layer text NOT NULL DEFAULT 'outcomes',
  repository_path text DEFAULT 'outcomes/templates/reinforcement-update-template.md',
  source_document text DEFAULT 'architecture/9 - ApexOS - Outcome & Results Architect v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'draft',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_md         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Cross-cutting traceability
-- ---------------------------------------------------------------------------

CREATE TABLE artifact_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  title           text NOT NULL,
  architecture_layer text NOT NULL,
  table_name      text NOT NULL,
  record_id       uuid NOT NULL,
  repository_path text,
  status          text NOT NULL DEFAULT 'draft',
  superseded_by_id uuid REFERENCES artifact_registry(id) ON DELETE SET NULL,
  schema_version  text NOT NULL DEFAULT '1.0',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (table_name, record_id)
);

CREATE TABLE artifact_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table    text NOT NULL,
  source_id       uuid NOT NULL,
  target_table    text NOT NULL,
  target_id       uuid NOT NULL,
  link_type       artifact_link_type NOT NULL DEFAULT 'other',
  tier            tier_level,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_persons_slug ON persons(slug);
CREATE INDEX idx_situations_slug ON situations(slug);
CREATE INDEX idx_decisions_situation ON decisions(situation_id);
CREATE INDEX idx_decisions_date ON decisions(decision_date);
CREATE INDEX idx_memory_artifacts_category ON memory_artifacts(category);
CREATE INDEX idx_memory_artifacts_person ON memory_artifacts(person_id);
CREATE INDEX idx_memory_artifacts_situation ON memory_artifacts(situation_id);
CREATE INDEX idx_observations_review ON observations(review_status);
CREATE INDEX idx_context_relevance_status ON context_relevance_specs(status);
CREATE INDEX idx_retrieval_requests_context ON retrieval_requests(context_reference_id);
CREATE INDEX idx_retrieval_requests_status ON retrieval_requests(status);
CREATE INDEX idx_evidence_packages_request ON evidence_packages(retrieval_request_id);
CREATE INDEX idx_assembled_context_request ON assembled_context_packages(retrieval_request_id);
CREATE INDEX idx_interpretation_context ON interpretation_packages(assembled_context_package_id);
CREATE INDEX idx_recommendation_interpretation ON recommendation_packages(interpretation_package_id);
CREATE INDEX idx_outcome_capture_recommendation ON outcome_captures(recommendation_package_id);
CREATE INDEX idx_validation_outcome ON validation_packages(outcome_capture_id);
CREATE INDEX idx_learning_promotion ON learning_updates(promotion_status);
CREATE INDEX idx_artifact_links_source ON artifact_links(source_table, source_id);
CREATE INDEX idx_artifact_links_target ON artifact_links(target_table, target_id);
CREATE INDEX idx_artifact_registry_layer ON artifact_registry(architecture_layer);
CREATE INDEX idx_artifact_registry_status ON artifact_registry(status);
CREATE INDEX idx_knowledge_sources_status ON knowledge_sources(status);
CREATE INDEX idx_frameworks_status ON frameworks(status);
