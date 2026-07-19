import { optionalEnv, requireEnv } from "../../config.js";
import { mcpConfig } from "../config/mcp-config.js";

export const MCP_OAUTH_SCOPES = ["mcp:tools"] as const;

export interface OauthHttpConfig {
  oauthEnabled: boolean;
  issuerUrl: URL;
  resourceUrl: URL;
  scopesSupported: readonly string[];
  resourceName: string;
  staticBearerToken: string | null;
  disableRateLimit: boolean;
  adminPassword: string | null;
  sessionSecret: string | null;
  sessionTtlSeconds: number;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const value = optionalEnv(name);
  if (!value) return fallback;
  return value === "true";
}

function validateIssuerUrl(url: URL): void {
  if (url.hash || url.search) {
    throw new Error(`${url.href} must not include query or fragment components`);
  }

  const allowInsecure =
    process.env.MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL === "true" ||
    process.env.MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL === "1";

  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1" &&
    !allowInsecure
  ) {
    throw new Error(
      `APEXOS_MCP_ISSUER_URL must use HTTPS (or localhost/127.0.0.1). Set MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL=true only for development.`
    );
  }
}

function loadAdminSecrets(oauthEnabled: boolean, overrides: Partial<OauthHttpConfig>) {
  if (!oauthEnabled) {
    return {
      adminPassword: overrides.adminPassword ?? null,
      sessionSecret: overrides.sessionSecret ?? null,
    };
  }

  const adminPassword = overrides.adminPassword ?? optionalEnv("APEXOS_MCP_ADMIN_PASSWORD");
  const sessionSecret = overrides.sessionSecret ?? optionalEnv("APEXOS_MCP_SESSION_SECRET");

  if (!adminPassword) {
    throw new Error(
      "APEXOS_MCP_ADMIN_PASSWORD is required when OAuth is enabled"
    );
  }
  if (!sessionSecret) {
    throw new Error(
      "APEXOS_MCP_SESSION_SECRET is required when OAuth is enabled"
    );
  }
  if (sessionSecret.length < 32) {
    throw new Error("APEXOS_MCP_SESSION_SECRET must be at least 32 characters");
  }

  return { adminPassword, sessionSecret };
}

export function loadOauthHttpConfig(overrides: Partial<OauthHttpConfig> = {}): OauthHttpConfig {
  const issuerFromEnv = optionalEnv("APEXOS_MCP_ISSUER_URL");
  const oauthEnabled = overrides.oauthEnabled ?? parseBoolean("APEXOS_MCP_OAUTH_ENABLED", Boolean(issuerFromEnv));

  const defaultIssuer = `http://127.0.0.1:${mcpConfig.port}`;
  const issuerUrl = overrides.issuerUrl ?? new URL(oauthEnabled ? requireEnv("APEXOS_MCP_ISSUER_URL") : issuerFromEnv || defaultIssuer);
  validateIssuerUrl(issuerUrl);

  const resourceUrl =
    overrides.resourceUrl ??
    new URL(optionalEnv("APEXOS_MCP_RESOURCE_URL", `${issuerUrl.origin}/mcp`));

  if (resourceUrl.pathname !== "/mcp") {
    throw new Error("APEXOS_MCP_RESOURCE_URL must point to the /mcp endpoint");
  }

  const secrets = loadAdminSecrets(oauthEnabled, overrides);

  return {
    oauthEnabled,
    issuerUrl,
    resourceUrl,
    scopesSupported: overrides.scopesSupported ?? MCP_OAUTH_SCOPES,
    resourceName: overrides.resourceName ?? mcpConfig.serverName,
    staticBearerToken: overrides.staticBearerToken ?? (mcpConfig.authToken || null),
    disableRateLimit:
      overrides.disableRateLimit ?? parseBoolean("APEXOS_MCP_OAUTH_DISABLE_RATE_LIMIT", false),
    adminPassword: secrets.adminPassword,
    sessionSecret: secrets.sessionSecret,
    sessionTtlSeconds:
      overrides.sessionTtlSeconds ??
      parseInt(optionalEnv("APEXOS_MCP_SESSION_TTL_SECONDS", "900"), 10),
  };
}
