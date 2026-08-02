# ApexOS MCP Integration Layer

**Build 14 / Build 15 / Build 16 / Build 17** — Thin MCP adapter exposing the ApexOS Runtime Engine to ChatGPT.

```
Executive → ChatGPT → ApexOS MCP Server → Runtime Engine → Supabase → OpenAI → Response
```

The MCP server adapts tool calls. It does not orchestrate. All pipeline logic remains in the Runtime Engine (Build 13+).

## Build 17 — Executive Interface & Glass Box

**Primary / sole ChatGPT tool:** `apexos_conversation` (Build 17.2)

`runtime_health`, `build_context`, `runtime_trace`, and legacy `execute_runtime` are **not** exposed in the ChatGPT connector tool catalog (they interfered with routing — e.g. “Evaluating Apex OS Runtime” via health check). Operator health remains at HTTP `GET /health`.

When ApexOS is selected, connector instructions require calling `apexos_conversation` **before answering** executive-work requests — never a health/status preflight. The host still cannot force a tool call — a ChatGPT answer without a real tool result is **not** an ApexOS answer. Never ask the executive for technical IDs.

| Response field | Purpose |
|----------------|---------|
| `invocation.status` | Machine-readable: `invoked` \| `failed` (absence of tool result ⇒ live-test `not_invoked`) |
| `apexosBasis` / `apexosBasisDisplay` | Two-line status: **ApexOS Basis** + **Glass Box** reminder |
| `glassBox` | Full auditable chain from Context Package + runtime audit only (on demand) |
| `conversationId` | Internal UUID; optional on input |
| `executionMetadata.continuitySource` | `explicit` \| `session` \| `durable_fallback` \| `new` |

### Deploy / refresh so ChatGPT sees new tool metadata (required)

Local unit tests do **not** prove the ChatGPT connector refreshed. After code changes:

1. **Restart the MCP HTTP process** (loads new tool names/descriptions/instructions):
   ```powershell
   # Find listener on 3021, stop it, restart
   netstat -ano | findstr :3021
   Stop-Process -Id <PID> -Force
   cd C:\Users\Andre\Desktop\ApexOS\runtime
   npm run mcp:http
   ```
2. **Confirm freshness** — `GET http://127.0.0.1:3021/health` must report `"version":"0.17.4"` (or newer) and an `instanceId`.
3. **Confirm tunnel upstream** — OpenAI tunnel profile `apexos` must forward to `http://127.0.0.1:3021/mcp` (`tunnel-client` admin `http://127.0.0.1:8080/ui`, status `mcp_server_url`). ChatGPT does **not** use a classic public `https://…/mcp` URL; it attaches via the OpenAI control-plane tunnel named **ApexOS** (`tunnel_…` id in health `tunnel.tunnelId`).
4. **Reconnect ChatGPT ApexOS connector** if the tunnel id/name changed or activity stays empty:
   - Platform tunnels: `https://platform.openai.com/settings/organization/tunnels`
   - ChatGPT connectors: `https://chatgpt.com/#settings/Connectors`
   - Prefer reconnect/refresh of the existing **ApexOS** connector to the current tunnel; if the UI only allows a new registration, remove the stale ApexOS connector and add the current tunnel again.
5. **Force metadata refresh** — toggle ApexOS off/on or start a **new** project-only chat after reconnect.
6. **Connector-path proof (Build 17.4)** — after a ChatGPT turn compare:
   - `GET http://127.0.0.1:3021/connector-activity/recent` — expects `initialize` / `tools/list` if ChatGPT is attached to **this** instance
   - `GET http://127.0.0.1:3021/lifecycle/recent` — expects entries only after `tools/call` for `apexos_conversation`
   - Empty activity ⇒ wrong/stale connector registration (not an ApexOS routing bug)
   - Activity with `tools/list` but no `tools/call` ⇒ host-side non-invocation
   - `tools/call` + lifecycle complete but no Basis in chat ⇒ host-side result handling

### Continuity order

1. Explicit `conversationId` (internal only — never ask the executive)
2. Confirmed MCP session / long-lived process tool state
3. Constrained durable fallback: most recent **active** conversation for the same configured executive with a **completed** runtime trace inside a 6-hour window
4. Otherwise create a new conversation and disclose that no prior ApexOS conversation was confirmed

