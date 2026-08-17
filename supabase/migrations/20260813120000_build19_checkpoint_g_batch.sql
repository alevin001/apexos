-- Build 19 Checkpoint G — batch-import readiness (local only; do not apply to hosted Supabase).
-- Operational provenance for provider mode on ingestion runs. No evidence/retrieval semantics.

ALTER TABLE IF EXISTS public.ingestion_runs
  ADD COLUMN IF NOT EXISTS provider_mode text;

COMMENT ON COLUMN public.ingestion_runs.provider_mode IS
  'Build 19 G: live | test_mock | disabled — operational only; batch manifest/receipt never retrieval-eligible.';
