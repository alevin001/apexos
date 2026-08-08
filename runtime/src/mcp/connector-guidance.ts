/**
 * Build 17.2 — connector-facing guidance and tool metadata.
 * ChatGPT receives these via MCP initialize / tools/list.
 * Only conversational tools belong in that catalog — not health/diagnostics.
 */

export const PRIMARY_TOOL_NAME = "apexos_conversation";

/** Build 18 — governed knowledge ingestion (ChatGPT uploads / “add this to ApexOS”). */
export const INGEST_TOOL_NAME = "apexos_ingest_source";

/** Legacy name kept for docs/tests only — not registered on the ChatGPT connector. */
export const LEGACY_EXECUTE_RUNTIME_TOOL_NAME = "execute_runtime";

export const PRIMARY_TOOL_TITLE = "ApexOS Executive Conversation";

export const INGEST_TOOL_TITLE = "ApexOS Knowledge Ingestion";

/**
 * Tools exposed to ChatGPT for executive routing.
 * Health/diagnostic tools must never appear here.
 */
export const CHATGPT_FACING_TOOL_NAMES = [PRIMARY_TOOL_NAME, INGEST_TOOL_NAME] as const;

/** Names that must not appear in the ChatGPT connector tool catalog. */
export const CONNECTOR_EXCLUDED_DIAGNOSTIC_TOOLS = [
  "runtime_health",
  "runtime_status",
  "health",
  "health_check",
  "server_check",
  "build_context",
  "runtime_trace",
  LEGACY_EXECUTE_RUNTIME_TOOL_NAME,
] as const;

/**
 * Exact live-acceptance leadership prompt used in Build 17 validation.
 */
export const LEADERSHIP_LIVE_TEST_MESSAGE =
  "I need to prepare for a leadership meeting with Drew and Jesse. Help me decide the one conversation we need to have about healthy conflict and execution speed.";

export const PRIMARY_TOOL_DESCRIPTION = `THIS IS THE ApexOS TOOL for normal executive conversation when ApexOS is selected.

You MUST call this tool BEFORE answering whenever ApexOS is selected and the executive is doing executive work — leadership situations, meeting preparation, strategic questions, people issues, decisions, conflict, execution, and natural follow-ups.

Do NOT call any health, status, diagnostic, or “runtime check” tool for these requests. A health check is not an ApexOS executive answer. There is no separate preflight tool — this tool performs the executive runtime path itself (and returns a truthful degraded ApexOS Basis if the runtime is unavailable).

For file ingestion into the durable ApexOS knowledge base, use \`${INGEST_TOOL_NAME}\` instead (or in addition when the executive uploads a file to keep). Uploading a file in ChatGPT alone does NOT make it durable ApexOS knowledge.

Examples that REQUIRE this tool (call it; do not answer from general ChatGPT knowledge):
- Preparing for a leadership meeting with named people (e.g. Drew and Jesse) about healthy conflict and execution speed
- “What should I say first?” and other short follow-ups after an ApexOS situation
- “Show the Glass Box” / “Show the Glass Box for this response”
- Any request about what ApexOS remembers, what was established, or what to decide next

Pass the executive’s natural message in \`message\`. When the host provides an attachment for this turn, pass it in \`file\`. Do NOT ask for tool names, runtime IDs, conversation IDs, or internal identity.

If the tool result includes \`attachmentReminder\`, show that exact sentence once — it means ApexOS received a file reference that is not yet durable knowledge.

Only skip this tool for genuinely unrelated/casual chat, or when the executive explicitly asks to answer without ApexOS.

After a successful call, append the exact two-line \`apexosBasisDisplay\` to the user-facing answer. A response without a real tool result from this tool must NEVER include ApexOS Basis or Glass Box lines.`;

