/**
 * Generate Build 19 Checkpoint D synthetic fixtures (not Andrew’s library).
 *   npm run knowledge:fixtures-d
 *
 * Creates:
 * - native-text PDF (vision must not be needed)
 * - scanned multi-page PDF (image-only pages)
 * - hybrid PDF (native + scanned + mixed)
 * - diagram/image + partially obscured image (already present as PNG; verified)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(__dirname, "../../../knowledge/import/seed-build19-d");

async function writeNativePdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = [
    "Build19 D native page 1 — TOKEN-NATIVE-P1 leadership operating note",
    "Build19 D native page 2 — TOKEN-NATIVE-P2 evidence precedes inference",
    "Build19 D native page 3 — TOKEN-NATIVE-P3 retrieval is not authority",
  ];
  for (const text of pages) {
    const page = doc.addPage([612, 792]);
    page.drawText(text, { x: 72, y: 720, size: 12, font, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  const path = resolve(outRoot, "pdf/native-text-multi.pdf");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

async function writeScannedPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const p1 = readFileSync(resolve(outRoot, "pdf/_scan_page1.png"));
  const p2 = readFileSync(resolve(outRoot, "pdf/_scan_page2.png"));
  const img1 = await doc.embedPng(p1);
  const img2 = await doc.embedPng(p2);
  for (const img of [img1, img2]) {
    const page = doc.addPage([612, 792]);
    page.drawImage(img, {
      x: 36,
      y: 200,
      width: 540,
      height: 540 * (img.height / img.width),
    });
  }
  const bytes = await doc.save();
  writeFileSync(resolve(outRoot, "pdf/scanned-multipage.pdf"), bytes);
}

async function writeHybridPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const scan = await doc.embedPng(readFileSync(resolve(outRoot, "pdf/_hybrid_scan.png")));

  // Page 1 — native text only
  {
    const page = doc.addPage([612, 792]);
    page.drawText("Build19 D hybrid page 1 native — TOKEN-HYBRID-NATIVE", {
      x: 72,
      y: 720,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Page 2 — scanned image only (no text operators)
  {
    const page = doc.addPage([612, 792]);
    page.drawImage(scan, {
      x: 36,
      y: 220,
      width: 540,
      height: 540 * (scan.height / scan.width),
    });
  }

  // Page 3 — mixed: sparse native + image (native alone insufficient → vision path)
  {
    const page = doc.addPage([612, 792]);
    page.drawText("x", { x: 72, y: 740, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawImage(scan, {
      x: 36,
      y: 180,
      width: 540,
      height: 540 * (scan.height / scan.width),
    });
  }

  writeFileSync(resolve(outRoot, "pdf/hybrid-native-scan.pdf"), await doc.save());
}

async function writeManifest(): Promise<void> {
  const manifest = {
    checkpoint: "D",
    processVersion: "build19-vision-1.0",
    promptVersion: "build19-vision-schema-1.0",
    note: "Controlled synthetic fixtures only — not Andrew’s architecture library.",
    fixtures: [
      {
        path: "pdf/native-text-multi.pdf",
        expect: "vision not invoked; pageCoverage all native; locators PDF page 1..3",
        tokens: ["TOKEN-NATIVE-P1", "TOKEN-NATIVE-P2", "TOKEN-NATIVE-P3"],
      },
      {
        path: "pdf/scanned-multipage.pdf",
        expect: "vision for pages 1-2; locators PDF page N vision_transcription",
        tokens: ["TOKEN-SCAN-P1", "TOKEN-SCAN-P2"],
      },
      {
        path: "pdf/hybrid-native-scan.pdf",
        expect:
          "page1 native; page2 vision; page3 both_separate or vision; methods reported per page",
        tokens: ["TOKEN-HYBRID-NATIVE", "TOKEN-HYBRID-SCAN"],
      },
      {
        path: "image/diagram-with-labels.png",
        expect: "transcription distinct from visual description; Image locator",
        tokens: ["TOKEN-DIAGRAM-LABEL"],
      },
      {
        path: "image/partial-obscured.png",
        expect: "partial/review — [unreadable] allowed; no invented content",
        tokens: ["TOKEN-PARTIAL-EDGE"],
      },
    ],
  };
  writeFileSync(
    resolve(outRoot, "README.md"),
    [
      "# Build 19 Checkpoint D — controlled synthetic fixtures",
      "",
      "Not Andrew’s real architecture library. Do not ingest real-library files here.",
      "",
      "```json",
      JSON.stringify(manifest, null, 2),
      "```",
      "",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  mkdirSync(resolve(outRoot, "pdf"), { recursive: true });
  mkdirSync(resolve(outRoot, "image"), { recursive: true });
  await writeNativePdf();
  await writeScannedPdf();
  await writeHybridPdf();
  await writeManifest();
  console.log("Wrote Build 19 Checkpoint D fixtures under", outRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
