import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toStructuredError } from "../errors/mcp-errors.js";
import { invokeExecuteRuntime } from "../adapters/runtime-adapter.js";
import {
  rememberConversation,
  resolveContinuity,
  resolveSessionKey,
  STDIO_SESSION_KEY,
} from "../adapters/conversation-state.js";
import {
  buildApexosBasis,
  buildUnavailableBasis,
  formatInterfaceStatusBlock,
} from "../adapters/apexos-basis.js";
import { buildGlassBox, buildUnavailableGlassBox } from "../adapters/glass-box.js";
import {
  isGlassBoxRequest,
  resolveGlassBoxRequest,
} from "../adapters/glass-box-request.js";
import { RequestLifecycle } from "../adapters/request-lifecycle.js";
import { attachApexosRequestIdToLatestCall } from "../adapters/connector-activity.js";
import { runtimeConfig } from "../../config.js";
import {
  PRIMARY_TOOL_DESCRIPTION,
  PRIMARY_TOOL_NAME,
  PRIMARY_TOOL_TITLE,
  CHATGPT_FACING_TOOL_NAMES,
} from "../connector-guidance.js";

const executiveRequestSchema = {
  message: z
    .string()
    .describe(
      "The executive’s natural message, verbatim. Examples: leadership meeting prep, follow-ups like “What should I say first?”, or “Show the Glass Box”. Never ask the executive for IDs."
    ),
  executiveSlug: z
    .string()
    .optional()
    .describe("Internal only if already known. Do not ask the executive."),
  situationSlug: z
    .string()
    .optional()
    .describe("Internal only if already known. Do not ask the executive."),
  conversationId: z
    .string()
    .optional()
    .describe(
      "Internal continuity UUID only. Prefer omitting — server resolves session/durable continuity. Never ask the executive."
    ),
  previousResponseId: z
    .string()
    .optional()
    .describe("Optional prior OpenAI response ID for model chaining"),
};

type ToolPayload = Record<string, unknown>;

type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: ToolPayload;
  isError?: true;
};

function finalizeToolResult(
  life: RequestLifecycle,
  payload: ToolPayload,
  status: "invoked" | "failed",
  isError = false
): McpToolResult {
  const withDiag: ToolPayload = {
    ...payload,
    invocation: life.buildInvocation(status),
    lifecycle: life.buildLifecycleDiagnostic(),
  };
  const text = JSON.stringify(withDiag, null, 2);
  life.mcpResponseSent({
    success: !isError,
    responseBytes: Buffer.byteLength(text, "utf8"),
    contentType: "application/json",
  });
  // Refresh envelope after mcp_response_sent so responseReturned is accurate.
  const finalPayload: ToolPayload = {
    ...withDiag,
    invocation: life.buildInvocation(status),
    lifecycle: life.buildLifecycleDiagnostic(),
  };
  const finalText = JSON.stringify(finalPayload, null, 2);
  const result: McpToolResult = {
    content: [{ type: "text", text: finalText }],
    structuredContent: finalPayload,
  };
  if (isError) result.isError = true;
  return result;
}

function displayHasBasisAndReminder(display: string): {
  basisIncluded: boolean;
  glassBoxReminderIncluded: boolean;
} {
  return {
    basisIncluded: display.includes("ApexOS Basis:"),
    glassBoxReminderIncluded: display.includes("Glass Box:"),
  };
}

type ExecutiveArgs = {
  message: string;
  executiveSlug?: string;
  situationSlug?: string;
  conversationId?: string;
  previousResponseId?: string;
};

function sessionKeyKind(sessionKey: string): "mcp_session" | "stdio_process" {
  return sessionKey === STDIO_SESSION_KEY ? "stdio_process" : "mcp_session";
}

