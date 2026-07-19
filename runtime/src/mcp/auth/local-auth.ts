import { mcpConfig } from "../config/mcp-config.js";

/**
 * Simple local authentication for stdio tool calls.
 * When APEXOS_MCP_TOKEN is set, tool calls must include a matching auth_token.
 * HTTP Streamable auth uses OAuth (tunnel) or static Bearer via static-bearer.ts.
 */
export function validateAuthToken(provided?: string): void {
  if (!mcpConfig.authToken) return;

  if (!provided || provided !== mcpConfig.authToken) {
    throw new AuthError("Invalid or missing auth_token");
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
