import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { getSupabase } from "../shared/supabase.js";
import { contentHash } from "./content-hash.js";
import { chunkExtractedText } from "./chunk.js";
import { extractText, extractorVersion } from "./extract.js";
import { maybeInjectFault } from "./fault-inject.js";
import {
  classifySourceType,
  defaultHandlingPath,
  guessMimeType,
  isStorable,
} from "./mime.js";
import { resolveProviderMode } from "./provider-mode.js";
import { buildReceipt } from "./receipt.js";
import {
  applySourceCardToReceipt,
  generateAndPersistSourceCard,
} from "./source-cards/generate.js";
import { buildStorageObjectPath, storeOriginalFile } from "./storage.js";
import type {
  AttachmentCoverageSummary,
  AuthorityClassification,
  DerivedExtractionDraft,
  HandlingPath,
  IngestionReceipt,
  SourceInput,
} from "./types.js";

type SourceRowLite = {
  id: string;
  external_id: string;
  title: string;
  processing_status?: string | null;
  extraction_status?: string | null;
  retrieval_ready?: boolean | null;
  storage_object_path?: string | null;
  original_available?: boolean | null;
};

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
    actor: "build-19-ingestion",
    ...extra,
  };
}

export async function findDuplicateByHash(
  hash: string
): Promise<{ id: string; external_id: string; title: string } | null> {
  const row = await findSourceRowByHash(hash);
  if (!row) return null;
  return { id: row.id, external_id: row.external_id, title: row.title };
}

export async function findSourceRowByHash(hash: string): Promise<SourceRowLite | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("knowledge_sources")
    .select(
      "id, external_id, title, processing_status, extraction_status, retrieval_ready, storage_object_path, original_available"
    )
    .eq("content_hash", hash)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SourceRowLite | null) ?? null;
}

/** Incomplete work is retryable — exact hash match alone is not terminal duplicate. */
export function isIncompleteSourceRow(row: SourceRowLite): boolean {
  if (row.processing_status === "stored" || row.processing_status === "registered") {
    return true;
  }
  if (row.extraction_status === "pending") return true;
  return false;
}

/**
 * One governed ingestion path for bulk, single-file, and ChatGPT sources.
 * Durable confirmation requires private original storage AND source record.
 * Version lineage is never inferred from filename/path — only explicit ids.
 */
