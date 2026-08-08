import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { getSupabase } from "../shared/supabase.js";
import { contentHash } from "./content-hash.js";
import { chunkExtractedText } from "./chunk.js";
import { extractText, extractorVersion } from "./extract.js";
import { classifySourceType, guessMimeType, isStorable } from "./mime.js";
import { buildReceipt } from "./receipt.js";
import { buildStorageObjectPath, storeOriginalFile } from "./storage.js";
import type {
  AuthorityClassification,
  IngestionReceipt,
  SourceInput,
} from "./types.js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function transformationEntry(action: string, rationale: string, extra?: Record<string, unknown>) {
  return {
    date: new Date().toISOString().slice(0, 10),
    action,
    rationale,
    actor: "build-18-ingestion",
    ...extra,
  };
}

export async function findDuplicateByHash(
  hash: string
): Promise<{ id: string; external_id: string; title: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("knowledge_sources")
    .select("id, external_id, title")
    .eq("content_hash", hash)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * One governed ingestion path for bulk, single-file, and ChatGPT sources.
 * Confirms durable knowledge only when storage + source record persist.
 */
export async function ingestSource(input: SourceInput): Promise<IngestionReceipt> {
  const filename = basename(input.filename);
  const mimeType = guessMimeType(filename, input.mimeType);
  const sourceType = input.sourceType ?? classifySourceType(filename, mimeType);
  const title = input.title ?? filename;
  const authority: AuthorityClassification = input.authorityClassification ?? "unverified";
  const hash = contentHash(input.bytes);
  const externalId = `SRC-${slugify(filename) || "source"}-${hash.slice(0, 10)}`;

  const duplicate = await findDuplicateByHash(hash);
  if (duplicate) {
    return buildReceipt({
      ingested: false,
      claim: "duplicate",
      title: duplicate.title || title,
      sourceType,
      originalStored: true,
      originalAvailable: true,
      textExtracted: false,
      retrievalReady: false,
      authorityClassification: authority,
      extractionStatus: "skipped",
      processingStatus: "duplicate_skipped",
      integrityStatus: "ok",
      limitation:
        "Duplicate content hash matched an existing source. Originals were not deleted or overwritten.",
      sourceExternalId: duplicate.external_id,
      duplicateOfExternalId: duplicate.external_id,
      retrievalUnitCount: 0,
    });
  }

  if (!isStorable(mimeType) && input.bytes.length > 0 && !input.providedText) {
    return buildReceipt({
      ingested: false,
      claim: "not_ingested",
      title,
      sourceType,
      originalStored: false,
      originalAvailable: false,
      textExtracted: false,
      retrievalReady: false,
      authorityClassification: authority,
      extractionStatus: "unsupported",
      processingStatus: "failed",
      integrityStatus: "error",
      limitation: `MIME type ${mimeType} is not accepted for durable storage in Build 18.`,
      retrievalUnitCount: 0,
    });
  }

  const extraction = extractText({
    filename,
    bytes: input.bytes,
    mimeType,
    providedText: input.providedText,
  });

  const objectPath =
    input.bytes.length > 0 && isStorable(mimeType)
      ? buildStorageObjectPath({ sourceType, externalId, filename })
      : null;

  let originalStored = false;
  let storageError: string | undefined;
  if (objectPath) {
    const stored = await storeOriginalFile({
      objectPath,
      bytes: input.bytes,
      mimeType,
    });
    originalStored = stored.stored;
    storageError = stored.error;
  } else if (input.providedText && input.bytes.length === 0) {
    // Text-only path: no binary original — do not claim original stored.
    originalStored = false;
  }

  if (objectPath && !originalStored) {
    return buildReceipt({
      ingested: false,
      claim: "not_ingested",
      title,
      sourceType,
      originalStored: false,
      originalAvailable: false,
      textExtracted: false,
      retrievalReady: false,
      authorityClassification: authority,
      extractionStatus: "pending",
      processingStatus: "failed",
      integrityStatus: "error",
      limitation: storageError ?? "Failed to store original file in Supabase Storage.",
      retrievalUnitCount: 0,
    });
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const units =
    extraction.status === "extracted" && extraction.text
      ? chunkExtractedText(extraction.text)
      : [];
  const retrievalReady = units.length > 0;
  const processingStatus =
    retrievalReady || extraction.status === "deferred" ? "processed" : "stored";
  const integrityStatus =
    extraction.status === "failed"
      ? "partial"
      : storageError
        ? "error"
        : "ok";

  const sourceRow = {
    external_id: externalId,
    title,
    author: input.sourceOwner ?? null,
    source: input.sourceLocation ?? filename,
    source_type: sourceType,
    source_file_path: input.sourceLocation ?? null,
    storage_object_path: objectPath,
    summary: null,
    tags: input.tags ?? [],
    date_acquired: now.slice(0, 10),
    status: "active",
    body_md: null,
    original_filename: filename,
    mime_type: mimeType,
    byte_size: input.bytes.length,
    content_hash: hash,
    ingestion_method: input.ingestionMethod,
    ingested_at: now,
    source_owner: input.sourceOwner ?? null,
    source_location: input.sourceLocation ?? null,
    authority_classification: authority,
    scope_classification: input.scopeClassification ?? null,
    extraction_status: extraction.status,
    processing_status: processingStatus,
    integrity_status: integrityStatus,
    integrity_detail: extraction.limitation ?? storageError ?? null,
    original_available: originalStored,
    retrieval_ready: retrievalReady,
    replaces_source_id: input.replacesSourceId ?? null,
    transformation_log: [
      transformationEntry("source_registered", "Build 18 governed ingestion", {
        ingestion_method: input.ingestionMethod,
        host_file_id: input.hostFileId,
      }),
      ...(originalStored
        ? [transformationEntry("original_stored", "Original bytes persisted to private storage")]
        : []),
      transformationEntry("extraction_attempted", `Extraction status: ${extraction.status}`, {
        extraction_method: extraction.method,
        limitation: extraction.limitation,
      }),
    ],
  };

  const { data: inserted, error: insertError } = await supabase
    .from("knowledge_sources")
    .insert(sourceRow)
    .select("id, external_id")
    .single();

  if (insertError || !inserted) {
    return buildReceipt({
      ingested: false,
      claim: "not_ingested",
      title,
      sourceType,
      originalStored,
      originalAvailable: originalStored,
      textExtracted: false,
      retrievalReady: false,
      authorityClassification: authority,
      extractionStatus: extraction.status,
      processingStatus: "failed",
      integrityStatus: "error",
      limitation: insertError?.message ?? "Failed to persist knowledge source record.",
      retrievalUnitCount: 0,
    });
  }

  // Register in artifact_registry (best-effort; does not block receipt)
  await supabase.from("artifact_registry").upsert(
    {
      external_id: externalId,
      title,
      architecture_layer: "knowledge",
      table_name: "knowledge_sources",
      record_id: inserted.id,
      repository_path: input.sourceLocation ?? null,
      status: "active",
    },
    { onConflict: "external_id" }
  );

  let extractionId: string | null = null;
  if (extraction.status === "extracted" && extraction.text) {
    const extractionExternalId = `EXT-${externalId}`;
    const { data: extRow, error: extErr } = await supabase
      .from("knowledge_source_extractions")
      .insert({
        external_id: extractionExternalId,
        knowledge_source_id: inserted.id,
        extraction_method: extraction.method,
        extractor_version: extractorVersion(),
        status: "extracted",
        mime_type: extraction.mimeType ?? "text/plain",
        character_count: extraction.text.length,
        extracted_text: extraction.text,
        limitation: extraction.limitation ?? null,
        transformation_log: [
          transformationEntry(
            "text_extracted",
            "Derived extraction — not the original source",
            { method: extraction.method }
          ),
        ],
      })
      .select("id")
      .single();
    if (!extErr && extRow) {
      extractionId = extRow.id;
      await supabase.from("artifact_links").insert({
        source_table: "knowledge_source_extractions",
        source_id: extRow.id,
        target_table: "knowledge_sources",
        target_id: inserted.id,
        link_type: "derived_from",
      });
    }
  }

  if (units.length > 0 && extractionId) {
    const unitRows = units.map((u) => ({
      external_id: `RU-${externalId}-${u.unitIndex}`,
      knowledge_source_id: inserted.id,
      extraction_id: extractionId,
      unit_index: u.unitIndex,
      content: u.content,
      content_preview: u.contentPreview,
      character_count: u.content.length,
      status: "active",
      epistemic_type: "source_evidence",
      transformation_log: [
        transformationEntry(
          "retrieval_unit_created",
          "Chunk derived from extraction; provenance links to original source",
          { unit_index: u.unitIndex }
        ),
      ],
    }));
    const { data: insertedUnits } = await supabase
      .from("knowledge_retrieval_units")
      .insert(unitRows)
      .select("id");

    if (insertedUnits) {
      await supabase.from("artifact_links").insert(
        insertedUnits.map((u) => ({
          source_table: "knowledge_retrieval_units",
          source_id: u.id,
          target_table: "knowledge_sources",
          target_id: inserted.id,
          link_type: "derived_from",
        }))
      );
    }
  }

  if (input.replacesSourceId) {
    // Prior source is superseded by the new source — prior remains inspectable.
    await supabase.from("artifact_links").insert({
      source_table: "knowledge_sources",
      source_id: input.replacesSourceId,
      target_table: "knowledge_sources",
      target_id: inserted.id,
      link_type: "superseded_by",
    });
    await supabase
      .from("knowledge_sources")
      .update({
        status: "superseded",
        updated_at: now,
      })
      .eq("id", input.replacesSourceId);
  }

  const textExtracted = extraction.status === "extracted";
  const claim =
    originalStored || textExtracted
      ? extraction.status === "failed"
        ? "partial"
        : "ingested"
      : "not_ingested";

  return buildReceipt({
    ingested: claim === "ingested" || claim === "partial",
    claim,
    title,
    sourceType,
    originalStored,
    originalAvailable: originalStored,
    textExtracted,
    retrievalReady,
    authorityClassification: authority,
    extractionStatus: extraction.status,
    processingStatus,
    integrityStatus,
    limitation: extraction.limitation,
    sourceExternalId: inserted.external_id,
    retrievalUnitCount: units.length,
  });
}

/** Deterministic external id helper for tests. */
export function previewExternalId(filename: string, bytes: Buffer): string {
  const hash = contentHash(bytes);
  return `SRC-${slugify(basename(filename)) || "source"}-${hash.slice(0, 10)}`;
}

export function newRunExternalId(prefix = "ING"): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
}
