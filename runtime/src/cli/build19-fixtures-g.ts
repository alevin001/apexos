/**
 * Build 19 Checkpoint G — controlled synthetic staging corpus (not Andrew’s library).
 *   npm run knowledge:fixtures-g
 *
 * Assembles one mixed-format tree under knowledge/import/seed-build19-g/
 * by regenerating/copying synthetic fixtures only.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import pptxgenMod from "pptxgenjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(__dirname, "../../../knowledge/import/seed-build19-g");
const seedD = resolve(__dirname, "../../../knowledge/import/seed-build19-d");
const seedE = resolve(__dirname, "../../../knowledge/import/seed-build19-e");

function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true });
}

function b64(buf: Buffer): string {
  return buf.toString("base64");
}

async function writeNativePdf(path: string): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText("Build19 G native PDF TOKEN-G-NATIVE-PDF evidence precedes inference", {
    x: 72,
    y: 720,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  writeFileSync(path, await doc.save());
}

async function writeScannedPdf(path: string): Promise<void> {
  const scanPng = resolve(seedD, "pdf/_scan_page1.png");
  if (!existsSync(scanPng)) {
    writeFileSync(path, Buffer.from("%PDF-1.4\n%scan-placeholder\n"));
    return;
  }
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(readFileSync(scanPng));
  const page = doc.addPage([612, 792]);
  page.drawImage(img, {
    x: 36,
    y: 200,
    width: 540,
    height: 540 * (img.height / img.width),
  });
  writeFileSync(path, await doc.save());
}

async function writeDocx(path: string): Promise<void> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Build19 G DOCX TOKEN-G-DOCX paragraph one.</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>ColA</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>TOKEN-G-DOCX-TABLE</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`
  );
  writeFileSync(path, await zip.generateAsync({ type: "nodebuffer" }));
}

async function writeXlsx(path: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const visible = wb.addWorksheet("Visible");
  visible.getCell("A1").value = "Build19 G XLSX TOKEN-G-XLSX-SHEET1";
  visible.getCell("B1").value = { formula: "1+1", result: 2 };
  const hidden = wb.addWorksheet("HiddenFacts");
  hidden.state = "hidden";
  hidden.getCell("A1").value = "TOKEN-G-XLSX-HIDDEN disclosed as hidden sheet";
  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  writeFileSync(path, buf);
}

async function writePptx(path: string): Promise<void> {
  const PptxGenJS = (pptxgenMod as { default?: new () => {
    addSlide: () => { addText: (t: string, o?: object) => void };
    write: (o: { outputType: string }) => Promise<Uint8Array>;
  } }).default ?? pptxgenMod;
  const pptx = new (PptxGenJS as new () => {
    addSlide: () => { addText: (t: string, o?: object) => void };
    write: (o: { outputType: string }) => Promise<Uint8Array>;
  })();
  const slide = pptx.addSlide();
  slide.addText("Build19 G PPTX TOKEN-G-PPTX-SLIDE1", { x: 0.5, y: 0.5, w: 9, h: 1 });
  const out = await pptx.write({ outputType: "nodebuffer" });
  writeFileSync(path, Buffer.from(out as Uint8Array));
}

function writeEml(path: string, opts: {
  messageId: string;
  subject: string;
  bodyToken: string;
  shared: Buffer;
  unsupported: Buffer;
}): void {
  const boundary = "----=_ApexOS_Build19G_Boundary";
  const plain = [
    `Build19 G plain body ${opts.bodyToken}`,
    "Do not fetch https://example.com/g-remote-not-fetched",
    "",
  ].join("\r\n");
  const eml = [
    "From: g-sender@example.com",
    "To: g-to@example.com",
    `Subject: ${opts.subject}`,
    "Date: Sun, 9 Aug 2026 12:00:00 +0000",
    `Message-ID: <${opts.messageId}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    plain,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; name=\"g-shared-note.txt\"",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"g-shared-note.txt\"",
    "",
    b64(opts.shared),
    "",
    `--${boundary}`,
    "Content-Type: application/octet-stream; name=\"g-unsupported.xyz\"",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"g-unsupported.xyz\"",
    "",
    b64(opts.unsupported),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
  writeFileSync(path, eml);
}

async function main(): Promise<void> {
  ensureDir(resolve(outRoot, "text"));
  ensureDir(resolve(outRoot, "pdf"));
  ensureDir(resolve(outRoot, "docx"));
  ensureDir(resolve(outRoot, "xlsx"));
  ensureDir(resolve(outRoot, "pptx"));
  ensureDir(resolve(outRoot, "image"));
  ensureDir(resolve(outRoot, "eml"));
  ensureDir(resolve(outRoot, "msg"));
  ensureDir(resolve(outRoot, "duplicates"));
  ensureDir(resolve(outRoot, "corrupt"));
  ensureDir(resolve(outRoot, "legacy"));
  ensureDir(resolve(outRoot, "mailbox"));
  ensureDir(resolve(outRoot, "system"));

  writeFileSync(
    resolve(outRoot, "text/operating-note.txt"),
    "Build19 G UTF-8 text TOKEN-G-TEXT leadership operating note. Retrieval is not authority.\n"
  );

  await writeNativePdf(resolve(outRoot, "pdf/native-text.pdf"));
  await writeScannedPdf(resolve(outRoot, "pdf/scanned-vision.pdf"));
  await writeDocx(resolve(outRoot, "docx/with-table.docx"));
  await writeXlsx(resolve(outRoot, "xlsx/multi-sheet.xlsx"));
  await writePptx(resolve(outRoot, "pptx/slides.pptx"));

  const diagramSrc = resolve(seedD, "image/diagram-with-labels.png");
  if (existsSync(diagramSrc)) {
    copyFileSync(diagramSrc, resolve(outRoot, "image/diagram-with-labels.png"));
  } else {
    // Minimal PNG header-ish placeholder — vision tests use D fixtures when present
    writeFileSync(resolve(outRoot, "image/diagram-with-labels.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  }

  const shared = Buffer.from(
    "Build19 G shared attachment TOKEN-G-SHARED-ATTACH exact hash twin.\n",
    "utf8"
  );
  const unsupported = Buffer.from("not-supported TOKEN-G-UNSUPPORTED-ATT", "utf8");

  writeEml(resolve(outRoot, "eml/multipart-with-attachments.eml"), {
    messageId: "build19g-1@apexos.test",
    subject: "Build19 G multipart TOKEN-G-EML-1",
    bodyToken: "TOKEN-G-EML-BODY-1",
    shared,
    unsupported,
  });
  writeEml(resolve(outRoot, "eml/second-parent-shared-attachment.eml"), {
    messageId: "build19g-2@apexos.test",
    subject: "Build19 G second parent TOKEN-G-EML-2",
    bodyToken: "TOKEN-G-EML-BODY-2",
    shared,
    unsupported,
  });

  const msgSrc = resolve(seedE, "msg/outlook-with-attachment.msg");
  if (existsSync(msgSrc)) {
    copyFileSync(msgSrc, resolve(outRoot, "msg/outlook-with-attachment.msg"));
  } else {
    writeFileSync(
      resolve(outRoot, "msg/outlook-with-attachment.msg"),
      Buffer.from("MSG-PLACEHOLDER-NOT-OUTLOOK")
    );
  }

  // Exact duplicate top-level file in a different intake path
  copyFileSync(
    resolve(outRoot, "text/operating-note.txt"),
    resolve(outRoot, "duplicates/operating-note-copy.txt")
  );

  // Same-named file with changed bytes
  writeFileSync(
    resolve(outRoot, "duplicates/operating-note.txt"),
    "Build19 G CHANGED same-name TOKEN-G-TEXT-CHANGED different bytes — no inferred replace lineage.\n"
  );

  writeFileSync(resolve(outRoot, "corrupt/broken.pdf"), Buffer.from("%PDF-1.4\nbroken"));
  writeFileSync(resolve(outRoot, "legacy/old-deck.ppt"), Buffer.from("LEGACY-PPT-BINARY-TOKEN-G"));
  writeFileSync(resolve(outRoot, "mailbox/archive.pst"), Buffer.from("PST-CONTAINER-DEFERRED-TOKEN-G"));
  writeFileSync(resolve(outRoot, "mailbox/archive.ost"), Buffer.from("OST-CONTAINER-DEFERRED-TOKEN-G"));

  // Deterministic excluded system/sidecar (visibly recorded)
  writeFileSync(resolve(outRoot, "system/Thumbs.db"), Buffer.from("thumbs-sidecar"));
  writeFileSync(resolve(outRoot, "system/note.meta.md"), "# sidecar meta — excluded\n");
  writeFileSync(
    resolve(outRoot, "README.md"),
    [
      "# Build 19 Checkpoint G — synthetic batch staging corpus",
      "",
      "Not Andrew’s library. Controlled synthetic tokens only.",
      "Regenerate with: `npm run knowledge:fixtures-g`",
      "",
    ].join("\n")
  );

  console.log("Wrote Build 19 Checkpoint G fixtures under", outRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
