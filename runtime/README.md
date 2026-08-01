# ApexOS Runtime Engine

**Build 13** — First executable version of the ApexOS Runtime Engine.

The runtime orchestrates every executive interaction. ChatGPT remains the reasoning engine. ApexOS remains the orchestration engine. Supabase remains the system of record.

## Architecture

```
Executive Request
    ↓
Runtime Entry
    ↓
Memory Retrieval
    ↓
Context Retrieval
    ↓
Evidence Assembly
    ↓
Governance Validation
    ↓
Context Package Construction
    ↓
LLM Provider Adapter
    ↓
OpenAI Responses API
    ↓
LLM Response
    ↓
Interaction Capture
    ↓
Return Response
```

See `docs/ARCHITECTURE.md` and `docs/MODULES.md` for module specifications.

## Prerequisites

- Node.js 20+
- Supabase configured (`.env.local` at repo root)
- Scenario ingested: `cd scripts && npm run ingest:scenario`

## Setup

```bash
cd runtime
npm install
```

Copy repo root `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only) |
| `OPENAI_API_KEY` | For live LLM | OpenAI API key |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `APEXOS_RUNTIME_DRY_RUN` | No | Default: `true` — uses stub provider |
| `APEXOS_RUNTIME_PORT` | No | Default: `3020` |
| `APEXOS_EXECUTIVE_SLUG` | No | Default: `primary-executive` |

## Local Development

### Start HTTP server

```bash
npm start
```

Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/runtime/execute` | Full pipeline execution |
| POST | `/runtime/context-package` | Assemble context package only (no LLM) |

### CLI execution

```bash
# Dry run — assemble context package without LLM call
npm run execute -- --message "How should I handle the leadership conflict?" --situation leadership-conflict-q2 --dry-run

# Full execution (requires OPENAI_API_KEY and APEXOS_RUNTIME_DRY_RUN=false)
npm run execute -- --message "What are my options?" --situation leadership-conflict-q2
```

### Example HTTP request

```bash
curl -X POST http://localhost:3020/runtime/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I consider before my conversation with Jane?",
    "situationSlug": "leadership-conflict-q2"
  }'
```

## Testing Approach

1. **Health check** — `curl http://localhost:3020/health`
2. **Dry-run context assembly** — CLI with `--dry-run` verifies memory, context, evidence, and governance stages without API cost
3. **Stub provider** — Default mode returns structured preview when `APEXOS_RUNTIME_DRY_RUN=true`
4. **Live LLM** — Set `OPENAI_API_KEY` and `APEXOS_RUNTIME_DRY_RUN=false` for end-to-end test
5. **Interaction capture** — Verify `conversation_messages` in Supabase after execution
6. **Pipeline stages** — Each response includes `stages[]` with timing and status

## Deployment

The runtime is a standalone Node.js HTTP service. Deploy as:

1. **Process manager** — `node run.mjs server/http-server.ts` via PM2, systemd, or similar
2. **Container** — Node 20 Alpine, expose port 3020, mount `.env.local` as secrets
3. **Environment** — Set all required env vars; never expose service role key to clients

### MCP server (Build 14–17)

**stdio** (ChatGPT Desktop local):

```bash
npm run mcp
```

**Streamable HTTP** (localhost / OpenAI secure tunnel):

```bash
npm run mcp:http
```

Endpoint: `http://127.0.0.1:3021/mcp`

See `docs/MCP.md` for ChatGPT configuration, Build 17 `apexosBasis` / `glassBox` behavior, and testing workflow.

## Type Checking

```bash
npm run typecheck
```

## Related Documents

- `docs/MCP.md` — MCP Integration Layer (Build 14–17)
- `../build/build-17-executive-interface-glass-box.md`
- `technical_architecture/runtime-integration-architecture.md` (TECH-002)
- `build/build-13-runtime-engine.md`
- `docs/ARCHITECTURE.md`
- `docs/MODULES.md`
