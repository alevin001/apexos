import { extname } from "node:path";

/**
 * Lightweight material blockers for Build 19 status honesty.
 * Not a full forensics suite — enough to surface encrypted/corrupt when detectable.
 */
export function detectMaterialBlockers(
  filename: string,
  bytes: Buffer
): {
  encrypted: boolean;
  corrupt: boolean;
  detail?: string;
} {
  if (!bytes.length) {
    return { encrypted: false, corrupt: true, detail: "File is empty (0 bytes)." };
  }

  const ext = extname(filename).toLowerCase();

  if (ext === ".pdf" || bytes.subarray(0, 5).toString("utf8") === "%PDF-") {
    const head = bytes.subarray(0, Math.min(bytes.length, 64 * 1024)).toString("latin1");
    if (!head.includes("%PDF")) {
      return { encrypted: false, corrupt: true, detail: "PDF magic header missing or unreadable." };
    }
    // PDF encryption dictionary present
    if (/\/Encrypt[\s\/\[]/.test(head) || head.includes("/Encrypt ")) {
      return {
        encrypted: true,
        corrupt: false,
        detail: "extraction blocked—encrypted",
      };
    }
  }

  // OLE CFBF header used by .doc/.xls/.ppt/.msg — truncated compound files
  if (ext === ".doc" || ext === ".xls" || ext === ".ppt" || ext === ".msg") {
    const oleMagic = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    if (bytes.length < 512 || !bytes.subarray(0, 8).equals(oleMagic)) {
      return {
        encrypted: false,
        corrupt: true,
        detail: "OLE compound file header missing or truncated (unreadable/corrupt).",
      };
    }
  }

  // OOXML packages are ZIP (PK)
  if (ext === ".docx" || ext === ".xlsx" || ext === ".pptx") {
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      return {
        encrypted: false,
        corrupt: true,
        detail: "OOXML package ZIP header missing (unreadable/corrupt).",
      };
    }
  }

  // Individual .eml — null bytes or missing header-like structure
  if (ext === ".eml") {
    if (bytes.includes(0)) {
      return {
        encrypted: false,
        corrupt: true,
        detail: "EML contains null bytes (unreadable/corrupt).",
      };
    }
    const head = bytes.subarray(0, Math.min(bytes.length, 8 * 1024)).toString("utf8");
    const looksLikeEmail =
      /^(From|To|Subject|Date|MIME-Version|Content-Type|Message-ID|Received):/im.test(head) ||
      head.startsWith("From "); // mbox-style From_
    if (!looksLikeEmail) {
      return {
        encrypted: false,
        corrupt: true,
        detail: "EML lacks recognizable RFC 822 headers (unreadable/corrupt).",
      };
    }
  }

  // Truncated OLE .msg
  if (ext === ".msg") {
    const oleMagic = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    if (bytes.length < 512 || !bytes.subarray(0, 8).equals(oleMagic)) {
      return {
        encrypted: false,
        corrupt: true,
        detail: "MSG OLE compound header missing or truncated (unreadable/corrupt).",
      };
    }
  }

  return { encrypted: false, corrupt: false };
}
