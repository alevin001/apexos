import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { AuthError, validateBearerAuth } from "./auth/local-auth.js";
import { mcpConfig, MCP_VERSION } from "./config/mcp-config.js";
import { createMcpServer } from "./create-server.js";

const MAX_BODY_SIZE = 1_048_576;
const MCP_PATH = "/mcp";

const sessions = new Map<string, StreamableHTTPServerTransport>();

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const raw = await readBody(req);
  if (!raw.trim()) return undefined;
  return JSON.parse(raw) as unknown;
}

function isInitRequest(body: unknown): boolean {
  if (isInitializeRequest(body)) return true;
  return Array.isArray(body) && body.some(isInitializeRequest);
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId)!;
    const parsedBody = req.method === "POST" ? await parseJsonBody(req) : undefined;
    await transport.handleRequest(req, res, parsedBody);
    return;
  }

  if (req.method === "POST") {
    const parsedBody = await parseJsonBody(req);

    if (!sessionId && isInitRequest(parsedBody)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      const mcpServer = createMcpServer();
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
      return;
    }
  }

  if (sessionId) {
    sendJson(res, 404, {
      jsonrpc: "2.0",
      error: { code: -32001, message: "Session not found" },
      id: null,
    });
    return;
  }

  sendJson(res, 400, {
    jsonrpc: "2.0",
    error: { code: -32000, message: "Bad Request: Session ID required" },
    id: null,
  });
}

export function startHttpMcpServer(port = mcpConfig.port): void {
  const server = createServer(async (req, res) => {
    try {
      const path = (req.url ?? "/").split("?")[0];

      if (req.method === "GET" && path === "/health") {
        sendJson(res, 200, {
          status: "ok",
          service: "apexos-mcp",
          version: MCP_VERSION,
          transport: "streamable-http",
          authRequired: Boolean(mcpConfig.authToken),
          activeSessions: sessions.size,
        });
        return;
      }

      if (path === MCP_PATH) {
        try {
          validateBearerAuth(req.headers.authorization);
        } catch (err) {
          const message = err instanceof AuthError ? err.message : "Unauthorized";
          sendJson(res, 401, { error: "Unauthorized", message });
          return;
        }

        await handleMcpRequest(req, res);
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : "Internal server error",
      });
    }
  });

  server.listen(port, () => {
    console.log(`ApexOS MCP Server listening on http://localhost:${port}`);
    console.log(`  POST/GET/DELETE ${MCP_PATH} — Streamable HTTP MCP endpoint`);
    console.log(`  GET  /health — health check`);
    console.log(`  Auth: ${mcpConfig.authToken ? "Bearer token required" : "disabled (local dev)"}`);
    console.log(`  Runtime mode: ${mcpConfig.runtimeMode}`);
  });
}

startHttpMcpServer();
