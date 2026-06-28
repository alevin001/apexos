import type { ParsedArtifact, LinkSpec } from "../shared/types.js";
import { getSupabase, resolveId, normalizePath, type RegistryEntry } from "../shared/supabase.js";
import {
  detectTableMapping,
  extractLinkSpecs,
  inferComponentTypeFromPath,
} from "./map-artifact.js";
import {
  decideIntegrityAction,
  appendTransformationLog,
  isTerminalStatus,
} from "./integrity.js";

type SlugMaps = {
  persons: Map<string, string>;
  situations: Map<string, string>;
  relationships: Map<string, string>;
};

/** Build 08 schema — only these tables include body_md (SCHEMA-MAP.md). */
const TABLES_WITH_BODY_MD = new Set([
  "decisions",
  "patterns",
  "knowledge_sources",
  "frameworks",
  "concepts",
  "knowledge_references",
  "observations",
  "memory_artifacts",
  "promotion_records",
  "outcome_references",
  "context_evaluations",
  "context_relevance_specs",
  "retrieval_requests",
  "evidence_packages",
  "contradictory_evidence_records",
  "assembled_context_packages",
  "interpretation_packages",
  "inference_components",
  "recommendation_packages",
  "recommendation_components",
  "outcome_captures",
  "validation_packages",
  "outcome_components",
  "learning_updates",
  "reinforcement_updates",
]);

const FK_FIELDS: Record<string, Record<string, string>> = {
  context_relevance_specs: {
    related_situation: "situations",
    retrieval_request: "retrieval_requests",
  },
  retrieval_requests: {
    context_reference: "context_relevance_specs",
    evidence_package: "evidence_packages",
    context_package: "assembled_context_packages",
  },
  evidence_packages: {
    retrieval_request: "retrieval_requests",
    context_reference: "context_relevance_specs",
  },
  assembled_context_packages: {
    retrieval_request: "retrieval_requests",
    evidence_package: "evidence_packages",
    context_reference: "context_relevance_specs",
  },
  interpretation_packages: {
    context_package: "assembled_context_packages",
    retrieval_request: "retrieval_requests",
    context_reference: "context_relevance_specs",
  },
  inference_components: {
    interpretation_package_id: "interpretation_packages",
  },
  recommendation_packages: {
    interpretation_package: "interpretation_packages",
    context_package: "assembled_context_packages",
    retrieval_request: "retrieval_requests",
    context_reference: "context_relevance_specs",
  },
  recommendation_components: {
    recommendation_package_id: "recommendation_packages",
  },
  outcome_captures: {
    recommendation_package: "recommendation_packages",
    interpretation_package: "interpretation_packages",
    context_package: "assembled_context_packages",
    related_validation_package: "validation_packages",
  },
  validation_packages: {
    recommendation_package: "recommendation_packages",
    interpretation_package: "interpretation_packages",
    context_package: "assembled_context_packages",
    retrieval_request: "retrieval_requests",
    context_reference: "context_relevance_specs",
    outcome_capture: "outcome_captures",
    learning_promoted: "learning_updates",
  },
  outcome_components: {
    validation_package_id: "validation_packages",
  },
  learning_updates: {
    validation_package_id: "validation_packages",
    outcome_capture: "outcome_captures",
    promoted_to_memory: "memory_artifacts",
  },
  observations: {
    related_person: "persons",
    related_relationship: "relationships",
    related_situation: "situations",
  },
};

export async function buildSlugMaps(): Promise<SlugMaps> {
  const supabase = getSupabase();
  const [persons, situations, relationships] = await Promise.all([
    supabase.from("persons").select("id, slug"),
    supabase.from("situations").select("id, slug"),
    supabase.from("relationships").select("id, slug"),
  ]);

  return {
    persons: new Map((persons.data ?? []).map((r) => [r.slug, r.id])),
    situations: new Map((situations.data ?? []).map((r) => [r.slug, r.id])),
    relationships: new Map((relationships.data ?? []).map((r) => [r.slug, r.id])),
  };
}

