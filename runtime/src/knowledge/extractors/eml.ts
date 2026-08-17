import PostalMime from "postal-mime";
import type {
  AttachmentDraft,
  DerivedExtractionDraft,
  ExtractionResult,
  RetrievalUnitDraft,
} from "../types.js";
import {
  EML_PROCESS_VERSION,
  chunkBlocks,
  extractHttpUrls,
  htmlToTextDeterministic,
  safeFilename,
  splitQuotedCorrespondence,
  unitsFromBlocks,
} from "./email-shared.js";

/**
 * Deterministic RFC 822 / MIME .eml extraction.
 * Never uses OpenAI. Never fetches remote URLs or cloud attachments.
 */
export async function extractEml(bytes: Buffer): Promise<ExtractionResult> {
  try {
    const parser = new PostalMime();
    const mail = await parser.parse(bytes);

    const attachments: AttachmentDraft[] = [];
    let attOrdinal = 0;
    for (const att of mail.attachments ?? []) {
      attOrdinal += 1;
      const content = att.content
        ? Buffer.isBuffer(att.content)
          ? att.content
          : Buffer.from(att.content as ArrayBuffer)
        : Buffer.alloc(0);
      const filename = safeFilename(
        att.filename || undefined,
        `attachment-${attOrdinal}.bin`
      );
      attachments.push({
        ordinal: attOrdinal,
        filename,
        mimeType: att.mimeType || "application/octet-stream",
        bytes: content,
        contentId: att.contentId || undefined,
        inline: att.disposition === "inline" || Boolean(att.contentId),
        mimePartPath: att.contentId ? `cid:${att.contentId}` : `attachment-${attOrdinal}`,
        limitation:
          content.length === 0
            ? "Attachment part present but empty content bytes."
            : undefined,
      });
    }

    const derivatives: DerivedExtractionDraft[] = [];
    const units: RetrievalUnitDraft[] = [];
    const limitations: string[] = [
      "Deterministic RFC 822/MIME parsing (postal-mime). No remote URL or cloud-file fetch.",
      "Sender/subject/title confer no authority. Quoted text is not automatically truth.",
    ];

    const from =
      mail.from?.address ||
      (mail.from?.name ? String(mail.from.name) : undefined) ||
      undefined;
    const to = (mail.to ?? [])
      .map((a) => a.address || a.name)
      .filter((x): x is string => Boolean(x));
    const cc = (mail.cc ?? [])
      .map((a) => a.address || a.name)
      .filter((x): x is string => Boolean(x));
    const bcc = (mail.bcc ?? [])
      .map((a) => a.address || a.name)
      .filter((x): x is string => Boolean(x));

    const headerLines = [
      mail.subject ? `Subject: ${mail.subject}` : null,
      from ? `From: ${from}` : null,
      to.length ? `To: ${to.join(", ")}` : null,
      cc.length ? `Cc: ${cc.join(", ")}` : null,
      bcc.length ? `Bcc: ${bcc.join(", ")}` : null,
      mail.date ? `Date: ${mail.date}` : null,
      mail.messageId ? `Message-ID: ${mail.messageId}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (headerLines) {
      const headerUnits = [
        {
          unitIndex: 0,
          content: headerLines,
          contentPreview: headerLines.slice(0, 240),
          locator: {
            kind: "email_headers" as const,
            label: "EML headers",
            section: "headers",
          },
        },
      ];
      units.push(...headerUnits);
      derivatives.push({
        representationKind: "email_headers",
        method: "deterministic_eml_headers",
        processVersion: EML_PROCESS_VERSION,
        text: headerLines,
        units: headerUnits,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation:
          "Header metadata only — absence of Bcc is not evidence that no Bcc existed.",
      });
    }

    let quoteHeuristic = false;
    const plain = mail.text?.replace(/\r\n/g, "\n").trim() ?? "";
    if (plain) {
      const split = splitQuotedCorrespondence(plain);
      quoteHeuristic = quoteHeuristic || split.heuristic;
      const partPath = "1.1";
      const mainBlocks = chunkBlocks(split.main);
      const plainUnits = unitsFromBlocks(mainBlocks, {
        kind: "email_section",
        labelPrefix: `EML plain-text body, part ${partPath}`,
        section: "plain_text",
        partPath,
      }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
      units.push(...plainUnits);
      derivatives.push({
        representationKind: "email_plain_text",
        method: "deterministic_eml_plain",
        processVersion: EML_PROCESS_VERSION,
        text: split.main,
        units: plainUnits,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation: "Original plain-text body part — not HTML.",
        coverage: { blocksExtracted: plainUnits.length },
      });

      if (split.quoted) {
        const qBlocks = chunkBlocks(split.quoted);
        const qUnits = unitsFromBlocks(qBlocks, {
          kind: "email_section",
          labelPrefix: `EML quoted correspondence, part ${partPath}`,
          section: "quoted_heuristic",
          partPath,
        }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
        units.push(...qUnits);
        derivatives.push({
          representationKind: "email_quoted",
          method: "deterministic_eml_quoted_heuristic",
          processVersion: EML_PROCESS_VERSION,
          text: split.quoted,
          units: qUnits,
          createRetrievalUnits: true,
          attemptVersion: 1,
          limitation:
            "Quoted correspondence boundary detected heuristically; complete plain body also retained separately.",
        });
        limitations.push(
          "Quote-boundary detection is heuristic; full plain-text body representation is retained."
        );
      }
    }

    const html = mail.html?.trim() ?? "";
    if (html) {
      derivatives.push({
        representationKind: "email_html",
        method: "deterministic_eml_html",
        processVersion: EML_PROCESS_VERSION,
        text: html,
        units: [],
        createRetrievalUnits: false,
        attemptVersion: 1,
        limitation:
          "Raw HTML body preserved as a separate derivative — not collapsed into plain text.",
      });
      const derived = htmlToTextDeterministic(html);
      if (derived) {
        const partPath = "1.2";
        const split = splitQuotedCorrespondence(derived);
        quoteHeuristic = quoteHeuristic || split.heuristic;
        const blocks = chunkBlocks(split.main);
        const htmlUnits = unitsFromBlocks(blocks, {
          kind: "email_section",
          labelPrefix: `EML HTML-derived text, part ${partPath}`,
          section: "html_derived_text",
          partPath,
        }).map((u, i) => ({ ...u, unitIndex: units.length + i }));
        units.push(...htmlUnits);
        derivatives.push({
          representationKind: "email_html_derived_text",
          method: "deterministic_eml_html_to_text",
          processVersion: EML_PROCESS_VERSION,
          text: split.main,
          units: htmlUnits,
          createRetrievalUnits: true,
          attemptVersion: 1,
          limitation:
            "Deterministic HTML-to-text derivative — distinct from original plain text; not a finding.",
        });
      }
    }

    const manifestLines = attachments.map(
      (a) =>
        `${a.ordinal}. ${a.filename} (${a.mimeType}, ${a.bytes.length} bytes` +
        `${a.inline ? ", inline" : ""}${a.contentId ? `, cid=${a.contentId}` : ""})` +
        (a.limitation ? ` — ${a.limitation}` : "")
    );
    const manifestText =
      manifestLines.length > 0
        ? `Attachment manifest (${attachments.length}):\n${manifestLines.join("\n")}`
        : "Attachment manifest: none";
    derivatives.push({
      representationKind: "email_attachment_manifest",
      method: "deterministic_eml_attachment_manifest",
      processVersion: EML_PROCESS_VERSION,
      text: manifestText,
      units: [
        {
          unitIndex: 0,
          content: manifestText,
          contentPreview: manifestText.slice(0, 240),
          locator: {
            kind: "email_attachment",
            label: "EML attachment manifest",
            section: "attachment_manifest",
          },
        },
      ],
      createRetrievalUnits: true,
      attemptVersion: 1,
      limitation:
        "Attachment manifest metadata only — attachment content is separate child sources.",
    });
    units.push({
      unitIndex: units.length,
      content: manifestText,
      contentPreview: manifestText.slice(0, 240),
      locator: {
        kind: "email_attachment",
        label: "EML attachment manifest",
        section: "attachment_manifest",
      },
    });

    const urls = extractHttpUrls([plain, html].filter(Boolean).join("\n"));
    if (urls.length) {
      limitations.push(
        `External URL(s) noted but not fetched: ${urls.slice(0, 5).join(", ")}.`
      );
    }
    if (!bcc.length) {
      limitations.push(
        "No Bcc field present in this source — that is not evidence that no Bcc recipient existed."
      );
    }

    // Re-index units
    const indexed = units.map((u, i) => ({ ...u, unitIndex: i }));

    return {
      status: indexed.length > 0 ? "extracted" : "failed",
      method: "deterministic_eml",
      mimeType: "message/rfc822",
      representationKind: "email_plain_text",
      processVersion: EML_PROCESS_VERSION,
      text: derivatives.map((d) => `[${d.representationKind}]\n${d.text}`).join("\n\n"),
      units: indexed,
      limitation: limitations.join(" "),
      coverage: {
        blocksExtracted: indexed.length,
        note: "email derivatives kept separate (plain/html/quoted/headers/manifest)",
      },
      derivatives: derivatives.map((d) => ({
        ...d,
        units: d.units.map((u, i) => ({ ...u, unitIndex: i })),
      })),
      attachments,
      emailMetadata: {
        format: "eml",
        subject: mail.subject || undefined,
        from,
        to,
        cc,
        bcc: bcc.length ? bcc : undefined,
        date: mail.date || undefined,
        messageId: mail.messageId || undefined,
        headersSummary: headerLines,
        hasHtml: Boolean(html),
        hasPlain: Boolean(plain),
        quoteBoundaryHeuristic: quoteHeuristic,
        externalUrlsNoted: urls,
      },
    };
  } catch (err) {
    return {
      status: "blocked_corrupt",
      method: "deterministic_eml",
      mimeType: "message/rfc822",
      representationKind: "email_plain_text",
      processVersion: EML_PROCESS_VERSION,
      limitation: `EML parsing blocked/unreadable: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved when stored; not retrieval-ready.`,
    };
  }
}
