/**
 * Build 19 Checkpoint G — deterministic preflight expectations (operational only).
 */
import { extname } from "node:path";
import type { ClassifiedItem } from "./classify.js";
import type {
  ImportManifestItem,
  PreflightManifestSummary,
  ProviderModeLabel,
} from "./types.js";

export function expectedExtractionMethod(item: ClassifiedItem): string {
  const ext = extname(item.filename).toLowerCase();
  if (item.handlingPath === "excluded_system_sidecar") return "none—excluded";
  if (item.handlingPath.startsWith("preserve_only")) return "none—preserve_only";
  if (item.handlingPath === "deferred_mailbox_container") return "none—deferred_mailbox";
  if (item.handlingPath === "deferred_extraction") return "none—deferred";
  if (item.handlingPath === "vision_assisted") return "governed_vision";
  if (item.handlingPath === "email_message") {
    return ext === ".msg" ? "msgreader_controlled" : "postal_mime_deterministic";
  }
  if (ext === ".pdf") return "pdf_native_first_governed";
  if (ext === ".docx") return "docx_native";
  if (ext === ".xlsx") return "xlsx_native";
  if (ext === ".pptx") return "pptx_native";
  if ([".md", ".txt", ".markdown", ".csv", ".json"].includes(ext)) return "utf8_native";
  return "native_or_preserve";
}

export function expectedProviderUse(
  item: ClassifiedItem
): ImportManifestItem["expectedProviderUse"] {
  if (
    item.handlingPath === "excluded_system_sidecar" ||
    item.handlingPath.startsWith("preserve_only") ||
    item.handlingPath === "deferred_mailbox_container" ||
    item.handlingPath === "deferred_extraction"
  ) {
    return "none";
  }
  if (item.handlingPath === "vision_assisted") return "vision_and_source_card";
  if (extname(item.filename).toLowerCase() === ".pdf") return "vision_and_source_card";
  if (
    item.handlingPath === "extractable_native" ||
    item.handlingPath === "email_message"
  ) {
    return "source_card";
  }
  return "none";
}

export function expectedSourceCardEligibility(
  item: ClassifiedItem
): ImportManifestItem["expectedSourceCardEligibility"] {
  if (
    item.handlingPath === "excluded_system_sidecar" ||
    item.handlingPath === "deferred_mailbox_container"
  ) {
    return "n/a";
  }
  if (item.handlingPath.startsWith("preserve_only") || item.corrupt) {
    return "ineligible";
  }
  return "eligible";
}

export function expectedTerminalStatus(item: ClassifiedItem): string {
  if (item.handlingPath === "excluded_system_sidecar") return "excluded";
  if (item.handlingPath === "deferred_mailbox_container") return "deferred_mailbox";
  if (item.handlingPath === "preserve_only_corrupt") return "blocked_corrupt_preserve";
  if (item.handlingPath === "preserve_only_legacy_office") return "preserve_only_legacy";
  if (item.handlingPath === "preserve_only_unsupported") return "preserve_only_unsupported";
  if (item.handlingPath === "preserve_only_encrypted") return "blocked_encrypted_preserve";
  if (item.handlingPath === "email_message") return "mixed_email_parent_with_attachment_coverage";
  if (item.handlingPath === "vision_assisted") return "retrieval_ready_if_vision_confirmed";
  return "retrieval_ready_if_extraction_confirmed";
}

export function enrichManifestItem(
  item: ImportManifestItem,
  classified: ClassifiedItem,
  opts?: { duplicateOccurrence?: boolean }
): ImportManifestItem {
  return {
    ...item,
    expectedExtractionMethod: expectedExtractionMethod(classified),
    expectedProviderUse: expectedProviderUse(classified),
    expectedSourceCardEligibility: expectedSourceCardEligibility(classified),
    expectedTerminalStatus: expectedTerminalStatus(classified),
    exclusionRule:
      classified.handlingPath === "excluded_system_sidecar"
        ? classified.classificationReason
        : undefined,
    itemKind: classified.pathRejected
      ? "path_rejected"
      : classified.handlingPath === "excluded_system_sidecar" || classified.excluded
        ? "excluded"
        : opts?.duplicateOccurrence
          ? "duplicate_occurrence"
          : "top_level",
  };
}

export function buildPreflightSummary(
  items: ImportManifestItem[]
): PreflightManifestSummary {
  const byHash = new Map<string, ImportManifestItem[]>();
  for (const item of items) {
    if (!item.contentHash || item.itemKind === "excluded" || item.itemKind === "path_rejected") {
      continue;
    }
    const list = byHash.get(item.contentHash) ?? [];
    list.push(item);
    byHash.set(item.contentHash, list);
  }
  let duplicateIntakeOccurrences = 0;
  for (const list of byHash.values()) {
    if (list.length > 1) duplicateIntakeOccurrences += list.length - 1;
  }
  // Attachment children/links are planned during email execute — estimate from .eml/.msg
  const emailParents = items.filter(
    (i) =>
      i.handlingPath === "email_message" &&
      i.itemKind !== "excluded" &&
      i.duplicateStatus !== "duplicate_of_existing"
  ).length;

  return {
    topLevelDiscovered: items.filter((i) => i.itemKind !== "path_rejected").length,
    uniqueDurableSourcesPlanned: byHash.size,
    duplicateIntakeOccurrences,
    attachmentChildrenPlanned: emailParents > 0 ? emailParents : 0,
    attachmentLinksPlanned: emailParents > 0 ? emailParents : 0,
    excludedVisible: items.filter((i) => i.itemKind === "excluded").length,
    pathRejected: items.filter((i) => i.itemKind === "path_rejected").length,
  };
}

export function annotateProviderMode(
  mode: ProviderModeLabel
): { providerMode: ProviderModeLabel } {
  return { providerMode: mode };
}
