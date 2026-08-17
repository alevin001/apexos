-- Build 19 Checkpoint E — email attachment lineage (local migration only; not hosted deploy)
-- Additive. Many-to-many parent email ↔ attachment child sources.
-- Canonical lineage is ONLY knowledge_source_attachment_links (not a single parent column).

CREATE TABLE IF NOT EXISTS knowledge_source_attachment_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text NOT NULL UNIQUE,
  parent_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  child_source_id  uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  attachment_ordinal integer NOT NULL,
  displayed_filename text NOT NULL,
  declared_mime_type text,
  mime_part_path  text,
  content_id      text,
  inline_status   boolean NOT NULL DEFAULT false,
  content_hash    text NOT NULL,
  child_was_duplicate boolean NOT NULL DEFAULT false,
  material_limitations text,
  architecture_layer text NOT NULL DEFAULT 'knowledge',
  schema_version  text NOT NULL DEFAULT '1.0',
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_source_id, attachment_ordinal)
);

CREATE INDEX IF NOT EXISTS idx_ks_attach_links_parent
  ON knowledge_source_attachment_links(parent_source_id);
CREATE INDEX IF NOT EXISTS idx_ks_attach_links_child
  ON knowledge_source_attachment_links(child_source_id);
CREATE INDEX IF NOT EXISTS idx_ks_attach_links_hash
  ON knowledge_source_attachment_links(content_hash);

COMMENT ON TABLE knowledge_source_attachment_links IS
  'Build 19 E — CANONICAL many-to-many email parent ↔ attachment child lineage. Exact duplicate attachments share one child source with multiple parent links. Do not use a single parent column for lineage/retrieval/Glass Box.';

ALTER TABLE knowledge_source_attachment_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'knowledge_source_attachment_links'
      AND policyname = 'apexos_authenticated_select'
  ) THEN
    CREATE POLICY apexos_authenticated_select ON public.knowledge_source_attachment_links
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY apexos_authenticated_insert ON public.knowledge_source_attachment_links
      FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY apexos_authenticated_update ON public.knowledge_source_attachment_links
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY apexos_authenticated_delete ON public.knowledge_source_attachment_links
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

REVOKE ALL ON TABLE knowledge_source_attachment_links FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE knowledge_source_attachment_links TO authenticated;
