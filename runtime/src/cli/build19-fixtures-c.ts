/**
 * Generate Build 19 Checkpoint C synthetic fixtures (not Andrew’s library).
 *   npm run knowledge:fixtures-c
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import pptxgenMod from "pptxgenjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(__dirname, "../../../knowledge/import/seed-build19-c");

function writePdfMultiPage(path: string): void {
  // Minimal 3-page PDF with distinct per-page text
  const pages = [
    "Build19 PDF page 1 — leadership conflict operating note",
    "Build19 PDF page 2 — evidence precedes inference",
    "Build19 PDF page 3 — retrieval is not authority",
  ];
  const objs: string[] = [];
  objs.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objs.push(`2 0 obj<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>endobj\n`);

  let body = "";
  let objNum = 3;
  const offsets: number[] = [0];
  const header = "%PDF-1.4\n";
  let cursor = header.length;

  const pieces: string[] = [header];
  const add = (s: string) => {
    offsets.push(cursor);
    pieces.push(s);
    cursor += s.length;
  };

  // We'll rebuild properly
  const contentStreams = pages.map((text) => {
    const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
    return stream;
  });

  let pdf = "%PDF-1.4\n";
  const xref: number[] = [];
  const out: string[] = [];
  const pushObj = (content: string) => {
    xref.push(Buffer.byteLength(pdf, "utf8"));
    pdf += content;
  };

  pushObj("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  const pageObjNums = pages.map((_, i) => 3 + i * 2);
  const contentObjNums = pages.map((_, i) => 4 + i * 2);
  pushObj(
    `2 0 obj<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>endobj\n`
  );
  // Font object after pages
  const fontObj = 3 + pages.length * 2;
  for (let i = 0; i < pages.length; i++) {
    const pageNo = pageObjNums[i];
    const contentNo = contentObjNums[i];
    pushObj(
      `${pageNo} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNo} 0 R /Resources<< /Font<< /F1 ${fontObj} 0 R >> >> >>endobj\n`
    );
    const stream = contentStreams[i];
    pushObj(
      `${contentNo} 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`
    );
  }
  pushObj(
    `${fontObj} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n`
  );

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${fontObj + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 0; i < xref.length; i++) {
    pdf += `${String(xref[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${fontObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  writeFileSync(path, pdf, "utf8");
  void out;
  void add;
  void body;
  void objNum;
  void objs;
}

async function writeDocx(path: string): Promise<void> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.folder("word")!.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Build19 DOCX body — healthy conflict requires direct conversation.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Second paragraph — evidence must precede inference.</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Owner</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Commitment</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Drew</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Bring agenda token CELL-ALPHA</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:sectPr/>
  </w:body>
</w:document>`
  );
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  writeFileSync(path, buf);
}

async function writeXlsx(path: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const summary = wb.addWorksheet("Summary");
  summary.getCell("A1").value = "Metric";
  summary.getCell("B1").value = "Value";
  summary.getCell("A2").value = "Meetings";
  summary.getCell("B2").value = 3;
  summary.getCell("A3").value = "Total";
  summary.getCell("B3").value = { formula: "B2*2", result: 6 };

  const detail = wb.addWorksheet("Detail");
  detail.getCell("A1").value = "Item";
  detail.getCell("B1").value = "Notes";
  detail.getCell("A2").value = "TOKEN-SHEET2";
  detail.getCell("B2").value = "Multi-sheet proof";
  // Formula without cached result
  detail.getCell("C2").value = { formula: "A2&\"-EXT\"" };

  const hidden = wb.addWorksheet("HiddenAudit");
  hidden.state = "hidden";
  hidden.getCell("A1").value = "HIDDEN-ROW";

  await wb.xlsx.writeFile(path);
}

async function writePptx(path: string): Promise<void> {
  // CJS/ESM interop for pptxgenjs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = ((pptxgenMod as any).default ?? pptxgenMod) as new () => any;
  const pptx = new Ctor();
  pptx.author = "ApexOS Build19";
  pptx.title = "Build19 PPTX fixture";

  const s1 = pptx.addSlide();
  s1.addText("Build19 PPTX Title — Operating Cadence", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24 });
  s1.addText("Body text: meetings rotate ownership weekly. TOKEN-SLIDE1", {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 1,
    fontSize: 16,
  });
  s1.addNotes("Speaker notes for slide 1 — emphasize evidence before inference. NOTES-SLIDE1");

  const s2 = pptx.addSlide();
  s2.addText("Slide 2 table", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 20 });
  s2.addTable(
    [
      [
        { text: "Role", options: { bold: true } },
        { text: "Action", options: { bold: true } },
      ],
      ["Jesse", "Bring TOKEN-TABLE-CELL"],
    ],
    { x: 0.5, y: 1.2, w: 8, h: 1.5 }
  );
  s2.addNotes("Notes slide 2");

  const s3 = pptx.addSlide();
  s3.addShape(pptx.ShapeType.roundRect, {
    x: 1,
    y: 1,
    w: 6,
    h: 2,
    fill: { color: "DDDDDD" },
  });
  s3.addText("Shape text TOKEN-SHAPE", { x: 1.2, y: 1.6, w: 5.5, h: 0.6, fontSize: 16 });

  const s4 = pptx.addSlide();
  // Visual-only: image without accompanying narrative text claim
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  s4.addImage({ data: `image/png;base64,${png.toString("base64")}`, x: 2, y: 2, w: 2, h: 2 });

  await pptx.writeFile({ fileName: path });
}

async function main(): Promise<void> {
  mkdirSync(resolve(outRoot, "pdf"), { recursive: true });
  mkdirSync(resolve(outRoot, "docx"), { recursive: true });
  mkdirSync(resolve(outRoot, "xlsx"), { recursive: true });
  mkdirSync(resolve(outRoot, "pptx"), { recursive: true });
  mkdirSync(resolve(outRoot, "corrupt"), { recursive: true });

  writePdfMultiPage(resolve(outRoot, "pdf/multi-page-native.pdf"));
  await writeDocx(resolve(outRoot, "docx/with-table.docx"));
  await writeXlsx(resolve(outRoot, "xlsx/multi-sheet-formulas.xlsx"));
  await writePptx(resolve(outRoot, "pptx/multi-slide.pptx"));
  writeFileSync(resolve(outRoot, "corrupt/broken.docx"), Buffer.from("not-a-real-docx"));
  writeFileSync(resolve(outRoot, "corrupt/broken.pdf"), Buffer.from("not-a-pdf"));
  writeFileSync(
    resolve(outRoot, "README.md"),
    `# Build 19 Checkpoint C fixtures\n\nSynthetic only — not Andrew’s library.\n`
  );
  console.log(`Wrote fixtures under ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
