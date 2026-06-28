import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./config.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type RegistryEntry = {
  external_id: string;
  table_name: string;
  record_id: string;
  repository_path: string;
  architecture_layer: string;
  title: string;
  status: string;
};

export async function fetchRegistry(): Promise<Map<string, RegistryEntry>> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("artifact_registry").select("*");
  if (error) throw error;

  const map = new Map<string, RegistryEntry>();
  for (const row of data ?? []) {
    const entry = row as RegistryEntry;
    map.set(entry.external_id, entry);
    if (entry.repository_path) {
      map.set(normalizePath(entry.repository_path), entry);
    }
  }
  return map;
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

export async function resolveId(
  ref: string | undefined | null,
  registry: Map<string, RegistryEntry>,
  slugLookup?: Map<string, string>
): Promise<string | null> {
  if (!ref) return null;
  const normalized = normalizePath(ref);

  const byPath = registry.get(normalized);
  if (byPath) return byPath.record_id;

  const byExtId = registry.get(ref);
  if (byExtId) return byExtId.record_id;

  if (slugLookup?.has(ref)) return slugLookup.get(ref)!;

  const pathSuffix = normalized.split("/").pop() ?? normalized;
  for (const [key, entry] of registry) {
    if (key.endsWith(pathSuffix)) return entry.record_id;
  }

  return null;
}
