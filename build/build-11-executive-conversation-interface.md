# Build 11 — Executive Conversation Interface

**Status:** Complete  
**Date:** 2026-06-29

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Executive Conversation Adapter | `apps/executive-ui/src/adapter/` |
| Situation extraction | `adapter/situation-extractor.ts` |
| Clarification workflow | `adapter/clarification-engine.ts` |
| Conversation classification | `adapter/conversation-classifier.ts` |
| Response composition | `adapter/response-composer.ts` |
| Runtime invocation | `services/runtime-invocation-service.ts` |
| Conversation persistence | `services/conversation-service.ts` |
| Conversation UI | `components/ConversationInterface.tsx` |
| API routes | `app/api/conversations/` |
| Schema migration | `supabase/migrations/20250629120000_build11_conversations.sql` |

## Architecture

The conversation layer is a thin adapter that:

1. Accepts natural language from the executive
2. Classifies conversation intent (executive work vs casual chat)
3. Extracts a canonical Situation Package
4. Requests clarification when required fields are missing
5. Creates a situation and invokes the existing runtime via ingestion + read services
6. Composes conversational responses from runtime artifacts
7. Integrates Glass Box links for every pipeline execution
8. Supports lifecycle: Conversation → Situation → Decision → Outcome → Learning

The adapter does **not** perform retrieval, inference, recommendation generation, or learning.

## Runtime Invocation

`runtime-invocation-service.ts` invokes Build 09 ingestion for template-matched scenarios, links the pipeline to the conversation-created situation, and reads results through existing `pipeline-service` and `reasoning-service`.

## Verification

```bash
cd scripts && npm run loop:scenario
cd apps/executive-ui && npm install && npm run build
cd apps/executive-ui && npm run dev
```

Open http://localhost:3010 and describe an executive situation in natural language.

Apply migration:

```bash
supabase db push
```

## Acceptance Criteria

- [x] Executive can describe a situation naturally
- [x] Canonical Situation Package automatically created
- [x] Missing information requested before reasoning
- [x] Existing runtime executes unchanged (ingestion + read path)
- [x] Executive Glass Box fully available
- [x] Recommendations separate from executive decisions
- [x] Conversation lifecycle integrates with Outcome and Learning
- [x] No architectural principles violated
- [x] Conversation interface is primary front door