function mapRow(
  artifact: ParsedArtifact,
  mapping: ReturnType<typeof detectTableMapping>,
  registry: Map<string, RegistryEntry>,
  slugs: SlugMaps
): Record<string, unknown> {
  const fm = artifact.frontmatter;
  const row: Record<string, unknown> = {
    external_id: artifact.externalId,
    architecture_layer: mapping.architectureLayer,
    repository_path: artifact.repositoryPath,
    source_document: mapping.sourceDocument,
    schema_version: "1.0",
    transformation_log: fm.transformation_log ?? [],
  };

  if (TABLES_WITH_BODY_MD.has(mapping.table)) {
    row.body_md = artifact.body;
  }

  if (mapping.defaultRepositoryPath && !row.repository_path) {
    row.repository_path = mapping.defaultRepositoryPath;
  }

  const scalarFields: Record<string, Record<string, string>> = {
    executives: { slug: "slug", display_name: "display_name", summary: "summary", status: "status" },
    persons: { slug: "slug", display_name: "display_name", status: "status" },
    relationships: { slug: "slug", title: "title", status: "status" },
    situations: {
      slug: "slug",
      title: "title",
      situation_type: "situation_type",
      situation_summary: "situation_summary",
      status: "status",
    },
    knowledge_sources: {
      title: "title",
      author: "author",
      source: "source",
      source_type: "type",
      source_file_path: "source_file",
      summary: "summary",
      charter_alignment: "charter_alignment",
      memory_promotion: "memory_promotion",
      status: "status",
    },
    memory_artifacts: {
      category: "category",
      title: "title",
      summary: "summary",
      confidence: "confidence",
      situation_type: "situation_type",
      review_status: "review_status",
      status: "status",
    },
    context_relevance_specs: {
      domain: "domain",
      title: "title",
      situation_summary: "situation_summary",
      evaluation_date: "evaluation_date",
      weighting_rationale: "weighting_rationale",
      review_status: "review_status",
      status: "status",
    },
    retrieval_requests: {
      title: "title",
      request_date: "request_date",
      scope_summary: "scope_summary",
      validation_status: "validation_status",
      status: "status",
    },
    evidence_packages: {
      title: "title",
      assembly_date: "assembly_date",
      status: "status",
    },
    assembled_context_packages: {
      title: "title",
      assembly_date: "assembly_date",
      status: "status",
    },
    interpretation_packages: {
      title: "title",
      interpretation_date: "interpretation_date",
      confidence_summary: "confidence_summary",
      review_status: "review_status",
      status: "status",
    },
    inference_components: { title: "title", status: "status" },
    recommendation_packages: {
      title: "title",
      recommendation_date: "recommendation_date",
      confidence_summary: "confidence_summary",
      review_status: "review_status",
      status: "status",
    },
    recommendation_components: { title: "title", status: "status" },
    outcome_captures: {
      title: "title",
      capture_date: "capture_date",
      executive_decision_reference: "executive_decision_reference",
      recommendation_followed: "recommendation_followed",
      action_taken: "action_taken",
      observed_outcome: "observed_outcome",
      capture_method: "capture_method",
      status: "status",
    },
    validation_packages: {
      title: "title",
      validation_date: "validation_date",
      executive_decision_reference: "executive_decision_reference",
      action_taken_summary: "action_taken_summary",
      observed_outcome_summary: "observed_outcome_summary",
      validation_summary: "validation_summary",
      review_status: "review_status",
      status: "status",
    },
    outcome_components: { title: "title", status: "status" },
    learning_updates: {
      title: "title",
      learning_date: "learning_date",
      learning_type: "learning_type",
      validation_basis: "validation_basis",
      promotion_status: "promotion_status",
      status: "status",
    },
  };

  const fields = scalarFields[mapping.table];
  if (fields) {
    for (const [col, fmKey] of Object.entries(fields)) {
      if (fm[fmKey] !== undefined && fm[fmKey] !== null && fm[fmKey] !== "") {
        row[col] = fm[fmKey];
      }
    }
  }

  if (mapping.table === "knowledge_sources" && fm.type && !row.source_type) {
    row.source_type = fm.type;
  }
  if (fm.tags) row.tags = fm.tags;
  if (fm.domain_weights) row.domain_weights = fm.domain_weights;
  if (fm.retrieval_tiers) row.retrieval_tiers = fm.retrieval_tiers;
  if (fm.tier_requirements) row.tier_requirements = fm.tier_requirements;
  if (fm.retrieval_targets) row.retrieval_targets = fm.retrieval_targets;
  if (fm.exclusions) row.exclusions = fm.exclusions;
  if (fm.assembly_tiers) row.assembly_tiers = fm.assembly_tiers;
  if (fm.gaps) row.gaps = fm.gaps;
  if (fm.measurable_results) row.measurable_results = fm.measurable_results;
  if (fm.unexpected_consequences) row.unexpected_consequences = fm.unexpected_consequences;
  if (fm.uncertainty_flags) row.uncertainty_flags = fm.uncertainty_flags;
  if (fm.contradictory_evidence_required !== undefined) {
    row.contradictory_evidence_required = fm.contradictory_evidence_required;
  }

  const compType = inferComponentTypeFromPath(
    artifact.repositoryPath,
    mapping.table === "inference_components"
      ? "inference"
      : mapping.table === "recommendation_components"
        ? "recommendation"
        : "outcomes"
  );
  if (compType && mapping.table.endsWith("_components")) {
    row.component_type = compType;
  }

  if (fm.related_situation && typeof fm.related_situation === "string") {
    const situationId = slugs.situations.get(fm.related_situation) ?? null;
    if (mapping.table === "memory_artifacts") {
      if (situationId) row.situation_id = situationId;
    } else if (
      mapping.table === "context_relevance_specs" ||
      mapping.table === "context_evaluations" ||
      mapping.table === "observations"
    ) {
      if (situationId) row.related_situation_id = situationId;
    }
  }
  if (fm.person_slug && typeof fm.person_slug === "string") {
    row.person_id = slugs.persons.get(fm.person_slug) ?? null;
    row.person_slug = fm.person_slug;
  }

  const fkMap = FK_FIELDS[mapping.table];
  if (fkMap) {
    for (const [fmKey, _targetTable] of Object.entries(fkMap)) {
      const col =
        fmKey.endsWith("_id") ? fmKey : `${fmKey.replace(/_reference$/, "").replace(/_package$/, "_package")}_id`;
      const actualCol = resolveFkColumn(mapping.table, fmKey);
      const ref = fm[fmKey];
      if (typeof ref === "string" && ref) {
        const resolved = resolveIdSync(ref, registry, slugs);
        if (resolved) row[actualCol] = resolved;
      }
    }
  }

  if (fm.related_interpretation && mapping.table === "inference_components") {
    const id = resolveIdSync(String(fm.related_interpretation), registry, slugs);
    if (id) row.interpretation_package_id = id;
  }
  if (fm.related_recommendation_package && mapping.table === "recommendation_components") {
    const id = resolveIdSync(String(fm.related_recommendation_package), registry, slugs);
    if (id) row.recommendation_package_id = id;
  }
  if (fm.related_validation_package && mapping.table === "outcome_components") {
    const id = resolveIdSync(String(fm.related_validation_package), registry, slugs);
    if (id) row.validation_package_id = id;
  }
  if (fm.related_validation_package && mapping.table === "learning_updates") {
    const id = resolveIdSync(String(fm.related_validation_package), registry, slugs);
    if (id) row.validation_package_id = id;
  }
  if (fm.outcome_capture && mapping.table === "learning_updates") {
    const id = resolveIdSync(String(fm.outcome_capture), registry, slugs);
    if (id) row.outcome_capture_id = id;
  }
  if (fm.outcome_capture && mapping.table === "validation_packages") {
    const id = resolveIdSync(String(fm.outcome_capture), registry, slugs);
    if (id) row.outcome_capture_id = id;
  }
  if (fm.learning_promoted && mapping.table === "validation_packages") {
    const id = resolveIdSync(String(fm.learning_promoted), registry, slugs);
    if (id) row.learning_promoted_id = id;
  }

  return row;
}

