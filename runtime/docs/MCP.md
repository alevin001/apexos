# ApexOS MCP Integration Layer

**Build 14** — Thin MCP adapter exposing the ApexOS Runtime Engine to ChatGPT.

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
| **Streamable HTTP** | `npm run mcp:http` | Remote clients, MCP Inspector over HTTP, ChatGPT URL connector |

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

Default listen address:

```
http://localhost:3021/mcp
```

Health check:

```
http://localhost:3021/health
```

Configure port with `APEXOS_MCP_PORT` (default `3021`).

### ChatGPT Desktop — HTTP config

In ChatGPT Desktop MCP settings, add a **URL connector**:

```
http://localhost:3021/mcp
```

If `APEXOS_MCP_TOKEN` is set, configure the Bearer header in the connector settings:

```
Authorization: Bearer <your-token>
```

Or in `mcp.json`:

```json
{
  "mcpServers": {
    "apexos": {
      "url": "http://localhost:3021/mcp",
      "headers": {
        "Authorization": "Bearer your-token-here"
      }
    }
  }
}
```

Restart ChatGPT Desktop after saving.

---

## Authentication

Authentication is optional for local development.

| Layer | When `APEXOS_MCP_TOKEN` is unset | When `APEXOS_MCP_TOKEN` is set |
|-------|----------------------------------|--------------------------------|
| **stdio tools** | No auth required | Pass `auth_token` in tool arguments |
| **Streamable HTTP** | No auth required | Send `Authorization: Bearer <token>` header on all `/mcp` requests |

Set in repo root `.env.local`:

```env
APEXOS_MCP_TOKEN=your-local-dev-token
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
| `APEXOS_MCP_PORT` | `3021` | Streamable HTTP listen port |
| `APEXOS_MCP_TOKEN` | _(empty)_ | Optional auth token (Bearer + tool param) |
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
curl http://localhost:3021/health
```

### 3. MCP Inspector — stdio

```bash
npx @modelcontextprotocol/inspector node run.mjs mcp/server.ts
```

### 4. MCP Inspector — Streamable HTTP

Start the HTTP server, then in MCP Inspector connect to:

```
http://localhost:3021/mcp
```

Add Bearer header if `APEXOS_MCP_TOKEN` is configured.

### 5. End-to-end tool test

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
| HTTP 401 on `/mcp` | Set or match `Authorization: Bearer` with `APEXOS_MCP_TOKEN` |
| HTTP 404 Session not found | Re-initialize; sessions are in-memory until server restart |
| `Executive not found` | Confirm `APEXOS_EXECUTIVE_SLUG` and Supabase seed data |
| `Situation not found` | Run `cd scripts && npm run ingest:scenario` |
| TLS / npm install errors | Set `NODE_OPTIONS=--use-system-ca` |
| stdio auth errors | Pass `auth_token` matching `APEXOS_MCP_TOKEN`, or unset the token |
| Empty trace | Traces are in-memory; use runtimeId immediately or check Supabase metadata |
| Runtime HTTP mode failures | Ensure Runtime HTTP server is running on port 3020 |

---

## Architecture Boundary

The MCP layer (`runtime/src/mcp/`) contains:

- Tool registration and schema validation
- Transport adapters (stdio, Streamable HTTP)
- Runtime adapter (library or HTTP invocation)
- Local authentication
- Trace storage for MCP observability
- Structured error formatting

It does **not** contain orchestration, memory retrieval, governance validation, or context package construction logic.

## Type Checking

```bash
npm run typecheck
```
