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

### Local development (OAuth disabled)

Set `APEXOS_MCP_OAUTH_ENABLED=false` (default). Optional static Bearer via `APEXOS_MCP_TOKEN`.

| Layer | When token unset | When `APEXOS_MCP_TOKEN` set |
|-------|------------------|-------------------------------|
| **stdio tools** | No auth | Pass `auth_token` in tool arguments |
| **Streamable HTTP** | Open `/mcp` | `Authorization: Bearer <token>` on `/mcp` |

### ChatGPT tunnel (OAuth enabled)

Enable OAuth for OpenAI tunnel / DCR integration:

```env
APEXOS_MCP_OAUTH_ENABLED=true
APEXOS_MCP_ISSUER_URL=https://YOUR-PUBLIC-TUNNEL-BASE-URL
APEXOS_MCP_RESOURCE_URL=https://YOUR-PUBLIC-TUNNEL-BASE-URL/mcp
APEXOS_MCP_ADMIN_PASSWORD=your-admin-password
APEXOS_MCP_SESSION_SECRET=your-random-session-secret-at-least-32-chars
```

`APEXOS_MCP_ISSUER_URL` must be the **public tunnel base URL** (not `127.0.0.1`). Set it to the URL ChatGPT uses to reach your tunnel.

When OAuth is enabled the server exposes:

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/oauth-protected-resource/mcp` | Protected resource metadata |
| `GET /.well-known/oauth-authorization-server` | Authorization server metadata |
| `POST /register` | Dynamic Client Registration |
| `GET /authorize` | Authorization Code + PKCE |
| `POST /token` | Token exchange |

`/health` and both well-known endpoints remain public. `/mcp` requires a valid OAuth Bearer token and returns `401` with `WWW-Authenticate` metadata when missing or invalid.

Verify:

```powershell
curl http://127.0.0.1:3021/.well-known/oauth-protected-resource/mcp
curl http://127.0.0.1:3021/.well-known/oauth-authorization-server
cd "C:\Users\Andre\Desktop\ApexOS\runtime\mcp tunnel"
.\tunnel-client.exe doctor --profile apexos --explain
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
| `APEXOS_MCP_OAUTH_ENABLED` | `false` (or `true` when `APEXOS_MCP_ISSUER_URL` is set) | Enable OAuth/DCR for tunnel integration |
| `APEXOS_MCP_ISSUER_URL` | _(empty)_ | Public OAuth issuer base URL (required when OAuth enabled) |
| `APEXOS_MCP_RESOURCE_URL` | `{issuer}/mcp` | Protected MCP resource URL |
| `APEXOS_MCP_ADMIN_PASSWORD` | _(empty)_ | Andrew's login password (required when OAuth enabled) |
| `APEXOS_MCP_SESSION_SECRET` | _(empty)_ | HMAC secret for admin session cookie (min 32 chars, required when OAuth enabled) |
| `APEXOS_MCP_SESSION_TTL_SECONDS` | `900` | Admin session lifetime |
| `APEXOS_MCP_TOKEN` | _(empty)_ | Static Bearer token when OAuth disabled |
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
| HTTP 401 on `/mcp` | OAuth enabled: complete DCR/PKCE flow; static mode: match `APEXOS_MCP_TOKEN` |
| OAuth doctor fails on well-known URLs | Set `APEXOS_MCP_OAUTH_ENABLED=true` and correct public `APEXOS_MCP_ISSUER_URL` |
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
