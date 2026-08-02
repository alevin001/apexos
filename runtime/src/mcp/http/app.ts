import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../create-server.js";
import { MCP_VERSION } from "../config/mcp-config.js";
import { getRecentLifecycles } from "../adapters/request-lifecycle.js";
import {
  getRecentConnectorActivity,
  recordConnectorActivity,
} from "../adapters/connector-activity.js";
import {
  getServerIdentity,
  refreshTunnelIdentityFromAdmin,
} from "../server-identity.js";
import { assertLoopbackHost, MCP_HTTP_HOST } from "./loopback-host.js";

const sessions = new Map<string, StreamableHTTPServerTransport>();

export interface HttpMcpAppContext {
  app: Express;
  host: string;
}

function operatorIdentityPayload() {
  return getServerIdentity();
}

export function createHttpMcpApp(host: string = MCP_HTTP_HOST): HttpMcpAppContext {
  const bindHost = assertLoopbackHost(host);
  const app = createMcpExpressApp({ host: bindHost });

  app.get("/health", async (_req, res) => {
    await refreshTunnelIdentityFromAdmin().catch(() => undefined);
    const identity = operatorIdentityPayload();
    res.json({
      status: "ok",
      service: identity.service,
      version: identity.version,
      instanceId: identity.instanceId,
      startedAt: identity.startedAt,
      transport: identity.transport,
      listen: identity.listen,
      tunnel: identity.tunnel,
      oauthEnabled: false,
      authRequired: false,
      activeSessions: sessions.size,
    });
  });

  /** Local operator proof: recent apexos_conversation lifecycles (no message bodies). */
  app.get("/lifecycle/recent", (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 50);
    const identity = operatorIdentityPayload();
    res.json({
      service: identity.service,
      version: identity.version,
      instanceId: identity.instanceId,
      count: getRecentLifecycles(limit).length,
      requests: getRecentLifecycles(limit),
    });
  });

  /**
   * Build 17.4 — operator-only connector activity.
   * Not an MCP tool. Distinguishes: not connected vs connected-no-call vs tools/call.
   */
  app.get("/connector-activity/recent", async (req, res) => {
    await refreshTunnelIdentityFromAdmin().catch(() => undefined);
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 100);
    const identity = operatorIdentityPayload();
    const events = getRecentConnectorActivity(limit);
    res.json({
      service: identity.service,
      version: identity.version,
      instanceId: identity.instanceId,
      startedAt: identity.startedAt,
      tunnel: identity.tunnel,
      count: events.length,
      interpretationHints: {
        empty:
          "No initialize/tools/list/tools/call reached this server — ChatGPT is on a different/stale endpoint or tunnel is not forwarding here.",
        initializeOrToolsListOnly:
          "Connector reaches this instance, but ChatGPT has not called apexos_conversation (host-side non-invocation).",
        toolsCallWithLifecycle:
          "tools/call reached this server; check /lifecycle/recent for runtime completion.",
      },
      events,
    });
  });

  app.post("/mcp", handleMcpRequest);
  app.get("/mcp", handleMcpRequest);
  app.delete("/mcp", handleMcpRequest);

  return { app, host: bindHost };
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Operator activity proof — record before transport handling.
  try {
    recordConnectorActivity({
      httpMethod: req.method,
      sessionId: sessionId ?? null,
      body: req.body,
    });
  } catch {
    // Activity recording must never break MCP transport.
  }

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