### Live acceptance test (production gate)

1. Create a **new** project with project-only memory.
2. Select ApexOS (after deploy/refresh above).
3. Send: `I need to prepare for a leadership meeting with Drew and Jesse. Help me decide the one conversation we need to have about healthy conflict and execution speed.`
4. **Pass only if** the answer ends with the two-line ApexOS status (`ApexOS Basis:` + `Glass Box: Available…`) and/or the tool payload has `invocation.status: "invoked"`.
5. Send: `What should I say first?`
6. Confirm `continuitySource` is `session` or `durable_fallback` (or a clear new-conversation disclosure).
7. Send: `Show the Glass Box.`
8. Verify the returned Glass Box against `runtime_trace` for the returned `runtimeId`.

If step 4 fails (ordinary ChatGPT answer, no Basis/Glass Box), treat as **not_invoked** — Build 17 is not production-ready for that connector session.

## Prerequisites

- Node.js 20+
- Repo root `.env.local` configured (Supabase credentials)
- Scenario ingested: `cd scripts && npm run ingest:scenario`

## Setup

```bash
cd runtime
npm install
```

## Transports

| Transport | Command | Use case |
|-----------|---------|----------|
| **stdio** | `npm run mcp` | ChatGPT Desktop local connector (spawns subprocess) |
| **Streamable HTTP** | `npm run mcp:http` | Local HTTP + OpenAI secure tunnel / Personal ChatGPT connector |

Both transports reuse the same `createMcpServer()`, tool registration, runtime adapter, and observability.

---

## stdio (ChatGPT Desktop local)

```bash
npm run mcp
```

Log output goes to **stderr** — stdout is reserved for MCP protocol messages.

### ChatGPT Desktop — stdio config

Add to `%APPDATA%\ChatGPT\mcp.json` (Windows) or Settings → Connectors → Advanced:

```json
{
  "mcpServers": {
    "apexos": {
      "command": "node",
      "args": [
        "C:\\Users\\Andre\\Desktop\\ApexOS\\runtime\\run.mjs",
        "mcp/server.ts"
      ],
      "env": {
        "NODE_OPTIONS": "--use-system-ca"
      }
    }
  }
}
```

Adjust the path to your local ApexOS installation. Restart ChatGPT Desktop after saving.

---

## Streamable HTTP

```bash
npm run mcp:http
```

The HTTP MCP server **always binds to `127.0.0.1`**. Startup rejects `0.0.0.0` and any non-loopback host. There is no configuration option for remote binding.

Default listen address:

```
http://127.0.0.1:3021/mcp
```

Health check:

```
http://127.0.0.1:3021/health
```

Configure port with `APEXOS_MCP_PORT` (default `3021`).

### ChatGPT Desktop — HTTP / tunnel config

For local URL connectors:

```
http://127.0.0.1:3021/mcp
```

For remote ChatGPT access, use the **authenticated OpenAI secure tunnel** and Andrew’s Personal ChatGPT connector. The tunnel authenticates the remote path; ApexOS itself remains localhost-only and unauthenticated.

Example `mcp.json` URL connector (no Authorization header):

```json
{
  "mcpServers": {
    "apexos": {
      "url": "http://127.0.0.1:3021/mcp"
    }
  }
}
```

Restart ChatGPT Desktop after saving.

---

## Authentication model

ApexOS is intentionally **unauthenticated at the application layer**:

- It is a **single-user, local** application bound exclusively to **localhost** (`127.0.0.1`).
- User authentication is provided by **Andrew’s Personal ChatGPT account** and the **authenticated OpenAI secure tunnel**.
- ApexOS does **not** implement OAuth, Dynamic Client Registration, login sessions, or static bearer tokens.
- `/mcp` and `/health` do not require an `Authorization` header.

If ApexOS ever supports remote binding or additional users, application-level authentication must be reconsidered before that change ships.

`/health` reports:

```json
{
  "oauthEnabled": false,
  "authRequired": false
}
```

---

## MCP Tools

| Tool | Purpose |
|------|---------|
| `apexos_conversation` | **Sole** ChatGPT-facing executive conversation tool — pipeline + `invocation` + `apexosBasis` + `glassBox` |

