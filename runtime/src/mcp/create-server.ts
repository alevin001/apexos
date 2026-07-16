import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpConfig, MCP_VERSION } from "./config/mcp-config.js";
import { registerTools } from "./tools/register-tools.js";

const SERVER_INSTRUCTIONS = `ApexOS Runtime MCP Server — thin adapter to the ApexOS Runtime Engine.

Use runtime_health to verify availability before execution.
Use execute_runtime for full executive intelligence orchestration (memory, context, evidence, governance, LLM).
Use build_context to assemble an Executive Context Package without invoking the LLM.
Use runtime_trace with a runtimeId to inspect stage timings and execution metadata.

Every execution returns a runtimeId. Pass it to runtime_trace for observability.
The MCP layer does not perform orchestration — all pipeline logic runs in the Runtime Engine.`;

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: mcpConfig.serverName,
      version: MCP_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  registerTools(server);
  return server;
}
