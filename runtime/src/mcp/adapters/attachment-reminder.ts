/**
 * Build 18 — attachment awareness reminder.
 * Emitted only when ApexOS actually receives a host file reference,
 * and only once per new attachment (file_id) per session.
 */

export const ATTACHMENT_REMINDER =
  "Attachment in this chat — not yet ApexOS knowledge. Say ‘Add this file to ApexOS’ to start governed intake and receive a durable-storage receipt.";

type FileLike =
  | string
  | {
      file_id?: string;
      download_url?: string;
      file_name?: string;
      mime_type?: string;
    }
  | null
  | undefined;

/** Session → set of file_ids already reminded. */
const remindedBySession = new Map<string, Set<string>>();

export function extractAttachmentFileId(file: FileLike): string | null {
  if (!file) return null;
  if (typeof file === "string") {
    const id = file.trim();
    return id.length > 0 ? id : null;
  }
  if (typeof file.file_id === "string" && file.file_id.trim()) {
    return file.file_id.trim();
  }
  // download_url without file_id still proves ApexOS received a file reference
  if (typeof file.download_url === "string" && file.download_url.trim()) {
    return `url:${file.download_url.trim()}`;
  }
  return null;
}

export function hasUsableFileReference(file: FileLike): boolean {
  return extractAttachmentFileId(file) != null;
}

/**
 * Returns the reminder text once per new attachment for this session.
 * Subsequent turns with the same file_id return null.
 */
export function consumeAttachmentReminder(
  sessionKey: string,
  file: FileLike
): string | null {
  const fileId = extractAttachmentFileId(file);
  if (!fileId) return null;

  let set = remindedBySession.get(sessionKey);
  if (!set) {
    set = new Set();
    remindedBySession.set(sessionKey, set);
  }
  if (set.has(fileId)) return null;
  set.add(fileId);
  return ATTACHMENT_REMINDER;
}

/** Test helper — clear reminder state. */
export function clearAttachmentRemindersForTests(): void {
  remindedBySession.clear();
}