function resolveFkColumn(table: string, fmKey: string): string {
  const map: Record<string, Record<string, string>> = {
    context_relevance_specs: { related_situation: "related_situation_id", retrieval_request: "retrieval_request_id" },
    retrieval_requests: {
      context_reference: "context_reference_id",
      evidence_package: "evidence_package_id",
      context_package: "assembled_context_package_id",
    },
    evidence_packages: { retrieval_request: "retrieval_request_id", context_reference: "context_reference_id" },
    assembled_context_packages: {
      retrieval_request: "retrieval_request_id",
      evidence_package: "evidence_package_id",
      context_reference: "context_reference_id",
    },
    interpretation_packages: {
      context_package: "assembled_context_package_id",
      retrieval_request: "retrieval_request_id",
      context_reference: "context_reference_id",
    },
    recommendation_packages: {
      interpretation_package: "interpretation_package_id",
      context_package: "assembled_context_package_id",
      retrieval_request: "retrieval_request_id",
      context_reference: "context_reference_id",
    },
    outcome_captures: {
      recommendation_package: "recommendation_package_id",
      interpretation_package: "interpretation_package_id",
      context_package: "assembled_context_package_id",
      related_validation_package: "related_validation_package_id",
    },
    validation_packages: {
      recommendation_package: "recommendation_package_id",
      interpretation_package: "interpretation_package_id",
      context_package: "assembled_context_package_id",
      retrieval_request: "retrieval_request_id",
      context_reference: "context_reference_id",
      outcome_capture: "outcome_capture_id",
      learning_promoted: "learning_promoted_id",
    },
    learning_updates: {
      related_validation_package: "validation_package_id",
      outcome_capture: "outcome_capture_id",
    },
    observations: {
      related_person: "related_person_id",
      related_relationship: "related_relationship_id",
      related_situation: "related_situation_id",
    },
    memory_artifacts: {
      related_situation: "situation_id",
    },
  };
  return map[table]?.[fmKey] ?? `${fmKey}_id`;
}

