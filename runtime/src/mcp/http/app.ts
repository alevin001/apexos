import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../create-server.js";
import { MCP_VERSION } from "../config/mcp-config.js";
import { assertLoopbackHost, MCP_HTTP_HOST } from "./loopback-host.js";

const sessions = new Map<string, StreamableHTTPServerTransport>();

export interface HttpMcpAppContext {
  app: Express;
  host: string;
}

export function createHttpMcpApp(host: string = MCP_HTTP_HOST): HttpMcpAppContext {
  const bindHost = assertLoopbackHost(host);
  const app = createMcpExpressApp({ host: bindHost });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "apexos-mcp",
      version: MCP_VERSION,
      transport: "streamable-http",
      oauthEnabled: false,
      authRequired: false,
      activeSessions: sessions.size,
    });
  });

  app.post("/mcp", handleMcpRequest);
  app.get("/mcp", handleMcpRequest);
  app.delete("/mcp", handleMcpRequest);

  return { app, host: bindHost };
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (req.method === "POST" && isInitRequest(req.body)) {
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
    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (sessionId) {
    res.status(404).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Session not found" },
      id: null,
    });
    return;
  }

  res.status(400).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Bad Request: Session ID required" },
    id: null,
  });
}

function isInitRequest(body: unknown): boolean {
  if (isInitializeRequest(body)) return true;
  return Array.isArray(body) && body.some(isInitializeRequest);
}

export function getActiveSessionCount(): number {
  return sessions.size;
}

export function clearSessionsForTests(): void {
  sessions.clear();
}