export const INGEST_TOOL_DESCRIPTION = `Governed ApexOS knowledge ingestion.

Call this tool when the executive uploads a file to keep in ApexOS, or says “Add this file to ApexOS” / “add this to ApexOS” / “Add this uploaded file to ApexOS.”

Pass the host file in \`file\` when ChatGPT injects attachment metadata. If only extracted text is available, pass \`textContent\` and set a filename. Never claim the file is in ApexOS unless the tool result has durableKnowledgeConfirmed=true.

When \`${PRIMARY_TOOL_NAME}\` returns \`attachmentReminder\`, show that exact sentence once to the executive — only when ApexOS actually received a file reference.

Do not ask the executive for storage paths, database IDs, or chunk details. Return the plain-language receipt to the executive.`;

export const SERVER_INSTRUCTIONS = `ApexOS Runtime MCP Server — Andrew’s executive intelligence system.

HARD RULE — WHEN APEXOS IS SELECTED:
For executive-work requests you MUST call \`${PRIMARY_TOOL_NAME}\` before answering.
Do NOT perform a health check, status check, or other diagnostic tool call as a substitute or preflight.
A health/status result is NOT an ApexOS executive-runtime response and must never be presented as one.
Do not substitute general ChatGPT reasoning for ApexOS on leadership, meeting prep, people, conflict, decisions, strategy, or follow-ups.
A response without a successful \`${PRIMARY_TOOL_NAME}\` call is NOT an ApexOS answer. Never invent ApexOS Basis, Glass Box, or database-grounded claims without a real tool result containing \`invocation.status: "invoked"\` from \`${PRIMARY_TOOL_NAME}\`.

KNOWLEDGE INGESTION:
Uploading a file in ChatGPT does NOT automatically make it durable ApexOS knowledge.
When a host file reference is available on a normal turn, pass it in \`${PRIMARY_TOOL_NAME}\`.\`file\` so ApexOS can emit the one-time attachment reminder (only when a file reference is actually received; only once per attachment).
When the executive says “Add this file to ApexOS” / “add this to ApexOS” / “Add this uploaded file to ApexOS.”, call \`${INGEST_TOOL_NAME}\` with the file reference.
Only report durable ingestion when the tool returns durableKnowledgeConfirmed=true.
If the host cannot pass the file, say so plainly and ask for the smallest explicit action: “Add this file to ApexOS.” (with text content if needed).
ChatGPT project memory and transient chat attachments are not ApexOS knowledge.

NEVER ASK THE EXECUTIVE FOR TECHNICAL IDS:
Do not ask for conversationId, executive ID, runtimeId, storage paths, or tool names. Continuity and ingestion receipts are resolved server-side.

MUST INVOKE \`${PRIMARY_TOOL_NAME}\` FOR:
- Leadership situations and meeting preparation (including Drew/Jesse, healthy conflict, execution speed)
- Strategic questions, people issues, decisions, and business context
- Natural follow-ups (e.g. “What should I say first?”)
- “Show the Glass Box” / “Show the Glass Box for this response” (trace-backed Glass Box path)

MUST INVOKE \`${INGEST_TOOL_NAME}\` FOR:
- File uploads the executive wants ApexOS to keep
- “Add this file to ApexOS” / “Add this to ApexOS” / “Add this uploaded file to ApexOS.”

MAY SKIP ONLY FOR:
- Genuinely unrelated/casual chat with no executive-work context
- Explicit “answer without ApexOS” requests

AFTER SUCCESSFUL CONVERSATION INVOCATION:
Append the exact two-line block from \`apexosBasisDisplay\`:
1) ApexOS Basis: [confirmed invocation / capture / retrieval / persistence / trace facts]
2) Glass Box: Available. Say “Show the Glass Box”…
Do not append the full glassBox object unless asked. When asked, present the returned glassBox only — never reconstruct from chat prose.

TOOLS EXPOSED TO CHATGPT:
- ${PRIMARY_TOOL_NAME} — conversational entry point for executive work
- ${INGEST_TOOL_NAME} — governed knowledge-base ingestion (files / “add this to ApexOS”)
Local HTTP GET /health remains for operators/tests; it is not a ChatGPT tool.

Platform note: the host cannot force a tool call, but YOUR instruction when ApexOS is selected is to call the correct ApexOS tool before answering — never a health check.`;