function resolveIdSync(
  ref: string,
  registry: Map<string, RegistryEntry>,
  slugs: SlugMaps
): string | null {
  const normalized = normalizePath(ref);
  if (registry.has(normalized)) return registry.get(normalized)!.record_id;
  if (registry.has(ref)) return registry.get(ref)!.record_id;

  for (const [key, entry] of registry) {
    if (key.endsWith(normalized.split("/").pop() ?? "")) return entry.record_id;
  }

  if (slugs.persons.has(ref)) return slugs.persons.get(ref)!;
  if (slugs.situations.has(ref)) return slugs.situations.get(ref)!;
  if (slugs.relationships.has(ref)) return slugs.relationships.get(ref)!;

  return null;
}

export async function upsertArtifact(
  artifact: ParsedArtifact,
  registry: Map<string, RegistryEntry>,
  slugs: SlugMaps,
  pendingLinks: LinkSpec[]
): Promise<{ recordId: string; skipped: boolean; table: string }> {
  const supabase = getSupabase();
  const mapping = detectTableMapping(artifact);
  const table = mapping.table;

  const { data: existing } = await supabase
    .from(table)
    .select("id, status, transformation_log")
    .eq("external_id", artifact.externalId)
    .maybeSingle();

  const incomingStatus = String(artifact.frontmatter.status ?? "draft");
  const decision = decideIntegrityAction(
    existing?.status as string | undefined,
    incomingStatus,
    !!existing
  );

  if (decision.action === "skip") {
    return { recordId: existing!.id, skipped: true, table };
  }

  if (decision.action === "supersede") {
    console.warn(`[integrity] Supersession required for ${artifact.externalId}: ${decision.reason}`);
    return { recordId: existing!.id, skipped: true, table };
  }

  const row = mapRow(artifact, mapping, registry, slugs);

  if (decision.action === "update" && existing) {
    row.transformation_log = appendTransformationLog(
      existing.transformation_log,
      decision.appendLog
    );
  }

  if (!existing) {
    row.transformation_log = appendTransformationLog(row.transformation_log, {
      action: "ingested_from_repository",
      rationale: "Build 09 initial sync",
      actor: "ingestion-script",
      source_path: artifact.repositoryPath,
    });
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: "external_id" })
    .select("id")
    .single();

  if (error) throw new Error(`Upsert failed for ${artifact.externalId}: ${error.message}`);

  const recordId = data.id as string;

  registry.set(artifact.externalId, {
    external_id: artifact.externalId,
    table_name: table,
    record_id: recordId,
    repository_path: artifact.repositoryPath,
    architecture_layer: mapping.architectureLayer,
    title: String(row.title ?? artifact.externalId),
    status: incomingStatus,
  });
  registry.set(normalizePath(artifact.repositoryPath), registry.get(artifact.externalId)!);

  const links = extractLinkSpecs(table, recordId, artifact.frontmatter);
  pendingLinks.push(
    ...links.map((l) => ({
      sourceTable: table,
      sourceId: recordId,
      targetRef: l.targetRef,
      linkType: l.linkType,
      tier: l.tier,
    }))
  );

  return { recordId, skipped: false, table };
}

