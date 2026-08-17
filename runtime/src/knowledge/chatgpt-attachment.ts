import { ingestSource } from "./ingest.js";
import { buildReceipt, formatReceiptPlainLanguage } from "./receipt.js";
import type { ChatGptFileRef, IngestionReceipt } from "./types.js";

export const CHATGPT_FILE_CAPABILITY = {
  /**
   * ChatGPT Apps / Developer Mode can inject file params when the tool declares
   * `_meta["openai/fileParams"]`. The host may pass `{ download_url, file_id, ... }`
   * or coerce the model-facing arg to a file_id string.
   *
   * Selecting ApexOS + uploading a file does NOT guarantee a tool call.
   * Durable ingestion is confirmed only when this tool runs and returns
   * durableKnowledgeConfirmed=true.
   */
  hostCanInjectFileParams: true,
  automaticIngestionGuaranteed: false,
  originalBinaryTransfer: "when_download_url_reachable" as const,
  textOnlyFallback: true,
  explicitPhrase: "Add this file to ApexOS.",
};

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

export type IngestAttachmentArgs = {
  file?: ChatGptFileRef | string | null;
  fileName?: string;
  mimeType?: string;
  textContent?: string;
  title?: string;
  sourceOwner?: string;
  scopeClassification?: string;
  replacesSourceId?: string;
};

export async function downloadChatGptFile(
  file: ChatGptFileRef
): Promise<{ bytes: Buffer; filename: string; mimeType?: string } | { error: string }> {
  if (!file.download_url) {
    return {
      error:
        "No download_url was provided. ChatGPT may have passed only a file_id; without a reachable URL ApexOS cannot fetch the original bytes in this connector path.",
    };
  }

  try {
    const response = await fetch(file.download_url);
    if (!response.ok) {
      return { error: `Attachment download failed (${response.status}).` };
    }
    const contentType = response.headers.get("content-type") ?? file.mime_type ?? undefined;
    const lengthHeader = response.headers.get("content-length");
    if (lengthHeader && Number(lengthHeader) > MAX_DOWNLOAD_BYTES) {
      return { error: `Attachment exceeds ${MAX_DOWNLOAD_BYTES} byte limit.` };
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return { error: `Attachment exceeds ${MAX_DOWNLOAD_BYTES} byte limit.` };
    }
    return {
      bytes: Buffer.from(arrayBuffer),
      filename: file.file_name ?? "chatgpt-upload.bin",
      mimeType: contentType?.split(";")[0]?.trim() || file.mime_type,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to download ChatGPT attachment",
    };
  }
}

function normalizeFileArg(file: IngestAttachmentArgs["file"]): ChatGptFileRef | null {
  if (!file) return null;
  if (typeof file === "string") {
    // Host coerced fileParams to a bare file_id string — no download_url available here.
    return { file_id: file };
  }
  return file;
}

/**
 * Best reliable ChatGPT upload path:
 * 1) Prefer host file download_url → original bytes
 * 2) Else accept operator/model-supplied textContent as derived extraction only
 * 3) Never claim durable ingestion without confirmed persistence
 */
