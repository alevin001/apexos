import { getSupabaseServer } from "./supabase-server";
import type { Situation } from "@/types/executive";
import { appendTransformationLog } from "./supabase-server";

export async function listSituations(limit = 20): Promise<Situation[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("situations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Situation[];
}

export async function createSituation(input: {
  title: string;
  situation_summary: string;
  situation_type?: string;
}): Promise<Situation> {
  const supabase = getSupabaseServer();
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
  const externalId = `SIT-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from("situations")
    .insert({
      external_id: externalId,
      slug: uniqueSlug,
      title: input.title,
      situation_summary: input.situation_summary,
      situation_type: input.situation_type ?? "general",
      status: "active",
      repository_path: `situations/${uniqueSlug}.md`,
      transformation_log: appendTransformationLog([], {
        action: "created",
        rationale: "Created via executive interface",
        actor: "executive-ui",
      }),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Situation;
}

export async function archiveSituation(slug: string): Promise<Situation> {
  const supabase = getSupabaseServer();
  const { data: existing } = await supabase
    .from("situations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) throw new Error("Situation not found");

  const { data, error } = await supabase
    .from("situations")
    .update({
      status: "archived",
      transformation_log: appendTransformationLog(existing.transformation_log, {
        action: "archived",
        rationale: "Archived via executive interface",
        actor: "executive-ui",
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Situation;
}

export async function listActiveSituations(): Promise<Situation[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("situations")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  return (data ?? []) as Situation[];
}
