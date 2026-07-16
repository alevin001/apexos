import { mcpConfig } from "../config/mcp-config.js";

/**
 * Simple local authentication for development.
 * When APEXOS_MCP_TOKEN is set, tool calls must include a matching auth_token.
 * When unset, authentication is disabled (local-only trust boundary).
 */
export function validateAuthToken(provided?: string): void {
  if (!mcpConfig.authToken) return;

  if (!provided || provided !== mcpConfig.authToken) {
    throw new AuthError("Invalid or missing auth_token");
  }
}

/** Validate Bearer token on HTTP requests when APEXOS_MCP_TOKEN is configured. */
export function validateBearerAuth(authHeader: string | undefined): void {
  if (!mcpConfig.authToken) return;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing Bearer token");
  }

  const token = authHeader.slice("Bearer ".length);
  if (token !== mcpConfig.authToken) {
    throw new AuthError("Invalid Bearer token");
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
