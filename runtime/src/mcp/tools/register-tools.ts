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
import {
  consumeAttachmentReminder,
  hasUsableFileReference,
} from "../adapters/attachment-reminder.js";
import { runtimeConfig } from "../../config.js";
import {
  PRIMARY_TOOL_DESCRIPTION,
  PRIMARY_TOOL_NAME,
  PRIMARY_TOOL_TITLE,
  INGEST_TOOL_DESCRIPTION,
  INGEST_TOOL_NAME,
  INGEST_TOOL_TITLE,
  CHATGPT_FACING_TOOL_NAMES,
} from "../connector-guidance.js";
import { ingestChatGptAttachment } from "../../knowledge/chatgpt-attachment.js";

const chatgptFileSchema = z
  .object({
    download_url: z.string(),
    file_id: z.string(),
    mime_type: z.string().optional(),
    file_name: z.string().optional(),
  })
  .passthrough();

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
  file: z
    .union([chatgptFileSchema, z.string()])
    .optional()
    .nullable()
    .describe(
      "Optional ChatGPT-injected attachment reference for this turn. When present, ApexOS may emit a one-time attachment reminder. Does not ingest."
    ),
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
  file?: { download_url?: string; file_id?: string; mime_type?: string; file_name?: string } | string | null;
};

function withAttachmentReminder(
  sessionKey: string,
  file: ExecutiveArgs["file"],
  payload: ToolPayload
): ToolPayload {
  const reminder = consumeAttachmentReminder(sessionKey, file);
  if (!reminder) {
    return {
      ...payload,
      attachmentReceived: hasUsableFileReference(file),
      attachmentReminder: null,
    };
  }
  const response =
    typeof payload.response === "string" && payload.response.trim()
      ? `${payload.response}\n\n${reminder}`
      : reminder;
  const display =
    typeof payload.apexosBasisDisplay === "string"
      ? `${payload.apexosBasisDisplay}\n${reminder}`
      : payload.apexosBasisDisplay;
  return {
    ...payload,
    response,
    apexosBasisDisplay: display,
    attachmentReceived: true,
    attachmentReminder: reminder,
  };
}

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
        withAttachmentReminder(sessionKey, args.file, {
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
        }),
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
        withAttachmentReminder(sessionKey, args.file, {
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
        }),
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
const ingestSourceSchema = {
  file: z
    .union([chatgptFileSchema, z.string()])
    .optional()
    .nullable()
    .describe(
      "ChatGPT-injected file reference ({ download_url, file_id, mime_type?, file_name? }) or file_id string. Prefer host injection via openai/fileParams."
    ),
  fileName: z.string().optional().describe("Original filename when known"),
  mimeType: z.string().optional().describe("MIME type when known"),
  textContent: z
    .string()
    .optional()
    .describe(
      "Fallback when the host cannot transfer original bytes — treated as derived text, not the original file"
    ),
  title: z.string().optional().describe("Human-readable source title"),
  sourceOwner: z.string().optional().describe("Owner/origin when known"),
  scopeClassification: z.string().optional().describe("Topic/scope label when known"),
  replacesSourceId: z
    .string()
    .optional()
    .describe("Internal only — prior source UUID when correcting/replacing; prior source is preserved"),
};

async function handleIngestSource(args: {
  file?: { download_url?: string; file_id?: string; mime_type?: string; file_name?: string } | string | null;
  fileName?: string;
  mimeType?: string;
  textContent?: string;
  title?: string;
  sourceOwner?: string;
  scopeClassification?: string;
  replacesSourceId?: string;
}): Promise<McpToolResult> {
  const life = new RequestLifecycle(INGEST_TOOL_NAME);
  life.requestReceived({
    messageLength: args.textContent?.length ?? 0,
    sessionKeyKind: "mcp_session",
    glassBoxRequest: false,
  });
  attachApexosRequestIdToLatestCall(INGEST_TOOL_NAME, life.requestId);

  try {
    life.runtimeStarting();
    const { receipt, display, platformNote } = await ingestChatGptAttachment(args);
    life.runtimeCompleted({
      runtimeId: receipt.sourceExternalId ?? null,
      conversationId: null,
      captureConfirmed: receipt.durableKnowledgeConfirmed,
      retrievalConfirmed: receipt.retrievalReady,
      persistenceConfirmed: receipt.durableKnowledgeConfirmed,
      traceConfirmed: false,
    });
    life.responseAssembled({
      basisIncluded: false,
      glassBoxReminderIncluded: display.toLowerCase().includes("glass box"),
    });

    return finalizeToolResult(
      life,
      {
        response: display,
        ingestionReceipt: receipt,
        durableKnowledgeConfirmed: receipt.durableKnowledgeConfirmed,
        platformNote,
        glassBoxHint: receipt.glassBoxHint,
      },
      receipt.durableKnowledgeConfirmed || receipt.claim === "duplicate" ? "invoked" : "failed",
      !(receipt.durableKnowledgeConfirmed || receipt.claim === "duplicate")
    );
  } catch (err) {
    life.requestFailed(life.getCurrentStage(), err);
    const structured = toStructuredError(err, null);
    return finalizeToolResult(
      life,
      {
        ...structured,
        durableKnowledgeConfirmed: false,
        response:
          "ApexOS could not complete ingestion. The file is not confirmed in the durable knowledge base.",
      },
      "failed",
      true
    );
  }
}

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
      _meta: {
        "openai/fileParams": ["file"],
      },
    },
    async (args, extra) => handleExecutiveConversation(args, extra, PRIMARY_TOOL_NAME)
  );

  server.registerTool(
    INGEST_TOOL_NAME,
    {
      title: INGEST_TOOL_TITLE,
      description: INGEST_TOOL_DESCRIPTION,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: z.object(ingestSourceSchema),
      // ChatGPT host extension — injects uploaded file metadata into `file`
      _meta: {
        "openai/fileParams": ["file"],
      },
    },
    async (args) => handleIngestSource(args)
  );
}
