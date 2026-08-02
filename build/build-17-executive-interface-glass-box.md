# Build 17 — Executive Interface & Glass Box

**Status:** Implemented — **not production-ready until live natural-invocation gate passes**  
**Date:** 2026-08-01  
**Depends on:** Build 16 intelligence fidelity vertical slice  
**MCP version:** `0.17.4` — sole ChatGPT tool `apexos_conversation`; operator proofs at `/connector-activity/recent` + `/lifecycle/recent`

## Intent

Make the existing ApexOS MCP experience work as naturally as the platform permits when ApexOS is selected in ChatGPT — without redesigning doctrine, schemas, tables, or the Build 16 pipeline, and without adding a web UI.

## What changed

1. **Connector instructions + tool metadata** — Natural executive messages and follow-ups are guided to `execute_runtime`; never ask the executive for technical IDs; “Show the Glass Box” is an ApexOS path.
2. **Continuity order** — explicit ID → MCP session/process state → constrained durable fallback (same executive, active, completed trace within 6 hours) → new + disclosure.
3. **Two-line `apexosBasisDisplay`** — ApexOS Basis (confirmed invocation/capture/persistence/retrieval/trace facts) + Glass Box reminder.
4. **`glassBox` on demand** — Full structured chain from Context Package + runtime audit/trace only. Natural “Show the Glass Box” resolves the relevant completed runtime without fabricating from chat prose.
5. **Honest degradation** — Unavailable runtime, persistence failure, and retrieval failure are explicit.
6. **Additive `RuntimeResponse.contextPackage`** — Exposed for Glass Box assembly; Build 16 consumers may ignore it.

## Platform limitation (accurate)

Selecting ApexOS in ChatGPT does **not** mechanically force a tool call. Connector metadata (`apexos_conversation` + server instructions) makes executive-work invocation mandatory for the model, but a cached connector session or host tool-selection miss can still yield a non-ApexOS answer (`not_invoked`). Local tests do not prove ChatGPT refreshed tool metadata — restart MCP, confirm `/health` version, refresh tunnel, and start a new project chat after connector toggle.

Durable fallback covers missing MCP session identity within a 6-hour active+traced window for the configured executive.

## Manual validation (ChatGPT)

1. Select ApexOS in ChatGPT.
2. Send a natural executive situation (no tool name, no IDs).
3. Confirm the two-line status (**ApexOS Basis** + **Glass Box** reminder).
4. Send a short natural follow-up such as “What should I say first?”
5. Confirm reuse via `session` or `durable_fallback`, or a clear disclosure that no prior conversation was confirmed.
6. Say “Show the Glass Box.”
7. Verify records and stages against `runtime_trace` for the returned `runtimeId`.

## Tests

```powershell
cd runtime
npm test
npm run typecheck
```
