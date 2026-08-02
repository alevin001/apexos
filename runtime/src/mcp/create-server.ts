import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpConfig, MCP_VERSION } from "./config/mcp-config.js";
import { SERVER_INSTRUCTIONS } from "./connector-guidance.js";
import { formatIdentityForInstructions } from "./server-identity.js";
import { registerTools } from "./tools/register-tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: mcpConfig.serverName,
      version: MCP_VERSION,
    },
    {
      instructions: `${SERVER_INSTRUCTIONS}

${formatIdentityForInstructions()}`,
    }
  );

  registerTools(server);
  return server;
}
