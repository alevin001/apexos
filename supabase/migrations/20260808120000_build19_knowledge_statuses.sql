-- Build 19 — Checkpoints A/B: statuses, preserve-only, source cards, lineage fields
-- Additive only. Does not redefine architecture tables or doctrine.

-- ---------------------------------------------------------------------------
-- knowledge_sources — import/status/lineage fields
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS document_identity text,
  ADD COLUMN IF NOT EXISTS handling_path text,
  ADD COLUMN IF NOT EXISTS material_limitations text;

COMMENT ON COLUMN knowledge_sources.document_identity IS
  'Build 19 — explicit stable document identity for version linking. Never inferred from filename/path.';
COMMENT ON COLUMN knowledge_sources.handling_path IS
  'Build 19 — classified handling path (extractable_native, preserve_only_*, email_message, deferred_mailbox_container, …).';
COMMENT ON COLUMN knowledge_sources.material_limitations IS
  'Build 19 — visible material extraction/storage limitations.';

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_document_identity
  ON knowledge_sources(document_identity)
  WHERE document_identity IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Extractions — representation kind + lineage (source cards are NOT stored here as evidence)
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_source_extractions
  ADD COLUMN IF NOT EXISTS representation_kind text NOT NULL DEFAULT 'native_text',
  ADD COLUMN IF NOT EXISTS epistemic_type text NOT NULL DEFAULT 'source_evidence',
  ADD COLUMN IF NOT EXISTS content_hash_of_original text,
  ADD COLUMN IF NOT EXISTS attempt_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS process_version text,
  ADD COLUMN IF NOT EXISTS provider_name text,
  ADD COLUMN IF NOT EXISTS provider_model text,
  ADD COLUMN IF NOT EXISTS locator jsonb,
  ADD COLUMN IF NOT EXISTS coverage jsonb;

COMMENT ON COLUMN knowledge_source_extractions.representation_kind IS
  'Build 19 — native_text | deterministic_parser | vision_transcription | vision_visual_description | provided_text. Source cards use knowledge_source_cards.';
COMMENT ON COLUMN knowledge_source_extractions.epistemic_type IS
  'Build 19 — source_evidence for extractive units. derived_catalog must not be used here for citable evidence.';

-- ---------------------------------------------------------------------------
-- Retrieval units — locator + method
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_retrieval_units
  ADD COLUMN IF NOT EXISTS locator jsonb,
  ADD COLUMN IF NOT EXISTS extraction_method text,
  ADD COLUMN IF NOT EXISTS material_limitation text;

COMMENT ON COLUMN knowledge_retrieval_units.epistemic_type IS
  'Always source_evidence for retrieval units — never source_card / derived_catalog.';

-- ---------------------------------------------------------------------------
-- Source cards — derived catalog representations (NOT source_evidence)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_source_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  knowledge_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  extraction_id   uuid REFERENCES knowledge_source_extractions(id) ON DELETE SET NULL,
  representation_kind text NOT NULL DEFAULT 'source_card',
  epistemic_type  text NOT NULL DEFAULT 'derived_catalog'
                    CHECK (epistemic_type = 'derived_catalog'),
  description     text NOT NULL,
  apparent_purpose text NOT NULL,
  document_type   text NOT NULL,
  material_limitations text,
  provider_name   text,
  provider_model  text,
  process_version text NOT NULL DEFAULT 'build19-source-card-1.0',
  content_hash_of_original text,
  attempt_version integer NOT NULL DEFAULT 1,
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source_cards_source
  ON knowledge_source_cards(knowledge_source_id);

COMMENT ON TABLE knowledge_source_cards IS
  'Build 19 — neutral source cards (derived catalog). May improve recall; never citable as evidence; never assign authority.';

-- ---------------------------------------------------------------------------
-- Expand ingestion_run_items dispositions for Build 19
-- ---------------------------------------------------------------------------

ALTER TABLE ingestion_run_items DROP CONSTRAINT IF EXISTS ingestion_run_items_disposition_check;
ALTER TABLE ingestion_run_items
  ADD CONSTRAINT ingestion_run_items_disposition_check
  CHECK (disposition IN (
    'pending', 'would_ingest', 'ingested', 'duplicate',
    'failed', 'unsupported', 'skipped', 'deferred_extraction',
    'preserve_only', 'blocked_changed', 'deferred_mailbox'
  ));

-- ---------------------------------------------------------------------------
-- Storage MIME allowlist — preserve-only + email
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
  'image/webp',
  'message/rfc822',
  'application/vnd.ms-outlook',
  'application/vnd.ms-outlook-pst',
  'application/vnd.ms-outlook-ost',
  'application/octet-stream'
]
WHERE id = 'knowledge-source-material';

-- ---------------------------------------------------------------------------
-- RLS for source cards
-- ---------------------------------------------------------------------------

ALTER TABLE knowledge_source_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'knowledge_source_cards'
      AND policyname = 'apexos_authenticated_select'
  ) THEN
    CREATE POLICY apexos_authenticated_select ON public.knowledge_source_cards
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY apexos_authenticated_insert ON public.knowledge_source_cards
      FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY apexos_authenticated_update ON public.knowledge_source_cards
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY apexos_authenticated_delete ON public.knowledge_source_cards
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

REVOKE ALL ON TABLE knowledge_source_cards FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE knowledge_source_cards TO authenticated;