export async function ingestSource(input: SourceInput): Promise<IngestionReceipt> {
  const filename = basename(input.filename);
  const mimeType = guessMimeType(filename, input.mimeType);
  const sourceType = input.sourceType ?? classifySourceType(filename, mimeType);
  const title = input.title ?? filename;
  const authority: AuthorityClassification = input.authorityClassification ?? "unverified";
  const hash = contentHash(input.bytes);
  const externalId = `SRC-${slugify(filename) || "source"}-${hash.slice(0, 10)}`;
  const handlingPath: HandlingPath = input.parentEmailSourceId
    ? "email_attachment_child"
    : (input.handlingPath ?? defaultHandlingPath(filename));

  const existingByHash = await findSourceRowByHash(hash);
  if (existingByHash && !isIncompleteSourceRow(existingByHash)) {
    return buildReceipt({
      ingested: false,
      claim: "duplicate",
      title: existingByHash.title || title,
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
        "Duplicate content hash matched an existing source. Originals were not deleted or overwritten. Filename/path match is irrelevant.",
      sourceExternalId: existingByHash.external_id,
      duplicateOfExternalId: existingByHash.external_id,
      retrievalUnitCount: 0,
      originalStorageStatus: "stored",
      durableSourceRecordStatus: "persisted",
      handlingPath,
      documentIdentity: input.documentIdentity,
      parentEmailExternalIds: input.parentEmailExternalId
        ? [input.parentEmailExternalId]
        : undefined,
      providerMode: resolveProviderMode(),
    });
  }
  const resumeRow = existingByHash && isIncompleteSourceRow(existingByHash) ? existingByHash : null;

  // Preserve-only path: unknown MIME becomes octet-stream for private storage when bytes exist.
  const storageMime = isStorable(mimeType) ? mimeType : "application/octet-stream";
  const canPreserve =
    input.bytes.length > 0 && (isStorable(mimeType) || storageMime === "application/octet-stream");

  if (!canPreserve && input.bytes.length > 0 && !input.providedText) {
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
      limitation: `MIME type ${mimeType} could not be preserved safely.`,
      retrievalUnitCount: 0,
      originalStorageStatus: "failed",
      durableSourceRecordStatus: "not_created",
      handlingPath,
      documentIdentity: input.documentIdentity,
    });
  }

  // Preserve-first: store original before depending on extraction success.
  const objectPath =
    input.bytes.length > 0 && canPreserve
      ? buildStorageObjectPath({ sourceType, externalId, filename })
      : null;

  let originalStored = false;
  let storageError: string | undefined;
  if (objectPath) {
    const stored = await storeOriginalFile({
      objectPath,
      bytes: input.bytes,
      mimeType: storageMime,
    });
    originalStored = stored.stored;
    storageError = stored.error;
  } else if (input.providedText && input.bytes.length === 0) {
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
      originalStorageStatus: "failed",
      durableSourceRecordStatus: "not_created",
      handlingPath,
      documentIdentity: input.documentIdentity,
    });
  }

  // Fault point 1: original stored, durable source row not yet persisted
  maybeInjectFault("after_original_storage");

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const providerMode = resolveProviderMode();

  let inserted: { id: string; external_id: string };
  if (resumeRow) {
    inserted = { id: resumeRow.id, external_id: resumeRow.external_id };
    if (originalStored) {
      await supabase
        .from("knowledge_sources")
        .update({
          original_available: true,
          storage_object_path: objectPath ?? resumeRow.storage_object_path,
          updated_at: now,
        })
        .eq("id", resumeRow.id);
    }
  } else {
    const pendingRow = {
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
      mime_type: storageMime,
      byte_size: input.bytes.length,
      content_hash: hash,
      ingestion_method: input.ingestionMethod,
      ingested_at: now,
      source_owner: input.sourceOwner ?? null,
      source_location: input.sourceLocation ?? null,
      authority_classification: authority,
      scope_classification: input.scopeClassification ?? null,
      extraction_status: "pending",
      processing_status: "stored",
      integrity_status: "partial",
      integrity_detail: "Original preserved; extraction not yet completed.",
      original_available: originalStored,
      retrieval_ready: false,
      replaces_source_id: input.replacesSourceId ?? null,
      document_identity: input.documentIdentity ?? null,
      handling_path: handlingPath,
      material_limitations: null,
      transformation_log: [
        transformationEntry("source_registered", "Build 19 governed ingestion — pending extraction", {
          ingestion_method: input.ingestionMethod,
          host_file_id: input.hostFileId,
          handling_path: handlingPath,
          document_identity: input.documentIdentity ?? null,
          attachment_meta: input.attachmentMeta ?? null,
          attachment_lineage:
            "Canonical parent↔child email attachment lineage is knowledge_source_attachment_links only.",
          provider_mode: providerMode,
        }),
        ...(originalStored
          ? [transformationEntry("original_stored", "Original bytes persisted to private storage")]
          : []),
      ],
    };

    const { data: insertedNew, error: insertError } = await supabase
      .from("knowledge_sources")
      .insert(pendingRow)
      .select("id, external_id")
      .single();

    if (insertError || !insertedNew) {
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
        extractionStatus: "pending",
        processingStatus: "failed",
        integrityStatus: "error",
        limitation: insertError?.message ?? "Failed to persist knowledge source record.",
        retrievalUnitCount: 0,
        originalStorageStatus: originalStored ? "stored" : "failed",
        durableSourceRecordStatus: "failed",
        handlingPath,
        documentIdentity: input.documentIdentity,
        providerMode,
      });
    }
    inserted = insertedNew as { id: string; external_id: string };
  }

  // Fault point 2: durable source row exists; extraction not completed
  maybeInjectFault("after_source_row_before_extraction_complete");

  const extraction = await extractText({
    filename,
    bytes: input.bytes,
    mimeType,
    providedText: input.providedText,
  });

  const derivativeDrafts: DerivedExtractionDraft[] =
    extraction.derivatives && extraction.derivatives.length > 0
      ? extraction.derivatives
      : extraction.status === "extracted" && (extraction.text || extraction.units?.length)
        ? [
            {
              representationKind: extraction.representationKind ?? "native_text",
              method: extraction.method,
              processVersion: extraction.processVersion ?? extractorVersion(),
              providerName: extraction.providerName,
              providerModel: extraction.providerModel,
              text: extraction.text ?? "",
              units:
                extraction.units && extraction.units.length > 0
                  ? extraction.units
                  : extraction.text
                    ? chunkExtractedText(extraction.text)
                    : [],
              createRetrievalUnits: true,
              attemptVersion: 1,
              limitation: extraction.limitation,
              coverage: extraction.coverage,
            },
          ]
        : [];

  const units = derivativeDrafts.flatMap((d) =>
    d.createRetrievalUnits
      ? d.units.map((u) => ({
          ...u,
          _method: d.method,
          _limitation: d.limitation ?? extraction.limitation,
          _processVersion: d.processVersion,
          _representationKind: d.representationKind,
        }))
      : []
  );
  const retrievalReady = units.length > 0;
  const pageCoverageComplete =
    extraction.pageCoverageComplete === true ||
    (Boolean(extraction.pageCoverage?.length) &&
      extraction.pageCoverage!.every((p) =>
        ["native", "vision_derived", "both_separate"].includes(p.status)
      ));
  const incompleteCoverage =
    !pageCoverageComplete &&
    (Boolean(
      extraction.pageCoverage?.some((p) =>
        ["blocked", "unavailable", "partial"].includes(p.status)
      )
    ) ||
      /vision extraction blocked|vision provider (?:failure|error|timed out|unavailable)|timed out|not fully extracted|partial or blocked/i.test(
        extraction.limitation ?? ""
      ));

  const processingStatus =
    retrievalReady ||
    extraction.status === "deferred" ||
    extraction.status === "preserve_only" ||
    extraction.status === "blocked_encrypted" ||
    extraction.status === "blocked_corrupt" ||
    (originalStored && extraction.visionInvoked && !retrievalReady)
      ? "processed"
      : "stored";
  const integrityStatus =
    extraction.status === "failed" ||
    extraction.status === "blocked_corrupt" ||
    extraction.status === "blocked_encrypted" ||
    incompleteCoverage
      ? extraction.status === "blocked_encrypted" || incompleteCoverage
        ? "partial"
        : "error"
      : storageError
        ? "error"
        : "ok";

  const effectiveHandling: HandlingPath =
    handlingPath === "email_message" || handlingPath === "email_attachment_child"
      ? handlingPath
      : handlingPath === "vision_assisted"
        ? "vision_assisted"
        : extraction.visionInvoked && sourceType === "pdf"
          ? "extractable_native"
          : handlingPath;

  const materialLimitations = [
    extraction.limitation,
    pageCoverageComplete && retrievalReady && extraction.visionInvoked
      ? "ingested—original preserved; page coverage confirmed; vision-derived units retrieval-ready where confirmed."
      : null,
    incompleteCoverage && !pageCoverageComplete
      ? "ingested—original preserved; vision extraction partial or blocked; retrieval availability limited to confirmed units."
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  await supabase
    .from("knowledge_sources")
    .update({
      extraction_status: extraction.status,
      processing_status: processingStatus === "processed" ? "stored" : processingStatus,
      integrity_status: integrityStatus,
      integrity_detail: materialLimitations || storageError || null,
      retrieval_ready: false,
      handling_path: effectiveHandling,
      material_limitations: materialLimitations || null,
      transformation_log: [
        transformationEntry("source_registered", "Build 19 governed ingestion", {
          ingestion_method: input.ingestionMethod,
          host_file_id: input.hostFileId,
          handling_path: effectiveHandling,
          document_identity: input.documentIdentity ?? null,
          attachment_meta: input.attachmentMeta ?? null,
          attachment_lineage:
            "Canonical parent↔child email attachment lineage is knowledge_source_attachment_links only.",
          provider_mode: providerMode,
        }),
        ...(originalStored
          ? [transformationEntry("original_stored", "Original bytes persisted to private storage")]
          : []),
        transformationEntry("extraction_attempted", `Extraction status: ${extraction.status}`, {
          extraction_method: extraction.method,
          representation_kind: extraction.representationKind,
          vision_invoked: extraction.visionInvoked ?? false,
          provider_name: extraction.providerName,
          provider_model: extraction.providerModel,
          page_coverage: extraction.pageCoverage ?? extraction.coverage?.pageCoverage,
          limitation: extraction.limitation,
          derivative_count: derivativeDrafts.length,
        }),
      ],
      updated_at: now,
    })
    .eq("id", inserted.id);

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

  // Persist each derivative separately — re-extraction must add attempt versions, never overwrite.
  const persistedDerivatives: Array<{
    id: string;
    draft: DerivedExtractionDraft;
    kind: string;
  }> = [];

  for (const draft of derivativeDrafts) {
    if (!draft.text && draft.units.length === 0) continue;
    const kindSlug = draft.representationKind.replace(/[^a-z0-9]+/gi, "-");
    const extractionExternalId = `EXT-${inserted.external_id}-${kindSlug}-v${draft.attemptVersion}`;
    const { data: existingExt } = await supabase
      .from("knowledge_source_extractions")
      .select("id")
      .eq("external_id", extractionExternalId)
      .maybeSingle();
    if (existingExt) {
      persistedDerivatives.push({
        id: existingExt.id as string,
        draft,
        kind: draft.representationKind,
      });
      continue;
    }
    const extractedText =
      draft.text ||
      draft.units.map((u) => `[${u.locator?.label ?? "unit"}]\n${u.content}`).join("\n\n");
    const { data: extRow, error: extErr } = await supabase
      .from("knowledge_source_extractions")
      .insert({
        external_id: extractionExternalId,
        knowledge_source_id: inserted.id,
        extraction_method: draft.method,
        extractor_version: extractorVersion(),
        status: "extracted",
        mime_type: extraction.mimeType ?? "text/plain",
        character_count: extractedText.length,
        extracted_text: extractedText,
        limitation: draft.limitation ?? extraction.limitation ?? null,
        representation_kind: draft.representationKind,
        epistemic_type: "source_evidence",
        content_hash_of_original: hash,
        attempt_version: draft.attemptVersion,
        process_version: draft.processVersion,
        prompt_version: draft.promptVersion ?? null,
        provider_name: draft.providerName ?? null,
        provider_model: draft.providerModel ?? null,
        response_id: draft.responseId ?? null,
        coverage: draft.coverage ?? extraction.coverage ?? null,
        transformation_log: [
          transformationEntry(
            "derived_representation_persisted",
            "Derived extraction — not the original source; not a finding/decision/learning; re-extraction creates a new attempt version",
            {
              method: draft.method,
              representation_kind: draft.representationKind,
              process_version: draft.processVersion,
              prompt_version: draft.promptVersion,
              provider_name: draft.providerName,
              provider_model: draft.providerModel,
              attempt_version: draft.attemptVersion,
              response_id: draft.responseId,
              coverage: draft.coverage ?? extraction.coverage,
              create_retrieval_units: draft.createRetrievalUnits,
              provider_mode: providerMode,
            }
          ),
        ],
      })
      .select("id")
      .single();
    if (!extErr && extRow) {
      persistedDerivatives.push({ id: extRow.id, draft, kind: draft.representationKind });
      await supabase.from("artifact_links").insert({
        source_table: "knowledge_source_extractions",
        source_id: extRow.id,
        target_table: "knowledge_sources",
        target_id: inserted.id,
        link_type: "derived_from",
      });
    }
  }

  let unitIndex = 0;
  const unitRows: Array<Record<string, unknown>> = [];
  for (const { id: extractionId, draft } of persistedDerivatives) {
    if (!draft.createRetrievalUnits) continue;
    for (const u of draft.units) {
      const visionLabel =
        draft.representationKind === "vision_transcription"
          ? "vision-derived transcription"
          : draft.representationKind === "vision_visual_description"
            ? "vision-derived visual description"
            : "native/derived extraction";
      unitRows.push({
        external_id: `RU-${externalId}-${unitIndex}`,
        knowledge_source_id: inserted.id,
        extraction_id: extractionId,
        unit_index: unitIndex,
        content:
          draft.representationKind === "vision_transcription" &&
          !u.content.startsWith("[vision-derived")
            ? `[vision-derived transcription]\n${u.content}`
            : u.content,
        content_preview: u.contentPreview,
        character_count: u.content.length,
        status: "active",
        epistemic_type: "source_evidence",
        extraction_method: draft.method,
        locator: u.locator ?? null,
        material_limitation: draft.limitation ?? extraction.limitation ?? null,
        transformation_log: [
          transformationEntry(
            "retrieval_unit_created",
            `Unit is ${visionLabel}; provenance links to original source locator — not a finding or authority assignment`,
            {
              unit_index: unitIndex,
              locator: u.locator,
              process_version: draft.processVersion,
              prompt_version: draft.promptVersion,
              provider_name: draft.providerName,
              provider_model: draft.providerModel,
              representation_kind: draft.representationKind,
              source_card_informed: false,
            }
          ),
        ],
      });
      unitIndex += 1;
    }
  }

  maybeInjectFault("before_retrieval_units");

  if (unitRows.length > 0) {
    const { data: existingUnits } = await supabase
      .from("knowledge_retrieval_units")
      .select("id")
      .eq("knowledge_source_id", inserted.id)
      .limit(1);
    if (!existingUnits?.length) {
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
  }

  // Remain retryable (stored) until attachment links + source-card attempt finish.
  await supabase
    .from("knowledge_sources")
    .update({
      processing_status: "stored",
      retrieval_ready: retrievalReady,
      updated_at: now,
    })
    .eq("id", inserted.id);

  // Explicit operator-confirmed replacement only — never filename/path inference
  if (input.replacesSourceId) {
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

  const textExtracted =
    extraction.status === "extracted" ||
    persistedDerivatives.some((d) => d.draft.units.length > 0 || Boolean(d.draft.text));
  // Preserve-first: original + source record => ingested even when extraction blocked/failed.
  const claim: IngestionReceipt["claim"] = !originalStored
    ? textExtracted
      ? "partial"
      : "not_ingested"
    : "ingested";

  let attachmentCoverage: AttachmentCoverageSummary | undefined;
  let combinedLimitations = materialLimitations || extraction.limitation || "";

  if (
    !input.skipAttachmentExpansion &&
    !input.parentEmailSourceId &&
    extraction.attachments &&
    extraction.attachments.length > 0
  ) {
    attachmentCoverage = await expandEmailAttachments({
      parentSourceId: inserted.id,
      parentExternalId: inserted.external_id,
      attachments: extraction.attachments,
      ingestionMethod: input.ingestionMethod,
      authority,
    });
    combinedLimitations = [combinedLimitations, attachmentCoverage.summary]
      .filter(Boolean)
      .join(" ");
    await supabase
      .from("knowledge_sources")
      .update({
        material_limitations: combinedLimitations,
        updated_at: now,
      })
      .eq("id", inserted.id);
  }

  const emailReadyLanguage =
    effectiveHandling === "email_message" && retrievalReady
      ? "ingested—original preserved; deterministic email extraction confirmed; retrieval-ready for confirmed email units."
      : null;

  const baseReceipt = buildReceipt({
    ingested: claim === "ingested" || claim === "partial",
    claim,
    title,
    sourceType,
    originalStored,
    originalAvailable: originalStored,
    textExtracted,
    retrievalReady,
    authorityClassification: authority,
    extractionStatus: extraction.status === "failed" && originalStored ? "failed" : extraction.status,
    processingStatus,
    integrityStatus,
    limitation: [emailReadyLanguage, combinedLimitations].filter(Boolean).join(" "),
    sourceExternalId: inserted.external_id,
    retrievalUnitCount: unitRows.length,
    originalStorageStatus: originalStored ? "stored" : "not_applicable",
    durableSourceRecordStatus: "persisted",
    handlingPath: effectiveHandling,
    materialLimitations: [emailReadyLanguage, combinedLimitations].filter(Boolean).join(" "),
    documentIdentity: input.documentIdentity,
    retrievalReadiness: retrievalReady
      ? incompleteCoverage
        ? "partial"
        : "ready"
      : "not_ready",
    retrievalUnitStatus: unitRows.length > 0 ? "created" : "none",
    attachmentCoverage,
    parentEmailExternalIds: input.parentEmailExternalId
      ? [input.parentEmailExternalId]
      : undefined,
    pageCoverageComplete,
  });

  // Source cards are independent of retrievalReady — failure must not demote readiness.
  let finalReceipt: IngestionReceipt = { ...baseReceipt, providerMode };
  if (baseReceipt.durableKnowledgeConfirmed) {
    maybeInjectFault("before_source_card");
    const card = await generateAndPersistSourceCard({
      knowledgeSourceId: inserted.id,
      sourceExternalId: inserted.external_id,
      contentHash: hash,
      sourceType,
      filename,
      extraction,
      extractionRowIds: persistedDerivatives.map((d) => d.id),
      isAttachmentChild: Boolean(input.parentEmailSourceId),
    });
    finalReceipt = applySourceCardToReceipt(finalReceipt, card);
  }

  await supabase
    .from("knowledge_sources")
    .update({
      processing_status: processingStatus,
      retrieval_ready: retrievalReady,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inserted.id);

  return { ...finalReceipt, processingStatus, providerMode };
}

async function expandEmailAttachments(input: {
  parentSourceId: string;
  parentExternalId: string;
  attachments: NonNullable<import("./types.js").ExtractionResult["attachments"]>;
  ingestionMethod: SourceInput["ingestionMethod"];
  authority: AuthorityClassification;
}): Promise<AttachmentCoverageSummary> {
  const supabase = getSupabase();
  let confirmed = 0;
  let blocked = 0;
  let deferred = 0;
  let duplicateLinked = 0;

  for (const att of input.attachments) {
    const attHash = contentHash(att.bytes);
    const existing = await findDuplicateByHash(attHash);
    let childId: string;
    let childExternalId: string;
    let childWasDuplicate = false;
    let childLimitation = att.limitation;
    let childRetrievalReady = false;

    if (existing) {
      childWasDuplicate = true;
      childId = existing.id;
      childExternalId = existing.external_id;
      duplicateLinked += 1;
      confirmed += 1;
      childRetrievalReady = true;
    } else {
      const childReceipt = await ingestSource({
        filename: att.filename,
        bytes: att.bytes,
        mimeType: att.mimeType,
        ingestionMethod: input.ingestionMethod,
        authorityClassification: input.authority,
        parentEmailSourceId: input.parentSourceId,
        parentEmailExternalId: input.parentExternalId,
        attachmentMeta: {
          ordinal: att.ordinal,
          mimePartPath: att.mimePartPath,
          contentId: att.contentId,
          inline: att.inline,
          displayedFilename: att.filename,
        },
        skipAttachmentExpansion: true,
        handlingPath: "email_attachment_child",
      });
      const { data: childRow } = await supabase
        .from("knowledge_sources")
        .select("id, external_id, retrieval_ready")
        .eq("content_hash", attHash)
        .limit(1)
        .maybeSingle();
      if (!childRow) {
        blocked += 1;
        continue;
      }
      childId = childRow.id as string;
      childExternalId = childRow.external_id as string;
      childRetrievalReady = Boolean(childRow.retrieval_ready);
      childLimitation = childReceipt.materialLimitations ?? childReceipt.limitation;
      if (
        childReceipt.extractionStatus === "deferred" ||
        childReceipt.handlingPath === "deferred_extraction"
      ) {
        deferred += 1;
      } else if (childRetrievalReady) {
        confirmed += 1;
      } else {
        blocked += 1;
      }
    }

    // Fault point 3: attachment child exists; links not yet persisted
    maybeInjectFault("after_attachment_child_before_links");

    const { data: existingLink } = await supabase
      .from("knowledge_source_attachment_links")
      .select("id")
      .eq("parent_source_id", input.parentSourceId)
      .eq("child_source_id", childId)
      .eq("attachment_ordinal", att.ordinal)
      .maybeSingle();
    if (existingLink) {
      continue;
    }

    const linkExternalId = `ATL-${input.parentExternalId}-a${att.ordinal}-${attHash.slice(0, 8)}`;
    await supabase.from("knowledge_source_attachment_links").insert({
      external_id: linkExternalId,
      parent_source_id: input.parentSourceId,
      child_source_id: childId,
      attachment_ordinal: att.ordinal,
      displayed_filename: att.filename,
      declared_mime_type: att.mimeType,
      mime_part_path: att.mimePartPath ?? null,
      content_id: att.contentId ?? null,
      inline_status: Boolean(att.inline),
      content_hash: attHash,
      child_was_duplicate: childWasDuplicate,
      material_limitations: childLimitation ?? null,
      transformation_log: [
        transformationEntry(
          "email_attachment_linked",
          "Attachment is a distinct child source (or link to exact-duplicate child). Filename is metadata only — not authority.",
          {
            parent_external_id: input.parentExternalId,
            child_external_id: childExternalId,
            ordinal: att.ordinal,
            child_was_duplicate: childWasDuplicate,
          }
        ),
      ],
    });

    await supabase.from("artifact_links").insert({
      source_table: "knowledge_sources",
      source_id: input.parentSourceId,
      target_table: "knowledge_sources",
      target_id: childId,
      link_type: "other",
      notes: `email_attachment ordinal=${att.ordinal} filename=${att.filename}`,
    });
  }

  const total = input.attachments.length;
  const summary =
    blocked > 0 || deferred > 0
      ? `email body retrieval-ready; attachment coverage: ${confirmed} confirmed, ${blocked} blocked` +
        (deferred ? `, ${deferred} deferred` : "") +
        (duplicateLinked ? ` (${duplicateLinked} exact-duplicate link(s))` : "") +
        "."
      : `email body retrieval-ready; attachment coverage: ${confirmed} confirmed, 0 blocked` +
        (duplicateLinked ? ` (${duplicateLinked} exact-duplicate link(s))` : "") +
        ".";

  return { total, confirmed, blocked, deferred, duplicateLinked, summary };
}

/** Deterministic external id helper for tests. */
export function previewExternalId(filename: string, bytes: Buffer): string {
  const hash = contentHash(bytes);
  return `SRC-${slugify(basename(filename)) || "source"}-${hash.slice(0, 10)}`;
}

export function newRunExternalId(prefix = "ING"): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
}
