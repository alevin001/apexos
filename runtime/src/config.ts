import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

config({ path: resolve(repoRoot, ".env.local") });
config({ path: resolve(repoRoot, ".env") });

export const REPO_ROOT = repoRoot;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and configure it.`
    );
  }
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const runtimeConfig = {
  env: optionalEnv("APEXOS_ENV", "local"),
  executiveSlug: optionalEnv("APEXOS_EXECUTIVE_SLUG", "primary-executive"),
  port: parseInt(optionalEnv("APEXOS_RUNTIME_PORT", "3020"), 10),
  llmProvider: optionalEnv("APEXOS_LLM_PROVIDER", "openai"),
  openaiModel: optionalEnv("OPENAI_MODEL", "gpt-4o-mini"),
  openaiApiKey: optionalEnv("OPENAI_API_KEY"),
  dryRun: optionalEnv("APEXOS_RUNTIME_DRY_RUN", "false") === "true",
} as const;