| Local / non-ChatGPT | Purpose |
|---------------------|---------|
| `GET /health` | Operator/test health (not an MCP tool) |

Every execution returns a **runtimeId** (maps to the Runtime Engine `requestId`).

### Example: execute_runtime

```json
{
  "message": "Jesse and Drew are stuck on healthy conflict and rotating meeting ownership. What should I establish next?"
}
```

`conversationId` may be omitted. On success the response includes `conversationId`, `apexosBasis`, `apexosBasisDisplay`, and `glassBox`.

### Example: runtime_trace

```json
{
  "runtimeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `APEXOS_MCP_SERVER_NAME` | `apexos` | MCP server identifier |
| `APEXOS_MCP_PORT` | `3021` | Streamable HTTP listen port (host is always `127.0.0.1`) |
| `APEXOS_MCP_LOG_LEVEL` | `info` | Log level (`info`, `silent`) |
| `APEXOS_MCP_RUNTIME_MODE` | `library` | How MCP invokes Runtime Engine: `library` or `http` |
| `APEXOS_MCP_RUNTIME_ENDPOINT` | `http://localhost:3020` | Runtime HTTP API when runtime mode is `http` |
| `APEXOS_MCP_TRACE_RETENTION_MS` | `86400000` | In-memory trace retention (24h) |

All Build 13 runtime variables (`SUPABASE_URL`, `OPENAI_API_KEY`, etc.) apply unchanged.

### Runtime invocation modes (MCP → Runtime Engine)

**Library mode (default)** — MCP calls `executePipeline` / `executePipelineDry` in-process. No Runtime HTTP server required.

**HTTP mode** — Set `APEXOS_MCP_RUNTIME_MODE=http` and start the Runtime HTTP server (`npm start`). MCP forwards to the Runtime API on port 3020.

This is separate from the MCP transport (stdio vs Streamable HTTP).

---

## Testing

### 1. Verify servers start

```bash
# stdio (Ctrl+C to stop)
npm run mcp

# Streamable HTTP (separate terminal)
npm run mcp:http
```

### 2. HTTP health check

```bash
curl http://127.0.0.1:3021/health
```

### 3. MCP Inspector — stdio

```bash
npx @modelcontextprotocol/inspector node run.mjs mcp/server.ts
```

### 4. MCP Inspector — Streamable HTTP

Start the HTTP server, then in MCP Inspector connect to:

```
http://127.0.0.1:3021/mcp
```

No Authorization header is required.

### 5. Automated MCP HTTP tests

```bash
npm run test:mcp
```

### 6. End-to-end tool test

1. Call `runtime_health`
2. Call `build_context` with a message and situation slug
3. Call `execute_runtime` with the same parameters
4. Call `runtime_trace` with the returned `runtimeId`
5. Verify `conversation_messages` in Supabase after full execution

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| ChatGPT doesn't see tools | Verify config path/URL, restart ChatGPT Desktop |
| Bind / startup error about non-loopback host | Server must listen on `127.0.0.1` only; remote binding is not supported |
| Tunnel cannot reach MCP | Confirm local server is up on `127.0.0.1:3021` and tunnel profile points at `/mcp` |
| HTTP 404 Session not found | Re-initialize; sessions are in-memory until server restart |
| `Executive not found` | Confirm `APEXOS_EXECUTIVE_SLUG` and Supabase seed data |
| `Situation not found` | Run `cd scripts && npm run ingest:scenario` |
| TLS / npm install errors | Set `NODE_OPTIONS=--use-system-ca` |
| Empty trace | Traces are in-memory; use runtimeId immediately or check Supabase metadata |
| Runtime HTTP mode failures | Ensure Runtime HTTP server is running on port 3020 |

---

## Architecture Boundary

The MCP layer (`runtime/src/mcp/`) contains:

- Tool registration and schema validation
- Transport adapters (stdio, Streamable HTTP)
- Runtime adapter (library or HTTP invocation)
- Loopback-only HTTP bind enforcement
- Trace storage for MCP observability
- Structured error formatting

It does **not** contain orchestration, memory retrieval, governance validation, or context package construction logic.

## Type Checking

```bash
npm run typecheck
```
