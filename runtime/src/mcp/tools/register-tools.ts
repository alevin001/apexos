import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toStructuredError } from "../errors/mcp-errors.js";
import {
  invokeBuildContext,
  invokeExecuteRuntime,
  invokeRuntimeHealth,
  invokeRuntimeTrace,
} from "../adapters/runtime-adapter.js";
import {
  rememberConversation,
  resolveConversationId,
  resolveSessionKey,
  type ContinuitySource,
} from "../adapters/conversation-state.js";
import {
  buildApexosBasis,
  buildUnavailableBasis,
  formatBasisDisplayLine,
} from "../adapters/apexos-basis.js";
import { buildGlassBox, buildUnavailableGlassBox } from "../adapters/glass-box.js";

const executiveRequestSchema = {
  message: z
    .string()
    .describe(
      "Natural executive message or question. Pass the executive's words directly — they do not need to name this tool or supply technical IDs."
    ),
  executiveSlug: z
    .string()
    .optional()
    .describe("Executive identity slug (optional; defaults to primary executive / Andrew aliases)"),
  situationSlug: z.string().optional().describe("Situation context slug when already known"),
  conversationId: z
    .string()
    .optional()
    .describe(
      "Optional. Existing ApexOS conversation UUID. Prefer omitting this — the server reuses the active conversation only when MCP session/tool state confirms it. If continuity cannot be confirmed, a new conversation is created and returned."
    ),
  previousResponseId: z
    .string()
    .optional()
    .describe("Previous OpenAI response ID for multi-turn model chaining (optional)"),
};

function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

function toolError(err: unknown, runtimeId: string | null = null) {
  const structured = toStructuredError(err, runtimeId);
  const apexosBasis = buildUnavailableBasis("unavailable");
  const payload = {
    ...structured,
    apexosBasis,
    apexosBasisDisplay: formatBasisDisplayLine(apexosBasis),
    glassBox: buildUnavailableGlassBox(runtimeId),
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    isError: true as const,
    structuredContent: payload,
  };
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "execute_runtime",
    {
      title: "ApexOS — Answer with Runtime Memory",
      description: `PRIMARY TOOL for natural executive messages when ApexOS is relevant.

Call this tool whenever the executive describes a situation, asks what was established, asks what ApexOS remembers, or continues prior ApexOS work — without requiring them to name this tool or paste a conversationId.

Returns: response (executive answer text), runtimeId, conversationId (effective/created), apexosBasis (truthful plain-English grounding status), glassBox (structured auditable chain from Context Package + trace only), and executionMetadata.

After a successful call, end your user-facing answer with the line in apexosBasisDisplay (or "ApexOS Basis: " + apexosBasis.status). Never claim saved-memory grounding unless apexosBasis.groundedInSavedMemory is true.

Do NOT call for unrelated general chat. If you answer without calling this tool, disclose that ApexOS was not invoked and the answer is not database-grounded.`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: z.object(executiveRequestSchema),
    },
    async (args, extra) => {
      const sessionKey = resolveSessionKey(extra?.sessionId);
      const resolved = resolveConversationId({
        explicitConversationId: args.conversationId,
        sessionKey,
      });

      try {
        const result = await invokeExecuteRuntime({
          ...args,
          conversationId: resolved.conversationId,
        });

        let continuitySource: ContinuitySource = resolved.continuitySource;
        if (resolved.continuitySource === "new" && result.conversationId) {
          continuitySource = "new";
        }

        if (result.conversationId) {
          rememberConversation(sessionKey, result.conversationId, result.runtimeId);
        }

        const apexosBasis = buildApexosBasis({
          conversationId: result.conversationId,
          continuitySource,
          persistenceStatus: result.metadata.persistenceStatus,
          recordsCreated: result.metadata.recordsCreated,
          recordsRetrieved: result.metadata.recordsRetrieved,
          retrievalErrors: result.metadata.retrievalErrors,
          captureErrors: result.metadata.captureErrors,
          stages: result.stages,
          runtimeAvailable: true,
        });

        const glassBox = buildGlassBox({
          runtimeId: result.runtimeId,
          conversationId: result.conversationId,
          contextPackageId: result.contextPackageId,
          contextPackage: result.contextPackage,
          recordsCreated: result.metadata.recordsCreated,
          recordsRetrieved: result.metadata.recordsRetrieved,
          stages: result.stages,
        });

        return toolResult({
          runtimeId: result.runtimeId,
          response: result.response,
          conversationId: result.conversationId,
          apexosBasis,
          apexosBasisDisplay: formatBasisDisplayLine(apexosBasis),
          glassBox,
          executionMetadata: {
            responseId: result.responseId,
            situationSlug: result.situationSlug,
            conversationId: result.conversationId,
            interactionId: result.interactionId,
            contextPackageId: result.contextPackageId,
            continuitySource,
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
        "Assemble an Executive Context Package without invoking the LLM. Use for inspection of retrieved context. For normal executive answers, prefer execute_runtime.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: z.object(executiveRequestSchema),
    },
    async (args, extra) => {
      const sessionKey = resolveSessionKey(extra?.sessionId);
      const resolved = resolveConversationId({
        explicitConversationId: args.conversationId,
        sessionKey,
      });

      try {
        const result = await invokeBuildContext({
          ...args,
          conversationId: resolved.conversationId,
        });
        return toolResult({
          runtimeId: result.runtimeId,
          contextPackage: result.contextPackage,
          stages: result.stages,
          continuitySource: resolved.continuitySource,
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
        "Verify ApexOS Runtime availability. Returns status, version, configuration, and dependency health. Optional before execute_runtime when diagnosing failures.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
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
        "Retrieve the full execution trace for a runtimeId from execute_runtime or build_context. Use when the executive asks to expand the Glass Box, audit stages, or verify persistence/retrieval. Prefer the glassBox field from execute_runtime for a concise summary first.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: z.object({
        runtimeId: z
          .string()
          .describe("Runtime ID returned from execute_runtime or build_context"),
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
