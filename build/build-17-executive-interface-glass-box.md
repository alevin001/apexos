# Build 17 — Executive Interface & Glass Box

**Status:** Implemented (MCP interface layer)  
**Date:** 2026-08-01  
**Depends on:** Build 16 intelligence fidelity vertical slice

## Intent

Make the existing ApexOS MCP experience work as naturally as the platform permits when ApexOS is selected in ChatGPT — without redesigning doctrine, schemas, tables, or the Build 16 pipeline, and without adding a web UI.

## What changed

1. **Connector instructions + tool metadata** — Natural executive messages are guided to `execute_runtime`; non-ApexOS questions remain allowed; disclosure is required when the runtime was not invoked.
2. **Confirmed continuity** — `conversationId` stays optional. Reuse occurs only from an explicit ID or confirmed MCP session / process tool state. Otherwise a new durable conversation is created and returned.
3. **`apexosBasis`** — Truthful plain-English grounding status derived only from runtime results (persistence, retrieval, trace confirmation).
4. **`glassBox`** — Concise structured auditable chain derived only from Context Package + runtime audit/trace data. Absent stages are `not captured`.
5. **Honest degradation** — Unavailable runtime, persistence failure, and retrieval failure are explicit and never claim database grounding falsely.
6. **Additive `RuntimeResponse.contextPackage`** — Exposed for Glass Box assembly; Build 16 consumers may ignore it.

## Platform limitation (accurate)

Selecting ApexOS in ChatGPT does **not** guarantee tool invocation. Connector instructions and tool metadata can only guide ChatGPT. Continuity reuse across ChatGPT chat boundaries is limited by whether the host preserves MCP session identity (HTTP `mcp-session-id`) or the long-lived stdio process tool state.

## Manual validation (ChatGPT)

1. Select ApexOS in ChatGPT.
2. Send a natural executive message (situation with people / conflict / ownership) without naming `execute_runtime` or pasting a `conversationId`.
3. Confirm the answer ends with a truthful **ApexOS Basis** line (e.g. new situation saved, or no relevant memory).
4. Continue naturally with a follow-up that depends on prior context — without pasting a `conversationId`.
5. Ask for the Glass Box / reasoning trail; verify stages against `runtime_trace` for the returned `runtimeId` (retrieved records, source evidence, findings, recommendations; decision/outcome remain `not captured` unless actually persisted).

## Tests

```powershell
cd runtime
npm test
npm run typecheck
```