export async function ingestChatGptAttachment(
  args: IngestAttachmentArgs
): Promise<{ receipt: IngestionReceipt; display: string; platformNote: string }> {
  const file = normalizeFileArg(args.file);
  const platformNote =
    "ChatGPT upload alone does not make a file durable ApexOS knowledge. " +
    "Ingestion is confirmed only when this tool returns durableKnowledgeConfirmed=true. " +
    `If the host did not pass a file, say “${CHATGPT_FILE_CAPABILITY.explicitPhrase}” and ensure ApexOS calls this tool.`;

  if (file?.download_url) {
    const downloaded = await downloadChatGptFile(file);
    if ("error" in downloaded) {
      if (args.textContent?.trim()) {
        const receipt = await ingestSource({
          filename: args.fileName ?? file.file_name ?? "chatgpt-text.txt",
          bytes: Buffer.alloc(0),
          mimeType: "text/plain",
          providedText: args.textContent,
          title: args.title ?? args.fileName ?? file.file_name,
          sourceOwner: args.sourceOwner,
          scopeClassification: args.scopeClassification,
          ingestionMethod: "chatgpt_text",
          hostFileId: file.file_id,
          replacesSourceId: args.replacesSourceId,
        });
        receipt.limitation = [downloaded.error, receipt.limitation].filter(Boolean).join(" ");
        return {
          receipt,
          display: formatReceiptPlainLanguage(receipt),
          platformNote,
        };
      }
      const receipt = buildReceipt({
        ingested: false,
        claim: "not_ingested",
        title: args.title ?? file.file_name ?? "uploaded file",
        sourceType: "unknown",
        originalStored: false,
        originalAvailable: false,
        textExtracted: false,
        retrievalReady: false,
        authorityClassification: "unverified",
        extractionStatus: "failed",
        processingStatus: "failed",
        integrityStatus: "error",
        limitation: downloaded.error,
        retrievalUnitCount: 0,
        originalStorageStatus: "failed",
        durableSourceRecordStatus: "not_created",
      });
      receipt.glassBoxHint =
        "No durable source was created. Retry with a reachable attachment or paste content and say “Add this to ApexOS.”";
      return { receipt, display: formatReceiptPlainLanguage(receipt), platformNote };
    }

    const receipt = await ingestSource({
      filename: args.fileName ?? downloaded.filename,
      bytes: downloaded.bytes,
      mimeType: args.mimeType ?? downloaded.mimeType,
      providedText: args.textContent,
      title: args.title ?? args.fileName ?? downloaded.filename,
      sourceOwner: args.sourceOwner,
      scopeClassification: args.scopeClassification,
      ingestionMethod: "chatgpt_attachment",
      hostFileId: file.file_id,
      sourceLocation: file.file_id ? `chatgpt:file:${file.file_id}` : "chatgpt:attachment",
      replacesSourceId: args.replacesSourceId,
    });
    return { receipt, display: formatReceiptPlainLanguage(receipt), platformNote };
  }

  if (args.textContent?.trim()) {
    const receipt = await ingestSource({
      filename: args.fileName ?? "chatgpt-provided.txt",
      bytes: Buffer.alloc(0),
      mimeType: "text/plain",
      providedText: args.textContent,
      title: args.title ?? args.fileName ?? "ChatGPT provided text",
      sourceOwner: args.sourceOwner,
      scopeClassification: args.scopeClassification,
      ingestionMethod: "chatgpt_text",
      hostFileId: file?.file_id,
      sourceLocation: file?.file_id ? `chatgpt:file:${file.file_id}` : "chatgpt:text",
      replacesSourceId: args.replacesSourceId,
    });
    if (!receipt.limitation) {
      receipt.limitation =
        "Only host/model-provided text was available — original binary was not transferred.";
    }
    return { receipt, display: formatReceiptPlainLanguage(receipt), platformNote };
  }

  if (file?.file_id && !file.download_url) {
    const receipt = buildReceipt({
      ingested: false,
      claim: "not_ingested",
      title: args.title ?? args.fileName ?? "uploaded file",
      sourceType: "unknown",
      originalStored: false,
      originalAvailable: false,
      textExtracted: false,
      retrievalReady: false,
      authorityClassification: "unverified",
      extractionStatus: "failed",
      processingStatus: "failed",
      integrityStatus: "error",
      limitation:
        "ChatGPT provided a file_id without a download_url. ApexOS cannot fetch the original bytes in this path. Ask again with the file attached, or paste the content and say “Add this to ApexOS.”",
      retrievalUnitCount: 0,
      originalStorageStatus: "failed",
      durableSourceRecordStatus: "not_created",
    });
    receipt.glassBoxHint = "No durable source was created.";
    return { receipt, display: formatReceiptPlainLanguage(receipt), platformNote };
  }

  const receipt = buildReceipt({
    ingested: false,
    claim: "not_ingested",
    title: args.title ?? "uploaded file",
    sourceType: "unknown",
    originalStored: false,
    originalAvailable: false,
    textExtracted: false,
    retrievalReady: false,
    authorityClassification: "unverified",
    extractionStatus: "failed",
    processingStatus: "failed",
    integrityStatus: "error",
    limitation:
      "No file reference or text content was provided to the ingestion tool. Uploading in ChatGPT without a successful tool call does not persist knowledge in ApexOS.",
    retrievalUnitCount: 0,
    originalStorageStatus: "not_applicable",
    durableSourceRecordStatus: "not_created",
  });
  receipt.glassBoxHint = `Say “${CHATGPT_FILE_CAPABILITY.explicitPhrase}” so ApexOS can attempt governed ingestion.`;
  return { receipt, display: formatReceiptPlainLanguage(receipt), platformNote };
}
