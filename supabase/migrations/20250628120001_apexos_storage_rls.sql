-- ApexOS Build 08 — Storage buckets and Row Level Security
-- Single-executive MVP: authenticated users access all rows.
-- Service role bypasses RLS for ingestion and admin operations.

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'knowledge-source-material',
    'knowledge-source-material',
    false,
    52428800,
    ARRAY[
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/vtt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
  ),
  (
    'apexos-artifacts',
    'apexos-artifacts',
    false,
    10485760,
    ARRAY['text/markdown', 'application/json', 'text/plain']
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Enable RLS on all ApexOS tables
-- ---------------------------------------------------------------------------

ALTER TABLE executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_relevance_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictory_evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembled_context_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inference_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_links ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS policies — authenticated full access (single-executive MVP)
-- Application layer enforces historical integrity and category separation.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'executives', 'persons', 'relationships', 'relationship_participants',
      'situations', 'decisions', 'patterns',
      'knowledge_sources', 'frameworks', 'concepts', 'knowledge_references',
      'observations', 'memory_artifacts', 'promotion_records', 'outcome_references',
      'context_evaluations', 'context_relevance_specs',
      'retrieval_requests', 'evidence_packages', 'contradictory_evidence_records',
      'assembled_context_packages',
      'interpretation_packages', 'inference_components',
      'recommendation_packages', 'recommendation_components',
      'outcome_captures', 'validation_packages', 'outcome_components',
      'learning_updates', 'reinforcement_updates',
      'artifact_registry', 'artifact_links'
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

-- ---------------------------------------------------------------------------
-- Storage RLS — authenticated read/write on private buckets
-- ---------------------------------------------------------------------------

CREATE POLICY apexos_storage_select
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('knowledge-source-material', 'apexos-artifacts'));

CREATE POLICY apexos_storage_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('knowledge-source-material', 'apexos-artifacts'));

CREATE POLICY apexos_storage_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('knowledge-source-material', 'apexos-artifacts'))
  WITH CHECK (bucket_id IN ('knowledge-source-material', 'apexos-artifacts'));

CREATE POLICY apexos_storage_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('knowledge-source-material', 'apexos-artifacts'));

-- ---------------------------------------------------------------------------
-- Revoke anonymous access to public schema tables (defense in depth)
-- ---------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
