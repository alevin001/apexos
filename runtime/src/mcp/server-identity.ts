/**
 * Build 17.4 — non-secret server identity fingerprint for connector-path proof.
 */

import { createHash, randomUUID } from "node:crypto";
import { MCP_VERSION } from "./config/mcp-config.js";
import { optionalEnv } from "../config.js";

const startedAt = new Date().toISOString();
const instanceId = randomUUID();

export interface TunnelIdentitySnapshot {
  /** Stable OpenAI control-plane tunnel id (not a secret). */
  tunnelId: string | null;
  /** Local upstream the tunnel forwards to. */
  localUpstream: string | null;
  /** Tunnel display name if known. */
  tunnelName: string | null;
  /** Short non-secret fingerprint for correlating ChatGPT registration. */
  publicEndpointFingerprint: string | null;
  /** How the snapshot was obtained. */
  source: "env" | "tunnel_status" | "unavailable";
  probedAt: string | null;
}

export interface ServerIdentity {
  service: "apexos-mcp";
  version: string;
  instanceId: string;
  startedAt: string;
  transport: "streamable-http";
  listen: string;
  tunnel: TunnelIdentitySnapshot;
}

let cachedTunnel: TunnelIdentitySnapshot = {
  tunnelId: optionalEnv("APEXOS_TUNNEL_ID", "") || null,
  localUpstream: optionalEnv("APEXOS_MCP_PUBLIC_UPSTREAM", "http://127.0.0.1:3021/mcp") || null,
  tunnelName: optionalEnv("APEXOS_TUNNEL_NAME", "ApexOS") || null,
  publicEndpointFingerprint: null,
  source: optionalEnv("APEXOS_TUNNEL_ID", "") ? "env" : "unavailable",
  probedAt: null,
};

function fingerprintTunnel(tunnelId: string | null, localUpstream: string | null): string | null {
  if (!tunnelId && !localUpstream) return null;
  const material = `${tunnelId ?? "none"}|${localUpstream ?? "none"}`;
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

cachedTunnel.publicEndpointFingerprint = fingerprintTunnel(
  cachedTunnel.tunnelId,
  cachedTunnel.localUpstream
);

export function getServerIdentity(): ServerIdentity {
  return {
    service: "apexos-mcp",
    version: MCP_VERSION,
    instanceId,
    startedAt,
    transport: "streamable-http",
    listen: `http://127.0.0.1:${optionalEnv("APEXOS_MCP_PORT", "3021")}/mcp`,
    tunnel: { ...cachedTunnel },
  };
}

/** Operator-facing one-liner for MCP instructions (no secrets). */
export function formatIdentityForInstructions(): string {
  const id = getServerIdentity();
  return `SERVER_IDENTITY instanceId=${id.instanceId} version=${id.version} startedAt=${id.startedAt} tunnelFingerprint=${id.tunnel.publicEndpointFingerprint ?? "none"}`;
}

/**
 * Best-effort refresh from local tunnel-client admin status (127.0.0.1:8080).
 * Never stores API keys.
 */
export async function refreshTunnelIdentityFromAdmin(
  healthBaseUrl = optionalEnv("APEXOS_TUNNEL_ADMIN_URL", "http://127.0.0.1:8080")
): Promise<TunnelIdentitySnapshot> {
  try {
    const res = await fetch(`${healthBaseUrl.replace(/\/$/, "")}/api/status`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const tunnelId =
      typeof data.control_plane_tunnel_id === "string" ? data.control_plane_tunnel_id : null;
    const localUpstream =
      typeof data.mcp_server_url === "string" ? data.mcp_server_url : cachedTunnel.localUpstream;
    const meta = data.tunnel_metadata as { Name?: string } | undefined;
    cachedTunnel = {
      tunnelId,
      localUpstream,
      tunnelName: meta?.Name ?? cachedTunnel.tunnelName,
      publicEndpointFingerprint: fingerprintTunnel(tunnelId, localUpstream),
      source: "tunnel_status",
      probedAt: new Date().toISOString(),
    };
  } catch {
    cachedTunnel = {
      ...cachedTunnel,
      source: cachedTunnel.tunnelId ? cachedTunnel.source : "unavailable",
      probedAt: new Date().toISOString(),
    };
  }
  return { ...cachedTunnel };
}

/** Test helper — reset in-memory identity fields that tests must not share across files. */
export function overrideTunnelIdentityForTests( partial: Partial<TunnelIdentitySnapshot>): void {
  cachedTunnel = {
    ...cachedTunnel,
    ...partial,
    publicEndpointFingerprint: fingerprintTunnel(
      partial.tunnelId !== undefined ? partial.tunnelId : cachedTunnel.tunnelId,
      partial.localUpstream !== undefined ? partial.localUpstream : cachedTunnel.localUpstream
    ),
  };
}
