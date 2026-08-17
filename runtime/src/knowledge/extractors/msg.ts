import msgMod from "@kenjiuno/msgreader";
import type {
  AttachmentDraft,
  DerivedExtractionDraft,
  ExtractionResult,
  RetrievalUnitDraft,
} from "../types.js";
import {
  MSG_PROCESS_VERSION,
  chunkBlocks,
  extractHttpUrls,
  htmlToTextDeterministic,
  safeFilename,
  splitQuotedCorrespondence,
  unitsFromBlocks,
} from "./email-shared.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MsgReaderCtor(): any {
  const mod = msgMod as { default?: unknown };
  return mod.default ?? msgMod;
}

/**
 * Controlled individual .msg extraction via @kenjiuno/msgreader.
 * Does not fabricate RFC 822. Reports unavailable fields honestly.
 */
export function extractMsg(bytes: Buffer): ExtractionResult {
  const unavailable: string[] = [];
  try {
    const Ctor = MsgReaderCtor();
    if (typeof Ctor !== "function") {
      return {
        status: "failed",
        method: "msgreader",
        mimeType: "application/vnd.ms-outlook",
        processVersion: MSG_PROCESS_VERSION,
        limitation:
          "MSG parser constructor unavailable. Original preserved; email extraction blocked.",
        emailMetadata: { format: "msg", unavailableFields: ["parser"] },
      };
    }

    const reader = new Ctor(bytes);
    const data = reader.getFileData() as {
      subject?: string;
      body?: string;
      bodyHtml?: string;
      senderName?: string;
      senderEmail?: string;
      messageId?: string;
      headers?: string;
      recipients?: Array<{ name?: string; email?: string; recipType?: string }>;
      attachments?: Array<{
        fileName?: string;
        attachMimeTag?: string;
        contentLength?: number;
        pidContentId?: string;
        attachmentHidden?: boolean;
      }>;
      clientSubmitTime?: string | Date;
    };

    const attachments: AttachmentDraft[] = [];
    const rawAtts = Array.isArray(data.attachments) ? data.attachments : [];
    for (let i = 0; i < rawAtts.length; i++) {
      const meta = rawAtts[i];
      let content = Buffer.alloc(0);
      try {
        const got = reader.getAttachment(meta) as { content?: Uint8Array | Buffer; fileName?: string };
        if (got?.content) content = Buffer.from(got.content);
      } catch {
        // leave empty
      }
      const filename = safeFilename(meta.fileName || gotName(meta), `msg-attachment-${i + 1}.bin`);
      attachments.push({
        ordinal: i + 1,
        filename,
        mimeType: meta.attachMimeTag || "application/octet-stream",
        bytes: content,
        contentId: meta.pidContentId,
        inline: Boolean(meta.attachmentHidden),
        mimePartPath: `MSG attachment ${i + 1}`,
        limitation:
          content.length === 0
            ? "MSG attachment content could not be recovered by parser."
            : undefined,
      });
    }

    const derivatives: DerivedExtractionDraft[] = [];
    const units: RetrievalUnitDraft[] = [];
    const limitations: string[] = [
      "Controlled .msg parsing via @kenjiuno/msgreader — not an RFC 822 equivalent.",
      "Only fields the parser recovered are exposed; others are unavailable/limited.",
      "No remote URL fetch. Sender/subject confer no authority.",
    ];

    if (!data.bodyHtml) unavailable.push("html_body");
    if (!data.headers) unavailable.push("full_headers");
    unavailable.push("bcc"); // MSG parser path does not surface Bcc; absence is not evidence

    const senderEmail =
      typeof data.senderEmail === "string" && data.senderEmail.trim()
        ? data.senderEmail.trim()
        : undefined;
    const senderName =
      typeof data.senderName === "string" && data.senderName.trim()
        ? data.senderName.trim()
        : undefined;
    // Do not fabricate a sender from recipients, subject, or other fields.
    const from =
      senderEmail || senderName
        ? [senderName, senderEmail].filter(Boolean).join(" <") +
          (senderEmail && senderName ? ">" : "")
        : undefined;
    if (!from) {
      unavailable.push("sender");
      limitations.push(
        "MSG sender unavailable for this parser/fixture — not fabricated from other fields."
      );
    }
    const to = (data.recipients ?? [])
      .filter((r) => (r.recipType || "to").toLowerCase() === "to")
      .map((r) => r.email || r.name)
      .filter((x): x is string => Boolean(x));
    const cc = (data.recipients ?? [])
      .filter((r) => (r.recipType || "").toLowerCase() === "cc")
      .map((r) => r.email || r.name)
      .filter((x): x is string => Boolean(x));

    const props = [
      data.subject ? `Subject: ${data.subject}` : null,
      from ? `From: ${from}` : "From: unavailable",
      to.length ? `To: ${to.join(", ")}` : null,
      cc.length ? `Cc: ${cc.join(", ")}` : null,
      data.clientSubmitTime
        ? `Date: ${
            data.clientSubmitTime instanceof Date
              ? data.clientSubmitTime.toISOString()
              : String(data.clientSubmitTime)
          }`
        : null,
      data.messageId ? `Message-ID: ${data.messageId}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (props) {
      const propUnits = [
        {
          unitIndex: 0,
          content: props,
          contentPreview: props.slice(0, 240),
          locator: {
            kind: "email_headers" as const,
            label: "MSG properties",
            section: "msg_properties",
          },
        },
      ];
      units.push(...propUnits);
      derivatives.push({
        representationKind: "email_headers",
        method: "msgreader_properties",
        processVersion: MSG_PROCESS_VERSION,
        text: props,
        units: propUnits,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation: "MSG property subset recovered by parser — not complete RFC 822 headers.",
      });
    }

    const body = (data.body || "").replace(/\r\n/g, "\n").trim();
    let quoteHeuristic = false;
    if (body) {
      const split = splitQuotedCorrespondence(body);
      quoteHeuristic = split.heuristic;
      const blocks = chunkBlocks(split.main);
      const bodyUnits = unitsFromBlocks(blocks, {
        kind: "email_section",
        labelPrefix: "MSG body",
        section: "plain_text",
      }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
      units.push(...bodyUnits);
      derivatives.push({
        representationKind: "email_plain_text",
        method: "msgreader_body",
        processVersion: MSG_PROCESS_VERSION,
        text: split.main,
        units: bodyUnits,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation: "MSG body text as recovered by parser.",
      });
      if (split.quoted) {
        const qBlocks = chunkBlocks(split.quoted);
        const qUnits = unitsFromBlocks(qBlocks, {
          kind: "email_section",
          labelPrefix: "MSG quoted correspondence",
          section: "quoted_heuristic",
        }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
        units.push(...qUnits);
        derivatives.push({
          representationKind: "email_quoted",
          method: "msgreader_quoted_heuristic",
          processVersion: MSG_PROCESS_VERSION,
          text: split.quoted,
          units: qUnits,
          createRetrievalUnits: true,
          attemptVersion: 1,
          limitation: "Quoted correspondence boundary detected heuristically.",
        });
      }
    } else {
      unavailable.push("body");
    }

    if (data.bodyHtml) {
      derivatives.push({
        representationKind: "email_html",
        method: "msgreader_html",
        processVersion: MSG_PROCESS_VERSION,
        text: data.bodyHtml,
        units: [],
        createRetrievalUnits: false,
        attemptVersion: 1,
        limitation: "MSG HTML body when recovered — stored separately from plain body.",
      });
      const derived = htmlToTextDeterministic(data.bodyHtml);
      if (derived) {
        const blocks = chunkBlocks(derived);
        const htmlUnits = unitsFromBlocks(blocks, {
          kind: "email_section",
          labelPrefix: "MSG HTML-derived text",
          section: "html_derived_text",
        }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
        units.push(...htmlUnits);
        derivatives.push({
          representationKind: "email_html_derived_text",
          method: "msgreader_html_to_text",
          processVersion: MSG_PROCESS_VERSION,
          text: derived,
          units: htmlUnits,
          createRetrievalUnits: true,
          attemptVersion: 1,
          limitation: "Deterministic HTML-to-text from recovered MSG HTML.",
        });
      }
    }

    const manifest =
      attachments.length === 0
        ? "MSG attachment manifest: none (or none recovered)"
        : `MSG attachment manifest (${attachments.length}):\n` +
          attachments
            .map(
              (a) =>
                `${a.ordinal}. ${a.filename} (${a.mimeType}, ${a.bytes.length} bytes)` +
                (a.limitation ? ` — ${a.limitation}` : "")
            )
            .join("\n");
    units.push({
      unitIndex: units.length,
      content: manifest,
      contentPreview: manifest.slice(0, 240),
      locator: {
        kind: "email_attachment",
        label: "MSG attachment manifest",
        section: "attachment_manifest",
      },
    });
    derivatives.push({
      representationKind: "email_attachment_manifest",
      method: "msgreader_attachment_manifest",
      processVersion: MSG_PROCESS_VERSION,
      text: manifest,
      units: [
        {
          unitIndex: 0,
          content: manifest,
          contentPreview: manifest.slice(0, 240),
          locator: {
            kind: "email_attachment",
            label: "MSG attachment manifest",
            section: "attachment_manifest",
          },
        },
      ],
      createRetrievalUnits: true,
      attemptVersion: 1,
      limitation: "Attachment content is ingested as separate child sources when bytes recovered.",
    });

    // Stable per-attachment locator stubs (metadata; content is child source)
    for (const a of attachments) {
      units.push({
        unitIndex: units.length,
        content: `MSG attachment ${a.ordinal}: ${a.filename} (${a.mimeType}, ${a.bytes.length} bytes) — content is a child source, not parent body.`,
        contentPreview: `MSG attachment ${a.ordinal}: ${a.filename}`,
        locator: {
          kind: "email_attachment",
          label: `MSG attachment ${a.ordinal}`,
          section: "attachment_meta",
          partPath: a.mimePartPath,
        },
      });
    }

    const urls = extractHttpUrls(body);
    if (urls.length) {
      limitations.push(
        `External URL(s) noted but not fetched: ${urls.slice(0, 5).join(", ")}.`
      );
    }
    if (unavailable.length) {
      limitations.push(`Unavailable/limited MSG fields: ${unavailable.join(", ")}.`);
    }

    const indexed = units.map((u, i) => ({ ...u, unitIndex: i }));
    return {
      status: indexed.some((u) => u.locator?.section !== "attachment_meta")
        ? "extracted"
        : "failed",
      method: "msgreader",
      mimeType: "application/vnd.ms-outlook",
      representationKind: "email_plain_text",
      processVersion: MSG_PROCESS_VERSION,
      text: derivatives.map((d) => `[${d.representationKind}]\n${d.text}`).join("\n\n"),
      units: indexed,
      limitation: limitations.join(" "),
      coverage: {
        blocksExtracted: indexed.length,
        note: "msg derivatives separate; HTML/RTF/headers may be unavailable",
      },
      derivatives: derivatives.map((d) => ({
        ...d,
        units: d.units.map((u, i) => ({ ...u, unitIndex: i })),
      })),
      attachments,
      emailMetadata: {
        format: "msg",
        subject: data.subject,
        from,
        to,
        cc,
        date: data.clientSubmitTime
          ? data.clientSubmitTime instanceof Date
            ? data.clientSubmitTime.toISOString()
            : String(data.clientSubmitTime)
          : undefined,
        messageId: data.messageId,
        headersSummary: props,
        hasHtml: Boolean(data.bodyHtml),
        hasPlain: Boolean(body),
        quoteBoundaryHeuristic: quoteHeuristic,
        externalUrlsNoted: urls,
        unavailableFields: unavailable,
      },
    };
  } catch (err) {
    return {
      status: "blocked_corrupt",
      method: "msgreader",
      mimeType: "application/vnd.ms-outlook",
      processVersion: MSG_PROCESS_VERSION,
      limitation: `MSG parsing blocked/failed: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved when stored; not retrieval-ready.`,
      emailMetadata: {
        format: "msg",
        unavailableFields: ["parse_failed"],
      },
    };
  }
}

function gotName(meta: { fileName?: string }): string | undefined {
  return meta.fileName;
}
