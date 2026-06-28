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
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and set it (service_role key required for ingestion).`
    );
  }
  return value;
}

export const TERMINAL_STATUSES = new Set([
  "complete",
  "delivered",
  "validated",
  "archived",
  "handed_off",
  "assembled",
  "active",
]);
