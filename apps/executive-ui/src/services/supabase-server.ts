import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

const repoRoot = resolve(process.cwd(), "../..");
config({ path: resolve(repoRoot, ".env.local") });
config({ path: resolve(repoRoot, ".env") });

let client: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to repo root .env.local and set Supabase credentials.`
    );
  }
  return value;
}

/** Server-only Supabase client — service role for MVP (no auth UI). Never expose to browser. */
export function getSupabaseServer(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
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

export function isTerminalStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return TERMINAL_STATUSES.has(status.toLowerCase());
}

export function appendTransformationLog(
  existing: unknown,
  entry: Record<string, unknown>
): Record<string, unknown>[] {
  const log = Array.isArray(existing) ? [...existing] : [];
  log.push({ date: new Date().toISOString().slice(0, 10), ...entry });
  return log;
}
