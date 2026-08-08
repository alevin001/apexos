-- Build 18 — Knowledge Base, Ingestion, and Daily Learning Workflow
-- Additive schema for governed source ingestion. Does not redefine architecture tables.
-- Original sources remain distinct from extractions, retrieval units, and derived content.

-- ---------------------------------------------------------------------------
-- Extend knowledge_sources with ingestion / governance fields
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS byte_size bigint,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS ingestion_method text,
  ADD COLUMN IF NOT EXISTS ingested_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_owner text,
  ADD COLUMN IF NOT EXISTS source_location text,
  ADD COLUMN IF NOT EXISTS authority_classification text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS scope_classification text,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS integrity_status text NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS integrity_detail text,
  ADD COLUMN IF NOT EXISTS original_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retrieval_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaces_source_id uuid REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_run_id uuid;

COMMENT ON COLUMN knowledge_sources.authority_classification IS
  'Build 18 — authority label (e.g. unverified, executive_material, architecture). Relevance ≠ authority.';
COMMENT ON COLUMN knowledge_sources.extraction_status IS
  'Build 18 — pending | extracted | deferred | failed | unsupported | skipped';
COMMENT ON COLUMN knowledge_sources.processing_status IS
  'Build 18 — pending | registered | stored | processed | failed | duplicate_skipped';
COMMENT ON COLUMN knowledge_sources.content_hash IS
  'Build 18 — sha256 of original bytes for duplicate detection without deleting originals';

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_content_hash
  ON knowledge_sources(content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_processing
  ON knowledge_sources(processing_status, extraction_status);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_retrieval_ready
  ON knowledge_sources(retrieval_ready)
  WHERE retrieval_ready = true;

-- ---------------------------------------------------------------------------
-- Extractions — derived text, never treated as the original source
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_source_extractions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  knowledge_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  extraction_method text NOT NULL,
  extractor_version text NOT NULL DEFAULT '1.0',
  status          text NOT NULL DEFAULT 'extracted',
  mime_type       text,
  character_count integer,
  extracted_text  text,
  limitation      text,
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_extractions_source
  ON knowledge_source_extractions(knowledge_source_id);

COMMENT ON TABLE knowledge_source_extractions IS
  'Build 18 — extracted text derived from a knowledge source. Not the original.';

-- ---------------------------------------------------------------------------
-- Retrieval units — chunked units with provenance back to source
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_retrieval_units (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  knowledge_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  extraction_id   uuid REFERENCES knowledge_source_extractions(id) ON DELETE SET NULL,
  unit_index      integer NOT NULL DEFAULT 0,
  content         text NOT NULL,
  content_preview text,
  character_count integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active',
  epistemic_type  text NOT NULL DEFAULT 'source_evidence',
  architecture_layer text NOT NULL DEFAULT 'retrieval',
  source_document text DEFAULT 'architecture/5 - ApexOS - Retrieval Architecture v1.0.docx',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_source_id, unit_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_retrieval_units_source
  ON knowledge_retrieval_units(knowledge_source_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_retrieval_units_status
  ON knowledge_retrieval_units(status)
  WHERE status = 'active';

COMMENT ON TABLE knowledge_retrieval_units IS
  'Build 18 — retrieval units derived from extraction. Provenance always links to knowledge_sources.';

COMMENT ON COLUMN knowledge_retrieval_units.epistemic_type IS
  'Always source_evidence for Build 18 units — never interpretation/recommendation/decision/outcome.';

-- ---------------------------------------------------------------------------
-- Ingestion runs — bulk/single import receipts and resumability
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  mode            text NOT NULL CHECK (mode IN ('dry_run', 'execute')),
  method          text NOT NULL,
  root_path       text,
  manifest_path   text,
  status          text NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  dry_run         boolean NOT NULL DEFAULT false,
  files_discovered integer NOT NULL DEFAULT 0,
  files_ingested  integer NOT NULL DEFAULT 0,
  files_duplicate integer NOT NULL DEFAULT 0,
  files_failed    integer NOT NULL DEFAULT 0,
  files_pending   integer NOT NULL DEFAULT 0,
  files_skipped   integer NOT NULL DEFAULT 0,
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  operator_notes  text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started
  ON ingestion_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS ingestion_run_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid NOT NULL REFERENCES ingestion_runs(id) ON DELETE CASCADE,
  source_path     text NOT NULL,
  original_filename text,
  content_hash    text,
  disposition     text NOT NULL
                    CHECK (disposition IN (
                      'pending', 'would_ingest', 'ingested', 'duplicate',
                      'failed', 'unsupported', 'skipped', 'deferred_extraction'
                    )),
  knowledge_source_id uuid REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  duplicate_of_source_id uuid REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  reason          text,
  receipt         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, source_path)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_run_items_run
  ON ingestion_run_items(run_id);

CREATE INDEX IF NOT EXISTS idx_ingestion_run_items_hash
  ON ingestion_run_items(content_hash)
  WHERE content_hash IS NOT NULL;

ALTER TABLE knowledge_sources
  ADD CONSTRAINT knowledge_sources_batch_run_id_fkey
  FOREIGN KEY (batch_run_id) REFERENCES ingestion_runs(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Storage MIME allowlist expansion (spreadsheets, CSV, JSON)
-- ---------------------------------------------------------------------------

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/vtt',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'image/webp'
]
WHERE id = 'knowledge-source-material';

-- ---------------------------------------------------------------------------
-- RLS for new tables (same authenticated MVP pattern as Build 08)
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_source_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_retrieval_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_run_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'knowledge_source_extractions',
      'knowledge_retrieval_units',
      'ingestion_runs',
      'ingestion_run_items'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY apexos_authenticated_select ON public.%I FOR SELECT TO authenticated USING (true)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY apexos_authenticated_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY apexos_authenticated_update ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY apexos_authenticated_delete ON public.%I FOR DELETE TO authenticated USING (true)',
      tbl
    );
  END LOOP;
END $$;

REVOKE ALL ON TABLE knowledge_source_extractions FROM anon;
REVOKE ALL ON TABLE knowledge_retrieval_units FROM anon;
REVOKE ALL ON TABLE ingestion_runs FROM anon;
REVOKE ALL ON TABLE ingestion_run_items FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE knowledge_source_extractions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE knowledge_retrieval_units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingestion_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingestion_run_items TO authenticated;
