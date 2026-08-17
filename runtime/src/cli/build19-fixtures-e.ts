/**
 * Generate Build 19 Checkpoint E synthetic email fixtures (not Andrew’s mailbox).
 *   npm run knowledge:fixtures-e
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(__dirname, "../../../knowledge/import/seed-build19-e");

function b64(buf: Buffer): string {
  return buf.toString("base64");
}

function writeSharedAttachment(): Buffer {
  const path = resolve(outRoot, "attachments/shared-note.txt");
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from(
    "Build19 E shared attachment TOKEN-SHARED-ATTACH exact hash twin.\n",
    "utf8"
  );
  writeFileSync(path, bytes);
  return bytes;
}

function writeUnsupportedAttachment(): Buffer {
  const path = resolve(outRoot, "attachments/unsupported.xyz");
  const bytes = Buffer.from("not-a-supported-format TOKEN-UNSUPPORTED-ATT", "utf8");
  writeFileSync(path, bytes);
  return bytes;
}

function buildMultipartEml(opts: {
  messageId: string;
  subject: string;
  bodyToken: string;
  sharedAtt: Buffer;
  unsupportedAtt: Buffer;
  changedShared?: boolean;
}): string {
  const shared = opts.changedShared
    ? Buffer.from("CHANGED shared attachment TOKEN-CHANGED-ATTACH different hash.\n", "utf8")
    : opts.sharedAtt;
  const boundary = "----=_ApexOS_Build19E_Boundary";
  const altBoundary = "----=_ApexOS_Build19E_Alt";
  const plain = [
    `Build19 E plain body ${opts.bodyToken}`,
    "This is the operator-visible plain text part.",
    "",
    "On Mon, 1 Jan 2024, someone@example.com wrote:",
    "> Quoted prior note TOKEN-QUOTE-EML",
    "> evidence precedes inference",
    "",
    "Do not fetch https://example.com/remote-not-fetched-e",
  ].join("\r\n");
  const html = [
    "<html><body>",
    `<p>Build19 E HTML body ${opts.bodyToken}-HTML</p>`,
    "<p>Distinct from plain text.</p>",
    "<p>Link <a href=\"https://example.com/html-remote-not-fetched\">example</a></p>",
    "</body></html>",
  ].join("");

  return [
    "From: sender@example.com",
    "To: to-user@example.com",
    "Cc: cc-user@example.com",
    `Subject: ${opts.subject}`,
    "Date: Mon, 11 Aug 2025 12:00:00 +0000",
    `Message-ID: <${opts.messageId}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    plain,
    "",
    `--${altBoundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${altBoundary}--`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; name=\"shared-note.txt\"",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"shared-note.txt\"",
    "",
    b64(shared),
    "",
    `--${boundary}`,
    "Content-Type: application/octet-stream; name=\"unsupported.xyz\"",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"unsupported.xyz\"",
    "",
    b64(opts.unsupportedAtt),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function main(): void {
  mkdirSync(resolve(outRoot, "eml"), { recursive: true });
  mkdirSync(resolve(outRoot, "msg"), { recursive: true });
  mkdirSync(resolve(outRoot, "attachments"), { recursive: true });

  const shared = writeSharedAttachment();
  const unsupported = writeUnsupportedAttachment();

  const eml1 = buildMultipartEml({
    messageId: "build19e-1@apexos.test",
    subject: "Build19 E multipart TOKEN-EML-1",
    bodyToken: "TOKEN-EML-BODY-1",
    sharedAtt: shared,
    unsupportedAtt: unsupported,
  });
  writeFileSync(resolve(outRoot, "eml/multipart-with-attachments.eml"), eml1);

  const eml2 = buildMultipartEml({
    messageId: "build19e-2@apexos.test",
    subject: "Build19 E second parent TOKEN-EML-2",
    bodyToken: "TOKEN-EML-BODY-2",
    sharedAtt: shared,
    unsupportedAtt: unsupported,
  });
  writeFileSync(resolve(outRoot, "eml/second-parent-shared-attachment.eml"), eml2);

  // Exact duplicate of eml1
  writeFileSync(resolve(outRoot, "eml/multipart-with-attachments-duplicate.eml"), eml1);

  const emlChanged = buildMultipartEml({
    messageId: "build19e-3@apexos.test",
    subject: "Build19 E changed attachment TOKEN-EML-3",
    bodyToken: "TOKEN-EML-BODY-3",
    sharedAtt: shared,
    unsupportedAtt: unsupported,
    changedShared: true,
  });
  writeFileSync(resolve(outRoot, "eml/changed-attachment-same-name.eml"), emlChanged);

  writeFileSync(
    resolve(outRoot, "eml/corrupt-malformed.eml"),
    Buffer.from("this is not a valid rfc822 message\x00\x01\x02", "binary")
  );

  // URL-only note for explicit no-fetch proof (also present in multipart)
  writeFileSync(
    resolve(outRoot, "eml/url-no-fetch.eml"),
    [
      "From: url@example.com",
      "To: to@example.com",
      "Subject: Build19 E URL no-fetch TOKEN-URL-EML",
      "Date: Mon, 11 Aug 2025 13:00:00 +0000",
      "Message-ID: <build19e-url@apexos.test>",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Please see https://example.com/must-not-be-fetched-by-apexos TOKEN-URL-BODY",
      "",
    ].join("\r\n")
  );

  // Truncated MSG for parser-failure case
  const goodMsg = resolve(outRoot, "msg/outlook-with-attachment.msg");
  if (existsSync(goodMsg)) {
    const bytes = readFileSync(goodMsg);
    writeFileSync(resolve(outRoot, "msg/truncated-corrupt.msg"), bytes.subarray(0, 64));
  }

  writeFileSync(
    resolve(outRoot, "README.md"),
    [
      "# Build 19 Checkpoint E — synthetic email fixtures",
      "",
      "Not Andrew’s mailbox or architecture attachments.",
      "Outlook-generated: `msg/outlook-with-attachment.msg`",
      "Regenerate EML with: `npm run knowledge:fixtures-e`",
      "",
    ].join("\n")
  );

  console.log("Wrote Build 19 Checkpoint E fixtures under", outRoot);
}

main();
