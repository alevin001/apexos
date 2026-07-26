import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "../config.js";

let client: SupabaseClient | null = null;
let testOverride: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (testOverride) return testOverride;
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Test-only hook — do not use in production paths. */
export function setSupabaseForTests(mock: SupabaseClient | null): void {
  testOverride = mock;
}
