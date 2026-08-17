-- Build 19 Checkpoint D — governed vision lineage fields (local migration only; not hosted deploy)
-- Additive. Does not redefine architecture tables.

ALTER TABLE knowledge_source_extractions
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS response_id text,
  ADD COLUMN IF NOT EXISTS extracted_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN knowledge_source_extractions.prompt_version IS
  'Build 19 D — vision/prompt schema version for derived representation lineage.';
COMMENT ON COLUMN knowledge_source_extractions.response_id IS
  'Build 19 D — provider response id when available (ingestion-stage provider only).';
COMMENT ON COLUMN knowledge_source_extractions.coverage IS
  'Build 19 — page/image coverage including pageCoverage[] method and status per locator.';

COMMENT ON COLUMN knowledge_sources.handling_path IS
  'Build 19 — classified handling path (extractable_native, vision_assisted, preserve_only_*, email_message, deferred_mailbox_container, …).';
