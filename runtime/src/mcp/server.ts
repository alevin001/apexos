import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpConfig, MCP_VERSION } from "./config/mcp-config.js";
import { createMcpServer } from "./create-server.js";

export { createMcpServer } from "./create-server.js";

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[apexos-mcp] Server ready on stdio (v${MCP_VERSION}, runtime mode: ${mcpConfig.runtimeMode})`
  );
}

startMcpServer().catch((err) => {
  console.error("[apexos-mcp] Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
