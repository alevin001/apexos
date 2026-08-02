import { optionalEnv, runtimeConfig } from "../../config.js";

export const MCP_VERSION = "0.17.4";

export const mcpConfig = {
  serverName: optionalEnv("APEXOS_MCP_SERVER_NAME", "apexos"),
  serverVersion: MCP_VERSION,
  port: parseInt(optionalEnv("APEXOS_MCP_PORT", "3021"), 10),
  logLevel: optionalEnv("APEXOS_MCP_LOG_LEVEL", "info"),
  runtimeMode: optionalEnv("APEXOS_MCP_RUNTIME_MODE", "library") as "library" | "http",
  runtimeEndpoint: optionalEnv(
    "APEXOS_MCP_RUNTIME_ENDPOINT",
    `http://localhost:${runtimeConfig.port}`
  ),
  traceRetentionMs: parseInt(optionalEnv("APEXOS_MCP_TRACE_RETENTION_MS", "86400000"), 10),
} as const;
