# ApexOS MCP Integration Layer

**Build 14 / Build 15** — Thin MCP adapter exposing the ApexOS Runtime Engine to ChatGPT.

```
Executive → ChatGPT → ApexOS MCP Server → Runtime Engine → Supabase → OpenAI → Response
```

The MCP server adapts tool calls. It does not orchestrate. All pipeline logic remains in the Runtime Engine (Build 13).

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
| `execute_runtime` | Full 9-stage pipeline execution |
| `build_context` | Context package assembly only (no LLM) |
| `runtime_health` | Availability and dependency diagnostics |
| `runtime_trace` | Execution trace for a Runtime ID |

Every execution returns a **runtimeId** (maps to the Runtime Engine `requestId`).

### Example: execute_runtime

```json
{
  "message": "What should I consider before my conversation with Jane?",
  "situationSlug": "leadership-conflict-q2"
}
```

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
