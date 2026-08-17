import { getSupabase } from "../shared/supabase.js";

/**
 * Canonical parent-email ↔ attachment-child lineage resolver.
 * Uses knowledge_source_attachment_links only — never a single parent column.
 */
export async function resolveParentEmailsForChild(
  childSourceId: string
): Promise<Array<{ parentSourceId: string; parentExternalId: string; parentTitle?: string }>> {
  const supabase = getSupabase();
  const { data: links, error } = await supabase
    .from("knowledge_source_attachment_links")
    .select("parent_source_id, attachment_ordinal, displayed_filename")
    .eq("child_source_id", childSourceId);
  if (error || !links?.length) return [];

  const parentIds = [...new Set(links.map((l) => l.parent_source_id as string))];
  const { data: parents } = await supabase
    .from("knowledge_sources")
    .select("id, external_id, title, original_filename")
    .in("id", parentIds);

  const byId = new Map((parents ?? []).map((p) => [p.id as string, p]));
  return parentIds
    .map((id) => {
      const p = byId.get(id);
      if (!p) return null;
      return {
        parentSourceId: id,
        parentExternalId: p.external_id as string,
        parentTitle: (p.original_filename as string) || (p.title as string) || undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export async function resolveAttachmentLinksForChild(childSourceId: string): Promise<
  Array<{
    parentSourceId: string;
    parentExternalId: string;
    ordinal: number;
    displayedFilename: string;
  }>
> {
  const supabase = getSupabase();
  const { data: links } = await supabase
    .from("knowledge_source_attachment_links")
    .select("parent_source_id, attachment_ordinal, displayed_filename")
    .eq("child_source_id", childSourceId);
  if (!links?.length) return [];

  const parents = await resolveParentEmailsForChild(childSourceId);
  const extById = new Map(parents.map((p) => [p.parentSourceId, p.parentExternalId]));
  return links.map((l) => ({
    parentSourceId: l.parent_source_id as string,
    parentExternalId: extById.get(l.parent_source_id as string) ?? "unknown",
    ordinal: l.attachment_ordinal as number,
    displayedFilename: l.displayed_filename as string,
  }));
}
