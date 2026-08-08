import { getSupabase } from "../shared/supabase.js";

export const KNOWLEDGE_BUCKET = "knowledge-source-material";

export function buildStorageObjectPath(opts: {
  sourceType: string;
  externalId: string;
  filename: string;
}): string {
  const safeType = opts.sourceType.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "unknown";
  const safeName = opts.filename.replace(/[/\\]/g, "_").replace(/\.\./g, "_");
  return `${safeType}/${opts.externalId}/${safeName}`;
}

export async function storeOriginalFile(opts: {
  objectPath: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<{ stored: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(opts.objectPath, opts.bytes, {
      contentType: opts.mimeType,
      upsert: false,
    });

  if (error) {
    // Idempotent retry: object already exists for same path
    if (/exists|duplicate|already/i.test(error.message)) {
      return { stored: true };
    }
    return { stored: false, error: error.message };
  }
  return { stored: true };
}
