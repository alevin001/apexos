# Build 16 — Intelligence Fidelity & Cold-Start Continuity

**Status:** Implemented (runtime vertical slice)  
**Date:** 2026-07-26  
**Depends on:** Build 15 MCP connector connectivity

## Intent

Build 15 proved connector → runtime → Supabase connectivity. A real leadership-team continuity test then showed ApexOS was not reliably invoked for capture/retrieval, and even when invoked the runtime returned a null conversation ID and did not retrieve prior records into the Context Package.

Build 16 implements the smallest architecture-aligned slice:

`ApexOS runtime call → durable conversation → structured cold-start capture → Supabase → later retrieval → inspectable Context Package and trace`

It does **not** redesign architecture or implement the full learning/reinforcement loop.

## What changed

1. **Conversation handoff** — `buildRuntimeResponse` returns the created/reused conversation UUID (`interactionId`), not the inbound null.
2. **Message persistence** — executive + ApexOS messages always written on successful capture path; failures set `metadata.persistenceStatus = "failed"` and stage status `failed` (not silent).
3. **Structured cold-start capture** — situation, persons/relationships, source observations, and interpretive memory artifacts (finding/hypothesis/recommendation) with epistemic separation.
4. **Continuity retrieval** — when `conversationId` is supplied, prior messages + situation-linked records are relevance-bounded into labeled Context Package sections.
5. **Auditable traces** — `runtime_interaction_traces` table + message metadata + MCP `runtime_trace` lookup.
6. **Executive identity** — canonical slug remains `primary-executive`; aliases `andrew` / `andre` resolve to it; display name set to Andrew (no duplicate executive row).

## Executive identity note

| Field | Value |
|-------|--------|
| Canonical slug | `primary-executive` |
| Display name | Andrew |
| Accepted aliases | `andrew`, `andre`, `andrew-executive` |

Do not create a second `executives` row for Andrew.

## Manual validation — two-message leadership continuity

Prerequisites:
- MCP runtime running (`npm run mcp:http` in `runtime/`)
- Build 16 migration applied
- `APEXOS_RUNTIME_DRY_RUN=false` and valid `OPENAI_API_KEY` for live LLM (or dry-run for capture-only checks with stub text paths via unit tests)

### Procedure

1. Call `execute_runtime` with **no** `conversationId`, `executiveSlug: "andrew"` (or omit to use default), and a leadership message that mentions two people, alignment vs execution, healthy conflict, and rotating meeting ownership.
2. Confirm response `executionMetadata.conversationId` is a UUID (not null).
3. Confirm `executionMetadata.persistenceStatus === "persisted"`.
4. Confirm `executionMetadata.recordsCreated` includes `situations`, `observations` (source_evidence), and ideally `persons`.
5. Call `execute_runtime` again with the returned `conversationId` and a follow-up that asks what was established earlier.
6. Confirm `executionMetadata.recordsRetrieved` is non-empty and `contextItems` includes prior `conversation_messages:` / `observations:` entries.
7. Call `runtime_trace` with the second `runtimeId` and confirm conversation/situation IDs plus created/retrieved lists.

### Verification SQL

```sql
-- Latest conversations
SELECT id, external_id, executive_id, situation_id, situation_slug, created_at
FROM executive_conversations
ORDER BY created_at DESC
LIMIT 5;

-- Messages for a conversation
SELECT id, role, left(content, 120) AS preview, metadata->>'requestId' AS request_id,
       metadata->'recordsCreated' AS created, metadata->'recordsRetrieved' AS retrieved
FROM conversation_messages
WHERE conversation_id = '<CONVERSATION_UUID>'
ORDER BY created_at;

-- Durable traces
SELECT request_id, conversation_id, situation_id, status,
       records_created, records_retrieved, context_items, capture_errors, completed_at
FROM runtime_interaction_traces
ORDER BY started_at DESC
LIMIT 5;

-- Source evidence vs interpretation
SELECT external_id, title, confidence, left(summary, 120)
FROM observations
WHERE related_situation_id = '<SITUATION_UUID>'
ORDER BY created_at;

SELECT external_id, metadata->>'epistemic_type' AS epistemic_type, left(summary, 120)
FROM memory_artifacts
WHERE situation_id = '<SITUATION_UUID>'
  AND 'build16' = ANY(tags);
```

## ChatGPT / connector limitation (accurate)

Selecting the ApexOS connector in ChatGPT does **not** guarantee the model will call `execute_runtime`. Invocation is controlled by ChatGPT tool-selection behavior. Build 16 makes the runtime correct **when invoked**; it cannot force ChatGPT to call the tool. Continuity also requires the connector/client to pass back the returned `conversationId` on later turns.

## Tests

```powershell
cd runtime
npm test
npm run typecheck
```
