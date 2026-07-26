import { randomUUID } from "node:crypto";
import { getSupabase } from "../../shared/supabase.js";
import type { PipelineContext } from "../../types/pipeline.js";
import type { AuditRecordRef, CaptureAudit } from "../../types/pipeline.js";
import {
  extractColdStart,
  extractInterpretiveSegments,
  type EpistemicType,
} from "./cold-start-extractor.js";

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function ref(table: string, id: string, type?: string, externalId?: string): AuditRecordRef {
  return { table, id, type, externalId };
}

/**
 * Persist minimum structured cold-start records from executive source + labeled
 * interpretive segments from the ApexOS response (never as source evidence).
 */
export async function persistStructuredCapture(ctx: PipelineContext): Promise<CaptureAudit> {
  const supabase = getSupabase();
  const created: AuditRecordRef[] = [];
  const errors: string[] = [];
  const extraction = extractColdStart(ctx.request.message);
  let situationId = ctx.situation?.id ?? null;
  let situationSlug = ctx.situation?.slug ?? null;

  if (!extraction.isMaterialSituation && !situationId) {
    return { created, situationId, situationSlug, errors, extraction };
  }

  try {
    if (!situationId && extraction.isMaterialSituation) {
      const externalId = `SIT-RT-${shortId()}`;
      const slug = `runtime-${shortId()}-${extraction.situationType}`.slice(0, 80);
      const { data: sit, error } = await supabase
        .from("situations")
        .insert({
          external_id: externalId,
          slug,
          title: extraction.title.slice(0, 200),
          situation_summary: extraction.summary,
          situation_type: extraction.situationType,
          status: "active",
          architecture_layer: "foundations",
          repository_path: `runtime/capture/situations/${slug}.md`,
          source_document: "runtime/build-16-cold-start",
          transformation_log: [
            {
              at: new Date().toISOString(),
              action: "cold_start_capture",
              requestId: ctx.request.requestId,
              conversationId: ctx.request.conversationId,
            },
          ],
        })
        .select("id, slug, title, situation_summary, situation_type")
        .single();

      if (error) throw error;
      situationId = sit.id;
      situationSlug = sit.slug;
      created.push(ref("situations", sit.id, "situation", externalId));
      ctx.situation = {
        id: sit.id,
        slug: sit.slug,
        title: sit.title,
        summary: sit.situation_summary ?? undefined,
        situationType: sit.situation_type ?? undefined,
      };
    }

    const personIds: string[] = [];
    for (const person of extraction.people) {
      const externalId = `PER-RT-${person.slug}`.slice(0, 64);
      const { data: existing } = await supabase
        .from("persons")
        .select("id, external_id")
        .eq("slug", person.slug)
        .maybeSingle();

      if (existing) {
        personIds.push(existing.id);
        created.push(ref("persons", existing.id, "person", existing.external_id));
        continue;
      }

      const { data: inserted, error } = await supabase
        .from("persons")
        .insert({
          external_id: externalId,
          slug: person.slug,
          display_name: person.displayName,
          status: "active",
          architecture_layer: "foundations",
          repository_path: `runtime/capture/persons/${person.slug}.md`,
          source_document: "runtime/build-16-cold-start",
        })
        .select("id, external_id")
        .single();

      if (error) {
        // Race / unique conflict — try fetch
        const { data: again } = await supabase
          .from("persons")
          .select("id, external_id")
          .eq("slug", person.slug)
          .maybeSingle();
        if (again) {
          personIds.push(again.id);
          created.push(ref("persons", again.id, "person", again.external_id));
        } else {
          errors.push(`person:${person.slug}:${error.message}`);
        }
        continue;
      }

      personIds.push(inserted.id);
      created.push(ref("persons", inserted.id, "person", inserted.external_id));
    }

    if (personIds.length >= 2 && situationId) {
      const slug = `rel-${personIds
        .slice(0, 2)
        .map((id) => id.slice(0, 8))
        .join("-")}`;
      const externalId = `REL-RT-${shortId()}`;
      const { data: existingRel } = await supabase
        .from("relationships")
        .select("id, external_id")
        .eq("slug", slug)
        .maybeSingle();

      let relationshipId = existingRel?.id ?? null;
      if (!existingRel) {
        const names = extraction.people
          .slice(0, 2)
          .map((p) => p.displayName)
          .join(" — ");
        const { data: rel, error: relErr } = await supabase
          .from("relationships")
          .insert({
            external_id: externalId,
            slug,
            title: `Working relationship: ${names}`,
            status: "active",
            architecture_layer: "foundations",
            repository_path: `runtime/capture/relationships/${slug}.md`,
            source_document: "runtime/build-16-cold-start",
          })
          .select("id, external_id")
          .single();
        if (relErr) {
          errors.push(`relationship:${relErr.message}`);
        } else {
          relationshipId = rel.id;
          created.push(ref("relationships", rel.id, "relationship", rel.external_id));
          await supabase.from("relationship_participants").upsert(
            personIds.slice(0, 2).map((person_id) => ({
              relationship_id: rel.id,
              person_id,
            }))
          );
        }
      } else {
        created.push(ref("relationships", existingRel.id, "relationship", existingRel.external_id));
      }

      void relationshipId;
    }

    for (const [index, fact] of extraction.sourceFacts.entries()) {
      const externalId = `OBS-SRC-${shortId()}`;
      const relatedPersonId = personIds[index] ?? personIds[0] ?? null;
      const { data: obs, error } = await supabase
        .from("observations")
        .insert({
          external_id: externalId,
          title: `Source evidence ${index + 1}`,
          summary: fact.text.slice(0, 500),
          confidence: "high",
          related_person_id: relatedPersonId,
          related_situation_id: situationId,
          observation_date: new Date().toISOString().slice(0, 10),
          observed_by: ctx.executive?.displayName ?? ctx.executive?.slug ?? "executive",
          review_status: "draft",
          status: "draft",
          architecture_layer: "memory",
          repository_path: `runtime/capture/observations/${externalId}.md`,
          source_document: "runtime/build-16-cold-start",
          body_md: [
            `# Source Evidence`,
            ``,
            `**Epistemic type:** ${fact.epistemicType}`,
            `**Source:** executive message`,
            `**Request:** ${ctx.request.requestId}`,
            `**Conversation:** ${ctx.request.conversationId ?? "n/a"}`,
            ``,
            fact.text,
          ].join("\n"),
          transformation_log: [
            {
              epistemic_type: fact.epistemicType,
              conversation_id: ctx.request.conversationId,
              request_id: ctx.request.requestId,
            },
          ],
        })
        .select("id, external_id")
        .single();

      if (error) errors.push(`observation:${error.message}`);
      else created.push(ref("observations", obs.id, fact.epistemicType, obs.external_id));
    }

    const interpretive = extractInterpretiveSegments(ctx.llmResponse?.text ?? "");
    for (const segment of interpretive) {
      await insertInterpretiveArtifact(ctx, situationId, segment.epistemicType, segment.text, created, errors);
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  if (situationId && ctx.request.conversationId) {
    await supabase
      .from("executive_conversations")
      .update({
        situation_id: situationId,
        situation_slug: situationSlug,
        updated_at: new Date().toISOString(),
        situation_package: {
          build: 16,
          lastRequestId: ctx.request.requestId,
          createdRecordIds: created,
          extraction: {
            situationType: extraction.situationType,
            people: extraction.people,
            isMaterialSituation: extraction.isMaterialSituation,
          },
        },
      })
      .eq("id", ctx.request.conversationId);
  }

  return { created, situationId, situationSlug, errors, extraction };
}

async function insertInterpretiveArtifact(
  ctx: PipelineContext,
  situationId: string | null,
  epistemicType: EpistemicType,
  text: string,
  created: AuditRecordRef[],
  errors: string[]
): Promise<void> {
  const supabase = getSupabase();
  const externalId = `MEM-${epistemicType.slice(0, 3).toUpperCase()}-${shortId()}`;
  const { data, error } = await supabase
    .from("memory_artifacts")
    .insert({
      external_id: externalId,
      category: "situation",
      title: `${epistemicType}: ${text.slice(0, 80)}`,
      summary: text.slice(0, 500),
      confidence: "low",
      situation_id: situationId,
      review_status: "draft",
      status: "draft",
      tags: ["build16", epistemicType, "interpretation"],
      architecture_layer: "memory",
      repository_path: `runtime/capture/memory/${externalId}.md`,
      source_document: "runtime/build-16-interpretation",
      body_md: [
        `# ${epistemicType}`,
        ``,
        `**Epistemic type:** ${epistemicType}`,
        `**Source:** apexos_response (interpretation — not executive evidence)`,
        `**Request:** ${ctx.request.requestId}`,
        ``,
        text,
      ].join("\n"),
      metadata: {
        epistemic_type: epistemicType,
        conversation_id: ctx.request.conversationId,
        request_id: ctx.request.requestId,
        source: "apexos_response",
      },
    })
    .select("id, external_id")
    .single();

  if (error) errors.push(`memory_artifacts:${epistemicType}:${error.message}`);
  else created.push(ref("memory_artifacts", data.id, epistemicType, data.external_id));
}