export type InvocationStatus = "invoked" | "failed" | "not_invoked";

export interface InvocationContract {
  status: InvocationStatus;
  tool: string;
  runtimeId: string | null;
  /** True only when this payload came from an actual ApexOS tool invocation. */
  apexosAnswer: boolean;
}

export function buildInvokedContract(
  tool: string,
  runtimeId: string | null,
  requestId: string | null = null
): InvocationContract & { requestId: string | null; responseReturned: boolean } {
  return {
    status: "invoked",
    tool,
    runtimeId,
    apexosAnswer: true,
    requestId,
    responseReturned: true,
  };
}

export function buildFailedContract(
  tool: string,
  runtimeId: string | null = null,
  requestId: string | null = null
): InvocationContract & { requestId: string | null; responseReturned: boolean } {
  return {
    status: "failed",
    tool,
    runtimeId,
    apexosAnswer: false,
    requestId,
    responseReturned: true,
  };
}

/**
 * Preferred ChatGPT tool for a message — never a health/diagnostic tool.
 */
export function selectToolForExecutiveMessage(message: string): string | null {
  if (messageRequiresKnowledgeIngest(message)) return INGEST_TOOL_NAME;
  if (!messageRequiresApexosRuntime(message)) return null;
  return PRIMARY_TOOL_NAME;
}

/** Explicit ingest / keep-in-ApexOS phrasing (Build 18). */
export function messageRequiresKnowledgeIngest(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;
  return (
    /\badd this (uploaded )?file to apexos\b/.test(m) ||
    /\badd this to apexos\b/.test(m) ||
    /\bingest (this|the) (file|document|upload)\b/.test(m) ||
    /\bkeep this (file|document|upload) in apexos\b/.test(m)
  );
}

/**
 * Classify whether a natural message must use the ApexOS runtime entry point.
 */
export function messageRequiresApexosRuntime(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;

  if (
    /\b(without apexos|don't use apexos|do not use apexos|answer without)\b/.test(m)
  ) {
    return false;
  }

  if (/\bglass\s*box\b/.test(m)) return true;

  if (
    /^(hi|hello|hey|thanks|thank you|good morning|good night)[.!]?$/i.test(m.trim())
  ) {
    return false;
  }
  if (/\b(weather|joke|coinflip|coin flip)\b/.test(m) && m.length < 80) {
    return false;
  }

  const executiveSignals = [
    /\bleadership\b/,
    /\bmeeting\b/,
    /\bprepare\b/,
    /\bdecision\b|\bdecide\b/,
    /\bconflict\b/,
    /\bexecution\b/,
    /\bstrategy\b|\bstrategic\b/,
    /\bpeople\b|\bteam\b/,
    /\bconversation\b/,
    /\bfollow[- ]?up\b/,
    /\bwhat should i (say|do)\b/,
    /\bdrew\b/,
    /\bjesse\b/,
    /\bapexos\b/,
    /\bestablished\b/,
    /\bremembers?\b/,
    /\bknowledge base\b/,
    /\bingested\b|\bsource material\b/,
  ];

  return executiveSignals.some((re) => re.test(m));
}

export function classifyLiveInvocation(payload: unknown | null | undefined): InvocationStatus {
  if (payload == null || typeof payload !== "object") return "not_invoked";
  const inv = (payload as { invocation?: { status?: string } }).invocation;
  if (!inv?.status) {
    const basis = (payload as { apexosBasisDisplay?: string }).apexosBasisDisplay;
    if (typeof basis === "string" && basis.includes("ApexOS Basis:")) return "invoked";
    return "not_invoked";
  }
  if (inv.status === "failed") return "failed";
  if (inv.status === "invoked") return "invoked";
  return "not_invoked";
}
