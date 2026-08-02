/**
 * Build 17.4 — operator-only connector activity proof.
 * Records MCP transport JSON-RPC methods without message bodies or secrets.
 */

import { MCP_VERSION } from "../config/mcp-config.js";
import { getServerIdentity } from "../server-identity.js";

export type ConnectorActivityMethod =
  | "initialize"
  | "notifications/initialized"
  | "tools/list"
  | "tools/call"
  | "other";

export interface ConnectorActivityEvent {
  at: string;
  serverVersion: string;
  instanceId: string;
  transport: "streamable-http";
  arrivedViaHttpTunnelFacingTransport: true;
  sessionId: string | null;
  method: ConnectorActivityMethod | string;
  toolName: string | null;
  /** Present when tools/call targets apexos_conversation and lifecycle has started. */
  apexosConversationRequestId: string | null;
  jsonRpcId: string | number | null;
  httpMethod: string;
}

const RECENT_MAX = 100;
const recent: ConnectorActivityEvent[] = [];

function normalizeMethod(method: unknown): string {
  return typeof method === "string" ? method : "unknown";
}

function classifyMethod(method: string): ConnectorActivityMethod | string {
  if (
    method === "initialize" ||
    method === "notifications/initialized" ||
    method === "tools/list" ||
    method === "tools/call"
  ) {
    return method;
  }
  return method.startsWith("notifications/") || method.includes("/") ? method : "other";
}

export function recordConnectorActivity(input: {
  httpMethod: string;
  sessionId?: string | null;
  body: unknown;
}): ConnectorActivityEvent[] {
  const identity = getServerIdentity();
  const messages = Array.isArray(input.body)
    ? input.body
    : input.body && typeof input.body === "object"
      ? [input.body]
      : [];

  const recorded: ConnectorActivityEvent[] = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const msg = raw as Record<string, unknown>;
    const method = normalizeMethod(msg.method);
    if (method === "unknown") continue;

    const params = (msg.params ?? {}) as Record<string, unknown>;
    const toolName =
      method === "tools/call" && typeof params.name === "string" ? params.name : null;

    const event: ConnectorActivityEvent = {
      at: new Date().toISOString(),
      serverVersion: MCP_VERSION,
      instanceId: identity.instanceId,
      transport: "streamable-http",
      arrivedViaHttpTunnelFacingTransport: true,
      sessionId: input.sessionId ?? null,
      method: classifyMethod(method),
      toolName,
      apexosConversationRequestId: null,
      jsonRpcId:
        typeof msg.id === "string" || typeof msg.id === "number" ? (msg.id as string | number) : null,
      httpMethod: input.httpMethod,
    };

    recent.push(event);
    recorded.push(event);
  }

  while (recent.length > RECENT_MAX) recent.shift();
  return recorded;
}

/** Link a tools/call activity to the opaque apexos_conversation lifecycle requestId. */
export function attachApexosRequestIdToLatestCall(
  toolName: string,
  requestId: string
): void {
  for (let i = recent.length - 1; i >= 0; i--) {
    const ev = recent[i];
    if (ev.method === "tools/call" && ev.toolName === toolName && !ev.apexosConversationRequestId) {
      ev.apexosConversationRequestId = requestId;
      return;
    }
  }
}

export function getRecentConnectorActivity(limit = 50): ConnectorActivityEvent[] {
  const n = Math.max(1, Math.min(limit, RECENT_MAX));
  return recent.slice(-n).reverse();
}

export function clearConnectorActivityForTests(): void {
  recent.length = 0;
}
