import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpConfig, MCP_VERSION } from "./config/mcp-config.js";
import { registerTools } from "./tools/register-tools.js";

const SERVER_INSTRUCTIONS = `ApexOS Runtime MCP Server — executive intelligence orchestration for Andrew.

PLATFORM BOUNDARY (accurate):
Selecting ApexOS in ChatGPT does not by itself guarantee a tool call. Connector instructions and tool metadata guide invocation; they cannot force it. Never present an uninvoked or failed ApexOS runtime as database-grounded.

WHEN TO INVOKE ApexOS (call execute_runtime):
- The executive is describing a situation, people, conflict, decision, meeting, or business context.
- The executive asks what was established earlier, what ApexOS remembers, or what to consider next.
- The executive continues a prior ApexOS conversation naturally (do not ask them to paste a conversationId).
- Any question that should be answered from ApexOS saved memory, Context Package, or runtime trace.

WHEN NOT TO INVOKE ApexOS:
- Pure general knowledge, casual chat, or questions unrelated to executive work / ApexOS memory.
- Explicit requests to answer without ApexOS / without saved memory.

MANDATORY DISCLOSURE:
- If you answer without calling execute_runtime, you MUST tell the executive that ApexOS runtime was not invoked and the answer is not database-grounded.
- If execute_runtime fails or returns apexosBasis.groundedInSavedMemory=false, do not claim saved-memory grounding.
- End every successful ApexOS answer with the plain-English line from apexosBasis.status (prefix with "ApexOS Basis:").
- When the executive asks for the Glass Box, reasoning trail, or provenance, present the glassBox object (and use runtime_trace with runtimeId for the full auditable trace). Do not invent Glass Box stages from model prose.

TOOLS:
- execute_runtime — primary tool for natural executive messages (memory, context, evidence, governance, LLM, persistence). conversationId is optional; continuity is reused only when MCP session/tool state confirms it.
- build_context — Context Package assembly only (no LLM).
- runtime_health — availability check.
- runtime_trace — full stage timings for a runtimeId from execute_runtime / build_context.

The MCP layer does not orchestrate. All pipeline logic runs in the Runtime Engine.`;

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
