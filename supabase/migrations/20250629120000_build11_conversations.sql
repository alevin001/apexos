-- Build 11: Executive Conversation Interface
-- Conversation persistence for natural language executive interaction

CREATE TABLE IF NOT EXISTS executive_conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id       text NOT NULL UNIQUE,
  status            text NOT NULL DEFAULT 'active',
  classification    text,
  situation_id      uuid REFERENCES situations(id) ON DELETE SET NULL,
  situation_slug    text,
  situation_package jsonb,
  transformation_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES executive_conversations(id) ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('executive', 'apexos')),
  content           text NOT NULL,
  message_type      text NOT NULL DEFAULT 'text',
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_executive_conversations_status ON executive_conversations(status);
CREATE INDEX IF NOT EXISTS idx_executive_conversations_situation ON executive_conversations(situation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);

COMMENT ON TABLE executive_conversations IS 'Build 11 — executive conversation sessions linked to situations and lifecycle';
COMMENT ON TABLE conversation_messages IS 'Build 11 — messages within executive conversations';
