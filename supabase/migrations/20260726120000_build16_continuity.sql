-- Build 16: Intelligence Fidelity & Cold-Start Continuity
-- Minimal schema for conversation attribution and durable runtime traces.
-- Does not redesign architecture tables.

ALTER TABLE executive_conversations
  ADD COLUMN IF NOT EXISTS executive_id uuid REFERENCES executives(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_executive_conversations_executive
  ON executive_conversations(executive_id);

COMMENT ON COLUMN executive_conversations.executive_id IS
  'Build 16 — executive who owns this conversation (no duplicate executive rows)';

-- Durable, inspectable runtime audit trail (complements in-memory MCP traces).
CREATE TABLE IF NOT EXISTS runtime_interaction_traces (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          text NOT NULL UNIQUE,
  conversation_id     uuid REFERENCES executive_conversations(id) ON DELETE SET NULL,
  situation_id        uuid REFERENCES situations(id) ON DELETE SET NULL,
  executive_slug      text,
  tool                text NOT NULL DEFAULT 'execute_runtime',
  status              text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  stages              jsonb NOT NULL DEFAULT '[]'::jsonb,
  records_created     jsonb NOT NULL DEFAULT '[]'::jsonb,
  records_retrieved   jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_items       jsonb NOT NULL DEFAULT '[]'::jsonb,
  capture_errors      jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_runtime_traces_conversation
  ON runtime_interaction_traces(conversation_id);
CREATE INDEX IF NOT EXISTS idx_runtime_traces_situation
  ON runtime_interaction_traces(situation_id);
CREATE INDEX IF NOT EXISTS idx_runtime_traces_started
  ON runtime_interaction_traces(started_at DESC);

COMMENT ON TABLE runtime_interaction_traces IS
  'Build 16 — durable runtime request audit: created/retrieved record IDs and context items supplied to the model';

-- Canonical executive remains slug primary-executive; display name corrected for Andrew.
UPDATE executives
SET display_name = 'Andrew',
    summary = 'Primary ApexOS executive (Andrew). Canonical slug: primary-executive. Alias: andrew.',
    updated_at = now()
WHERE slug = 'primary-executive'
  AND display_name IS DISTINCT FROM 'Andrew';
