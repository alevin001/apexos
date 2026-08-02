import { createServer } from "node:http";
import { createHttpMcpApp } from "./http/app.js";
import { mcpConfig } from "./config/mcp-config.js";
import { assertLoopbackHost, MCP_HTTP_HOST } from "./http/loopback-host.js";

export function startHttpMcpServer(port = mcpConfig.port): void {
  const host = assertLoopbackHost(MCP_HTTP_HOST);
  const { app } = createHttpMcpApp(host);

  createServer(app).listen(port, host, () => {
    console.log(`ApexOS MCP Server listening on http://${host}:${port}`);
    console.log(`  POST/GET/DELETE /mcp — Streamable HTTP MCP endpoint`);
    console.log(`  GET  /health — health check + server identity`);
  console.log(`  GET  /lifecycle/recent — request lifecycle proof`);
  console.log(`  GET  /connector-activity/recent — connector path proof (Build 17.4)`);
  console.log(`  Auth: disabled (localhost-only, single-user)`);
  console.log(`  Runtime mode: ${mcpConfig.runtimeMode}`);
  });
}

startHttpMcpServer();