async function handleExecutiveConversation(
  args: ExecutiveArgs,
  extra: { sessionId?: string } | undefined,
  toolName: string
): Promise<McpToolResult> {
  const life = new RequestLifecycle(toolName);
  const sessionKey = resolveSessionKey(extra?.sessionId);
  const executiveSlug = args.executiveSlug ?? runtimeConfig.executiveSlug;
  const glassBoxRequest = isGlassBoxRequest(args.message);
  let result: McpToolResult | undefined;

  life.requestReceived({
    messageLength: args.message?.length ?? 0,
    sessionKeyKind: sessionKeyKind(sessionKey),
    glassBoxRequest,
  });
  attachApexosRequestIdToLatestCall(toolName, life.requestId);

  try {
    if (glassBoxRequest) {
      life.runtimeStarting();
      const continuity = await resolveContinuity({
        explicitConversationId: args.conversationId,
        sessionKey,
        executiveSlug,
      });
      life.continuityResolved(continuity.continuitySource);

      const resolved = await resolveGlassBoxRequest({
        sessionKey,
        executiveSlug,
        runtimeIdHint: continuity.lastRuntimeId,
      });

      const glassAvailable = Boolean(resolved.glassBox);
      const apexosBasis = buildApexosBasis({
        conversationId: resolved.conversationId,
        continuitySource: continuity.continuitySource,
        persistenceStatus: glassAvailable ? "persisted" : "skipped",
        recordsCreated: [],
        recordsRetrieved: [],
        stages: [],
        traceConfirmed: glassAvailable,
        runtimeAvailable: true,
        glassBoxOnly: true,
        continuityDisclosure: continuity.disclosure,
      });

      life.runtimeCompleted({
        runtimeId: resolved.runtimeId,
        conversationId: resolved.conversationId,
        captureConfirmed: false,
        retrievalConfirmed: glassAvailable,
        persistenceConfirmed: glassAvailable,
        traceConfirmed: glassAvailable,
      });

      const apexosBasisDisplay = formatInterfaceStatusBlock(apexosBasis, {
        glassBoxAvailable: glassAvailable,
      });
      life.responseAssembled(displayHasBasisAndReminder(apexosBasisDisplay));

      result = finalizeToolResult(
        life,
        {
          runtimeId: resolved.runtimeId,
          response: glassAvailable
            ? "Glass Box for the most recent confirmed ApexOS runtime response."
            : (resolved.reason ??
              "No confirmed Glass Box is available for this response."),
          conversationId: resolved.conversationId,
          apexosBasis,
          apexosBasisDisplay,
          glassBox: resolved.glassBox,
          glassBoxRequest: true,
          executionMetadata: {
            continuitySource: continuity.continuitySource,
            glassBoxSource: resolved.source,
            conversationId: resolved.conversationId,
          },
        },
        "invoked"
      );
    } else {
      life.runtimeStarting();
      const continuity = await resolveContinuity({
        explicitConversationId: args.conversationId,
        sessionKey,
        executiveSlug,
      });
      life.continuityResolved(continuity.continuitySource);

      const runtimeResult = await invokeExecuteRuntime({
        ...args,
        conversationId: continuity.conversationId,
      });

      if (runtimeResult.conversationId) {
        rememberConversation(sessionKey, runtimeResult.conversationId, runtimeResult.runtimeId);
      }

      const apexosBasis = buildApexosBasis({
        conversationId: runtimeResult.conversationId,
        continuitySource: continuity.continuitySource,
        persistenceStatus: runtimeResult.metadata.persistenceStatus,
        recordsCreated: runtimeResult.metadata.recordsCreated,
        recordsRetrieved: runtimeResult.metadata.recordsRetrieved,
        retrievalErrors: runtimeResult.metadata.retrievalErrors,
        captureErrors: runtimeResult.metadata.captureErrors,
        stages: runtimeResult.stages,
        runtimeAvailable: true,
        continuityDisclosure: continuity.disclosure,
      });

      life.runtimeCompleted({
        runtimeId: runtimeResult.runtimeId,
        conversationId: runtimeResult.conversationId,
        captureConfirmed: apexosBasis.persistenceConfirmed,
        retrievalConfirmed: apexosBasis.retrievalConfirmed,
        persistenceConfirmed: apexosBasis.persistenceConfirmed,
        traceConfirmed: apexosBasis.traceConfirmed,
      });

      const glassBox = buildGlassBox({
        runtimeId: runtimeResult.runtimeId,
        conversationId: runtimeResult.conversationId,
        contextPackageId: runtimeResult.contextPackageId,
        contextPackage: runtimeResult.contextPackage,
        recordsCreated: runtimeResult.metadata.recordsCreated,
        recordsRetrieved: runtimeResult.metadata.recordsRetrieved,
        stages: runtimeResult.stages,
      });

      const apexosBasisDisplay = formatInterfaceStatusBlock(apexosBasis, {
        glassBoxAvailable: true,
      });
      life.responseAssembled(displayHasBasisAndReminder(apexosBasisDisplay));

      result = finalizeToolResult(
        life,
        {
          runtimeId: runtimeResult.runtimeId,
          response: runtimeResult.response,
          conversationId: runtimeResult.conversationId,
          apexosBasis,
          apexosBasisDisplay,
          glassBox,
          executionMetadata: {
            responseId: runtimeResult.responseId,
            situationSlug: runtimeResult.situationSlug,
            conversationId: runtimeResult.conversationId,
            interactionId: runtimeResult.interactionId,
            contextPackageId: runtimeResult.contextPackageId,
            continuitySource: continuity.continuitySource,
            stages: runtimeResult.stages,
            ...runtimeResult.metadata,
          },
        },
        "invoked"
      );
    }
  } catch (err) {
    if (!life.buildLifecycleDiagnostic().events.includes("request_failed")) {
      life.requestFailed(life.getCurrentStage(), err);
    }
    const structured = toStructuredError(err, null);
    const apexosBasis = buildUnavailableBasis("unavailable");
    const apexosBasisDisplay = formatInterfaceStatusBlock(apexosBasis, {
      glassBoxAvailable: false,
    });
    if (!life.buildLifecycleDiagnostic().events.includes("response_assembled")) {
      life.responseAssembled(displayHasBasisAndReminder(apexosBasisDisplay));
    }
    result = finalizeToolResult(
      life,
      {
        ...structured,
        apexosBasis,
        apexosBasisDisplay,
        glassBox: buildUnavailableGlassBox(null),
      },
      "failed",
      true
    );
  } finally {
    // Failures cannot skip terminal lifecycle logging.
    if (!life.buildLifecycleDiagnostic().events.includes("mcp_response_sent")) {
      life.mcpResponseSent({
        success: false,
        responseBytes: 0,
        contentType: "none",
      });
      if (!result) {
        const apexosBasis = buildUnavailableBasis("unavailable");
        const apexosBasisDisplay = formatInterfaceStatusBlock(apexosBasis, {
          glassBoxAvailable: false,
        });
        result = {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  invocation: life.buildInvocation("failed"),
                  lifecycle: life.buildLifecycleDiagnostic(),
                  apexosBasis,
                  apexosBasisDisplay,
                },
                null,
                2
              ),
            },
          ],
          structuredContent: {
            invocation: life.buildInvocation("failed"),
            lifecycle: life.buildLifecycleDiagnostic(),
            apexosBasis,
            apexosBasisDisplay,
          },
          isError: true,
        };
      }
    }
  }

  return result!;
}

/** Names registered on the MCP server for ChatGPT connector routing. */
export function listRegisteredChatgptToolNames(): readonly string[] {
  return CHATGPT_FACING_TOOL_NAMES;
}

/**
 * Register ChatGPT-facing tools only.
 * Health/diagnostics stay on HTTP GET /health and library APIs — not in tools/list.
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    PRIMARY_TOOL_NAME,
    {
      title: PRIMARY_TOOL_TITLE,
      description: PRIMARY_TOOL_DESCRIPTION,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: z.object(executiveRequestSchema),
    },
    async (args, extra) => handleExecutiveConversation(args, extra, PRIMARY_TOOL_NAME)
  );
}