export async function registerArtifact(
  artifact: ParsedArtifact,
  table: string,
  recordId: string,
  mapping: ReturnType<typeof detectTableMapping>
): Promise<void> {
  const supabase = getSupabase();
  const fm = artifact.frontmatter;
  await supabase.from("artifact_registry").upsert(
    {
      external_id: artifact.externalId,
      title: String(fm.title ?? fm.display_name ?? artifact.externalId),
      architecture_layer: mapping.architectureLayer,
      table_name: table,
      record_id: recordId,
      repository_path: artifact.repositoryPath,
      status: String(fm.status ?? "draft"),
    },
    { onConflict: "external_id" }
  );
}

export async function upsertRelationshipParticipants(
  artifact: ParsedArtifact,
  relationshipId: string,
  slugs: SlugMaps
): Promise<void> {
  const participants = artifact.frontmatter.participants;
  if (!Array.isArray(participants)) return;

  const supabase = getSupabase();
  for (const slug of participants) {
    const personId = slugs.persons.get(String(slug));
    if (!personId) continue;
    await supabase.from("relationship_participants").upsert(
      { relationship_id: relationshipId, person_id: personId },
      { onConflict: "relationship_id,person_id", ignoreDuplicates: true }
    );
  }
}

export async function uploadKnowledgeBinary(
  artifact: ParsedArtifact,
  recordId: string,
  repoRoot: string
): Promise<void> {
  const sourceFile = String(artifact.frontmatter.source_file ?? "");
  if (!sourceFile) return;

  const { readFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const absPath = join(repoRoot, sourceFile.replace(/\//g, "\\"));
  const altPath = join(repoRoot, ...sourceFile.split("/"));

  const filePath = existsSync(absPath) ? absPath : existsSync(altPath) ? altPath : null;
  if (!filePath) {
    console.warn(`[storage] Source file not found: ${sourceFile}`);
    return;
  }

  const supabase = getSupabase();
  const filename = sourceFile.split("/").pop()!;
  const sourceType = String(artifact.frontmatter.type ?? "transcript");
  const storagePath = `${sourceType}/${artifact.externalId}/${filename}`;

  const content = readFileSync(filePath);
  const { error: uploadError } = await supabase.storage
    .from("knowledge-source-material")
    .upload(storagePath, content, { upsert: true, contentType: "text/vtt" });

  if (uploadError) {
    console.warn(`[storage] Upload failed: ${uploadError.message}`);
    return;
  }

  await supabase
    .from("knowledge_sources")
    .update({ storage_object_path: storagePath })
    .eq("id", recordId);
}

export { isTerminalStatus };
