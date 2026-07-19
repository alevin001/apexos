import { createServer } from "node:http";
import { createHttpMcpApp } from "./http/app.js";
import { mcpConfig } from "./config/mcp-config.js";

export function startHttpMcpServer(port = mcpConfig.port): void {
  const { app, config } = createHttpMcpApp();

  createServer(app).listen(port, "127.0.0.1", () => {
    console.log(`ApexOS MCP Server listening on http://127.0.0.1:${port}`);
    console.log(`  POST/GET/DELETE /mcp — Streamable HTTP MCP endpoint`);
    console.log(`  GET  /health — health check`);
    if (config.oauthEnabled) {
      console.log(`  OAuth issuer: ${config.issuerUrl.href}`);
      console.log(`  OAuth resource: ${config.resourceUrl.href}`);
      console.log(`  GET  /.well-known/oauth-protected-resource/mcp`);
      console.log(`  GET  /.well-known/oauth-authorization-server`);
    } else {
      console.log(
        `  Auth: ${config.staticBearerToken ? "static Bearer token" : "disabled (local dev)"}`
      );
    }
    console.log(`  Runtime mode: ${mcpConfig.runtimeMode}`);
  });
}

startHttpMcpServer();
