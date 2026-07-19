import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import {
  getOAuthProtectedResourceMetadataUrl,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../create-server.js";
import { mcpConfig, MCP_VERSION } from "../config/mcp-config.js";
import { loadOauthHttpConfig, type OauthHttpConfig } from "../auth/oauth-config.js";
import { ApexOsOAuthProvider } from "../auth/oauth-provider.js";
import { mountSecureOAuthRoutes } from "../auth/oauth-routes.js";
import { createStaticBearerMiddleware } from "../auth/static-bearer.js";
import { clearPendingAuthorizationsForTests } from "../auth/pending-authorization.js";
import { clearLoginRateLimitsForTests } from "../auth/login-rate-limit.js";

const sessions = new Map<string, StreamableHTTPServerTransport>();

export interface HttpMcpAppContext {
  app: Express;
  config: OauthHttpConfig;
  provider: ApexOsOAuthProvider | null;
}

export function createHttpMcpApp(configOverrides: Partial<OauthHttpConfig> = {}): HttpMcpAppContext {
  const config = loadOauthHttpConfig(configOverrides);
  const app = createMcpExpressApp({ host: "127.0.0.1" });
  const provider = config.oauthEnabled ? new ApexOsOAuthProvider(config.resourceUrl) : null;

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "apexos-mcp",
      version: MCP_VERSION,
      transport: "streamable-http",
      oauthEnabled: config.oauthEnabled,
      authRequired: config.oauthEnabled || Boolean(config.staticBearerToken),
      activeSessions: sessions.size,
    });
  });

  if (config.oauthEnabled && provider) {
    mountSecureOAuthRoutes(app, { provider, config });
  }

  const authMiddleware = config.oauthEnabled
    ? requireBearerAuth({
        verifier: provider!,
        requiredScopes: [],
        resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(config.resourceUrl),
      })
    : createStaticBearerMiddleware(config.staticBearerToken);

  const withAuth = authMiddleware
    ? [authMiddleware, handleMcpRequest]
    : [handleMcpRequest];

  app.post("/mcp", ...withAuth);
  app.get("/mcp", ...withAuth);
  app.delete("/mcp", ...withAuth);

  return { app, config, provider };
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
  clearPendingAuthorizationsForTests();
  clearLoginRateLimitsForTests();
}
