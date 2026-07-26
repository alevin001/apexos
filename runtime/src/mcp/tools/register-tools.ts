import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatToolError, toStructuredError } from "../errors/mcp-errors.js";
import {
  invokeBuildContext,
  invokeExecuteRuntime,
  invokeRuntimeHealth,
  invokeRuntimeTrace,
} from "../adapters/runtime-adapter.js";

const executiveRequestSchema = {
  message: z.string().describe("Executive message or question"),
  executiveSlug: z.string().optional().describe("Executive identity slug"),
  situationSlug: z.string().optional().describe("Situation context slug"),
  conversationId: z.string().optional().describe("Existing conversation ID for continuity"),
  previousResponseId: z.string().optional().describe("Previous OpenAI response ID for multi-turn"),
};

function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

function toolError(err: unknown, runtimeId: string | null = null) {
  const structured = toStructuredError(err, runtimeId);
  return {
    content: [{ type: "text" as const, text: formatToolError(structured) }],
    isError: true as const,
  };
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "execute_runtime",
    {
      title: "Execute ApexOS Runtime",
      description:
        "Execute the complete ApexOS Runtime Engine pipeline. Returns runtime ID, response, conversationId (always the effective/created ID on success), and execution metadata including recordsCreated, recordsRetrieved, and contextItems. Pass conversationId on later turns for continuity.",
      inputSchema: z.object(executiveRequestSchema),
    },
    async (args) => {
      try {
        const result = await invokeExecuteRuntime(args);
        return toolResult({
          runtimeId: result.runtimeId,
          response: result.response,
          executionMetadata: {
            responseId: result.responseId,
            situationSlug: result.situationSlug,
            conversationId: result.conversationId,
            interactionId: result.interactionId,
            contextPackageId: result.contextPackageId,
            stages: result.stages,
            ...result.metadata,
          },
        });
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.registerTool(
    "build_context",
    {
      title: "Build Executive Context Package",
      description:
        "Execute the Runtime pipeline through Executive Context Package construction only. Does not invoke the LLM. Returns runtime ID and the assembled context package.",
      inputSchema: z.object(executiveRequestSchema),
    },
    async (args) => {
      try {
        const result = await invokeBuildContext(args);
        return toolResult({
          runtimeId: result.runtimeId,
          contextPackage: result.contextPackage,
          stages: result.stages,
        });
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.registerTool(
    "runtime_health",
    {
      title: "Runtime Health Check",
      description:
        "Verify ApexOS Runtime availability. Returns status, version, configuration, and dependency health.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const health = await invokeRuntimeHealth();
        return toolResult(health);
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.registerTool(
    "runtime_trace",
    {
      title: "Runtime Execution Trace",
      description:
        "Retrieve execution trace for a Runtime ID. Returns stage timings, execution metadata, errors, and completion status.",
      inputSchema: z.object({
        runtimeId: z.string().describe("Runtime ID returned from execute_runtime or build_context"),
      }),
    },
    async (args) => {
      try {
        const trace = await invokeRuntimeTrace(args.runtimeId);

        if (!trace) {
          return toolError(
            new Error(`No trace found for runtime ID: ${args.runtimeId}`),
            args.runtimeId
          );
        }

        return toolResult({
          runtimeId: trace.runtimeId,
          tool: trace.tool,
          status: trace.status,
          startedAt: trace.startedAt,
          completedAt: trace.completedAt,
          stages: trace.stages,
          metadata: trace.metadata,
          error: trace.error ?? null,
          completionStatus: trace.status,
        });
      } catch (err) {
        return toolError(err, args.runtimeId);
      }
    }
  );
}
