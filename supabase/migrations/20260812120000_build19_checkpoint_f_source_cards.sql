-- Build 19 Checkpoint F — source-card lineage & catalog fields (local only; not hosted deploy)
-- Additive extensions to knowledge_source_cards. Cards remain derived_catalog, never evidence.

ALTER TABLE knowledge_source_cards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS coverage_status text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS input_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS input_manifest_hash text,
  ADD COLUMN IF NOT EXISTS input_extraction_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS retrieval_cues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS response_id text,
  ADD COLUMN IF NOT EXISTS supersedes_card_id uuid REFERENCES knowledge_source_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS searchable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS catalog_summary text,
  ADD COLUMN IF NOT EXISTS format_label text,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN knowledge_source_cards.epistemic_type IS
  'Always derived_catalog — never source_evidence; never citation-eligible; never authority/learning.';
COMMENT ON COLUMN knowledge_source_cards.status IS
  'generated | generated_partial | withheld | unavailable | failed';
COMMENT ON COLUMN knowledge_source_cards.coverage_status IS
  'full | partial — partial means the card must not claim complete-source summary.';
COMMENT ON COLUMN knowledge_source_cards.searchable IS
  'False when withheld/failed/invalid — card must not inform candidate recall.';
COMMENT ON COLUMN knowledge_source_cards.input_manifest IS
  'Included representations, locators, omitted/blocked portions, selection limits.';

CREATE INDEX IF NOT EXISTS idx_knowledge_source_cards_manifest_hash
  ON knowledge_source_cards(knowledge_source_id, input_manifest_hash, process_version)
  WHERE searchable = true;
