import { getSupabase } from "../../shared/supabase.js";
import type { ExtractionResult, IngestionReceipt, SourceCardStatus } from "../types.js";
import { buildSourceCardInput } from "./inputs.js";
import { getSourceCardProvider } from "./provider.js";
import {
  SOURCE_CARD_PROCESS_VERSION,
  SOURCE_CARD_PROMPT_VERSION,
  SOURCE_CARD_WITHHELD,
} from "./versions.js";

export interface SourceCardGenerationResult {
  status: SourceCardStatus;
  externalId?: string;
  coverage?: string;
  limitation?: string;
  mayInformRecall: boolean;
  reused?: boolean;
  catalogSummary?: string;
  retrievalCues?: string[];
  providerModel?: string;
  processVersion: string;
  promptVersion: string;
}

function transformationEntry(action: string, rationale: string, extra?: Record<string, unknown>) {
  return {
    date: new Date().toISOString().slice(0, 10),
    action,
    rationale,
    actor: "build-19-source-card",
    ...extra,
  };
}

/**
 * Generate and persist a neutral source card for a durable source.
 * Never changes retrievalReady. Never stores card text as source_evidence units.
 */
export async function generateAndPersistSourceCard(input: {
  knowledgeSourceId: string;
  sourceExternalId: string;
  contentHash: string;
  sourceType: string;
  filename: string;
  extraction: ExtractionResult;
  extractionRowIds?: string[];
  isAttachmentChild?: boolean;
  attemptVersion?: number;
}): Promise<SourceCardGenerationResult> {
  const built = buildSourceCardInput({
    sourceType: input.sourceType,
    filename: input.filename,
    extraction: input.extraction,
    isAttachmentChild: input.isAttachmentChild,
    attachmentCount: input.extraction.attachments?.length,
  });

  if (!built.usable) {
    return {
      status: "unavailable",
      coverage: "none",
      limitation: built.unavailableReason ?? "source card unavailable—no usable extraction.",
      mayInformRecall: false,
      processVersion: SOURCE_CARD_PROCESS_VERSION,
      promptVersion: SOURCE_CARD_PROMPT_VERSION,
    };
  }

  const supabase = getSupabase();
  const processVersion = SOURCE_CARD_PROCESS_VERSION;

  // Idempotence: same source hash + input manifest + process version → reuse
  const { data: existing } = await supabase
    .from("knowledge_source_cards")
    .select("id, external_id, status, coverage_status, material_limitations, catalog_summary, searchable")
    .eq("knowledge_source_id", input.knowledgeSourceId)
    .eq("content_hash_of_original", input.contentHash)
    .eq("input_manifest_hash", built.manifestHash)
    .eq("process_version", processVersion)
    .eq("searchable", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      status: (existing.status as SourceCardStatus) || "generated",
      externalId: existing.external_id as string,
      coverage:
        existing.coverage_status === "partial"
          ? "source card generated from partial confirmed extraction coverage; not a complete-source summary."
          : "source card generated from confirmed extraction coverage.",
      limitation: (existing.material_limitations as string) || undefined,
      mayInformRecall: Boolean(existing.searchable),
      reused: true,
      catalogSummary: (existing.catalog_summary as string) || undefined,
      processVersion,
      promptVersion: SOURCE_CARD_PROMPT_VERSION,
    };
  }

  // Prior card with different manifest → will create new record (supersession link if prior exists)
  const { data: prior } = await supabase
    .from("knowledge_source_cards")
    .select("id, external_id")
    .eq("knowledge_source_id", input.knowledgeSourceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const provider = getSourceCardProvider();
  const result = await provider.generate({
    inputText: built.providerText,
    metadataNote: built.metadataNote,
    sourceType: input.sourceType,
    formatLabel: built.manifest.formatLabel,
  });

  if (!result.ok || !result.output) {
    const externalId = `CARD-${input.sourceExternalId}-failed-${Date.now().toString(36)}`;
    await supabase.from("knowledge_source_cards").insert({
      external_id: externalId,
      knowledge_source_id: input.knowledgeSourceId,
      representation_kind: "source_card",
      epistemic_type: "derived_catalog",
      description: "source card generation failed",
      apparent_purpose: "",
      document_type: built.manifest.formatLabel,
      catalog_summary: null,
      material_limitations:
        result.limitation ??
        "source card generation failed; underlying retrieval readiness is unchanged.",
      provider_name: result.provider,
      provider_model: result.model,
      process_version: processVersion,
      prompt_version: result.promptVersion,
      content_hash_of_original: input.contentHash,
      input_manifest_hash: built.manifestHash,
      input_manifest: built.manifest,
      input_extraction_ids: input.extractionRowIds ?? [],
      status: "failed",
      coverage_status: built.manifest.coverageStatus,
      searchable: false,
      supersedes_card_id: prior?.id ?? null,
      attempt_version: input.attemptVersion ?? 1,
      transformation_log: [
        transformationEntry(
          "source_card_failed",
          "Card generation failed or invalid — originals and retrieval units unchanged",
          { error: result.error, limitation: result.limitation }
        ),
      ],
    });
    return {
      status: "failed",
      externalId,
      coverage: built.manifest.coverageStatus,
      limitation:
        result.limitation ??
        "source card generation failed; underlying retrieval readiness is unchanged.",
      mayInformRecall: false,
      processVersion,
      promptVersion: result.promptVersion,
      providerModel: result.model,
    };
  }

  if (result.output.withheld) {
    const externalId = `CARD-${input.sourceExternalId}-withheld-${Date.now().toString(36)}`;
    await supabase.from("knowledge_source_cards").insert({
      external_id: externalId,
      knowledge_source_id: input.knowledgeSourceId,
      representation_kind: "source_card",
      epistemic_type: "derived_catalog",
      description: SOURCE_CARD_WITHHELD,
      apparent_purpose: "",
      document_type: result.output.documentType,
      catalog_summary: SOURCE_CARD_WITHHELD,
      material_limitations: result.output.materialLimitations,
      provider_name: result.provider,
      provider_model: result.model,
      process_version: processVersion,
      prompt_version: result.promptVersion,
      response_id: result.responseId ?? null,
      content_hash_of_original: input.contentHash,
      input_manifest_hash: built.manifestHash,
      input_manifest: built.manifest,
      input_extraction_ids: input.extractionRowIds ?? [],
      retrieval_cues: [],
      status: "withheld",
      coverage_status: built.manifest.coverageStatus,
      searchable: false,
      supersedes_card_id: prior?.id ?? null,
      attempt_version: input.attemptVersion ?? 1,
      transformation_log: [
        transformationEntry(
          "source_card_withheld",
          "Insufficient grounded extraction — card not searchable; retrieval readiness unchanged",
          { response_id: result.responseId }
        ),
      ],
    });
    return {
      status: "withheld",
      externalId,
      coverage: built.manifest.coverageStatus,
      limitation: "source card withheld—insufficient grounded extraction",
      mayInformRecall: false,
      catalogSummary: SOURCE_CARD_WITHHELD,
      processVersion,
      promptVersion: result.promptVersion,
      providerModel: result.model,
    };
  }

  const status: SourceCardStatus =
    built.manifest.coverageStatus === "partial" ? "generated_partial" : "generated";
  const coverageLanguage =
    status === "generated_partial"
      ? "source card generated from partial confirmed extraction coverage; not a complete-source summary."
      : "source card generated from confirmed extraction coverage.";

  const attempt = input.attemptVersion ?? (prior ? 2 : 1);
  const externalId = `CARD-${input.sourceExternalId}-v${attempt}-${built.manifestHash.slice(0, 8)}`;

  const { error } = await supabase.from("knowledge_source_cards").insert({
    external_id: externalId,
    knowledge_source_id: input.knowledgeSourceId,
    representation_kind: "source_card",
    epistemic_type: "derived_catalog",
    description: result.output.catalogSummary,
    apparent_purpose: result.output.apparentPurpose || "not asserted",
    document_type: result.output.documentType,
    catalog_summary: result.output.catalogSummary,
    format_label: built.manifest.formatLabel,
    material_limitations: [
      result.output.materialLimitations,
      coverageLanguage,
      "epistemic_type=derived_catalog; not citation-eligible; not authority-eligible; not learning-eligible.",
    ].join(" "),
    provider_name: result.provider,
    provider_model: result.model,
    process_version: processVersion,
    prompt_version: result.promptVersion,
    response_id: result.responseId ?? null,
    content_hash_of_original: input.contentHash,
    input_manifest_hash: built.manifestHash,
    input_manifest: {
      ...built.manifest,
      included: built.manifest.included.map(({ text, ...rest }) => ({
        ...rest,
        textPreview: text.slice(0, 160),
      })),
    },
    input_extraction_ids: input.extractionRowIds ?? [],
    retrieval_cues: result.output.retrievalCues,
    status,
    coverage_status: built.manifest.coverageStatus,
    searchable: true,
    supersedes_card_id: prior?.id ?? null,
    attempt_version: attempt,
    transformation_log: [
      transformationEntry(
        "source_card_generated",
        "Neutral derived catalog card from confirmed extraction — candidate recall only; never evidence",
        {
          coverage_status: built.manifest.coverageStatus,
          input_manifest_hash: built.manifestHash,
          provider_model: result.model,
          prompt_version: result.promptVersion,
          supersedes: prior?.external_id ?? null,
        }
      ),
    ],
  });

  if (error) {
    return {
      status: "failed",
      limitation: `source card persistence failed: ${error.message}; underlying retrieval readiness is unchanged.`,
      mayInformRecall: false,
      processVersion,
      promptVersion: result.promptVersion,
      providerModel: result.model,
    };
  }

  return {
    status,
    externalId,
    coverage: coverageLanguage,
    limitation: result.output.materialLimitations,
    mayInformRecall: true,
    catalogSummary: result.output.catalogSummary,
    retrievalCues: result.output.retrievalCues,
    processVersion,
    promptVersion: result.promptVersion,
    providerModel: result.model,
  };
}

export function applySourceCardToReceipt(
  receipt: IngestionReceipt,
  card: SourceCardGenerationResult
): IngestionReceipt {
  return {
    ...receipt,
    sourceCardStatus: card.status,
    sourceCardExternalId: card.externalId,
    sourceCardCoverage: card.coverage,
    sourceCardLimitation: card.limitation,
    sourceCardMayInformRecall: card.mayInformRecall,
    materialLimitations: [receipt.materialLimitations, card.limitation, card.coverage]
      .filter(Boolean)
      .join(" "),
  };
}
