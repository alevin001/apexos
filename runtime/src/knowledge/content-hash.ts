import { createHash } from "node:crypto";

/** SHA-256 of original bytes — used for duplicate detection without deleting originals. */
export function contentHash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
