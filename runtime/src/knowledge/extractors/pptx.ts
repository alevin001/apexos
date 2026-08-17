import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import type { ExtractionResult, RetrievalUnitDraft, SourceLocator } from "../types.js";

export const PPTX_PROCESS_VERSION = "build19-native-pptx-1.0";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  textNodeName: "#text",
});

function collectText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
    if ("t" in obj) return collectText(obj.t);
    return Object.values(obj).map(collectText).join("");
  }
  return "";
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function slideNumberFromPath(path: string): number | null {
  const m = path.match(/ppt\/slides\/slide(\d+)\.xml$/i);
  return m ? Number(m[1]) : null;
}

function notesNumberFromPath(path: string): number | null {
  const m = path.match(/ppt\/notesSlides\/notesSlide(\d+)\.xml$/i);
  return m ? Number(m[1]) : null;
}

/**
 * Native PPTX OOXML extraction with slide/notes/table locators.
 * Visual-only content is disclosed as deferred to later vision checkpoint.
 */
export async function extractPptxNative(bytes: Buffer): Promise<ExtractionResult> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const slidePaths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
      .sort((a, b) => (slideNumberFromPath(a) ?? 0) - (slideNumberFromPath(b) ?? 0));

    if (slidePaths.length === 0) {
      return {
        status: "failed",
        method: "native_pptx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        representationKind: "deterministic_parser",
        processVersion: PPTX_PROCESS_VERSION,
        limitation:
          "PPTX contains no slide XML — unreadable or corrupt. Original preserved; not retrieval-ready.",
      };
    }

    const units: RetrievalUnitDraft[] = [];
    const locators: SourceLocator[] = [];
    const limitations: string[] = [
      "Native PPTX text extraction only — charts, SmartArt meaning, screenshots, scanned pages, and other visual-only content are not interpreted.",
      "Vision-derived extraction for visual-only slides/elements is deferred to a later checkpoint.",
    ];
    let slidesWithText = 0;
    let visualOnlySlides = 0;

    for (const slidePath of slidePaths) {
      const slideNum = slideNumberFromPath(slidePath)!;
      const xml = await zip.file(slidePath)!.async("string");
      const parsed = xmlParser.parse(xml);

      // Plain text runs (a:t)
      const slideText = normalize(collectText(parsed));
      // Detect tables
      const tableMatches = [...xml.matchAll(/<(?:a:)?graphicData\b[\s\S]*?<\/(?:a:)?graphicData>/g)];
      const tblMatches = [...xml.matchAll(/<(?:a:)?tbl\b[\s\S]*?<\/(?:a:)?tbl>/g)];

      let slideHadText = false;

      if (slideText) {
        // Split crude paragraphs by double spaces remaining after normalize — keep as one slide body unit plus notes separately
        const locator: SourceLocator = {
          kind: "pptx_slide",
          label: `PPTX slide ${slideNum}`,
          slide: slideNum,
          page: slideNum,
        };
        locators.push(locator);
        units.push({
          unitIndex: units.length,
          content: slideText,
          contentPreview: slideText.slice(0, 240),
          locator,
        });
        slideHadText = true;
      }

      tblMatches.forEach((match, tableIndex) => {
        const frag = xmlParser.parse(`<root>${match[0]}</root>`);
        const rows = frag?.root?.tbl?.tr
          ? Array.isArray(frag.root.tbl.tr)
            ? frag.root.tbl.tr
            : [frag.root.tbl.tr]
          : [];
        rows.forEach((tr: unknown, rowIndex: number) => {
          const cells = (tr as { tc?: unknown }).tc;
          const cellList = cells ? (Array.isArray(cells) ? cells : [cells]) : [];
          cellList.forEach((tc: unknown, cellIndex: number) => {
            const text = normalize(collectText(tc));
            if (!text) return;
            // Avoid duplicating if already in slideText-only unit excessively — still emit cell locators for fidelity
            const locator: SourceLocator = {
              kind: "pptx_cell",
              label: `PPTX slide ${slideNum} table ${tableIndex + 1} row ${rowIndex + 1} cell ${cellIndex + 1}`,
              slide: slideNum,
              page: slideNum,
              tableIndex,
              rowIndex,
              cellIndex,
            };
            locators.push(locator);
            units.push({
              unitIndex: units.length,
              content: text,
              contentPreview: text.slice(0, 240),
              locator,
            });
            slideHadText = true;
          });
        });
      });

      // Speaker notes for this slide (by conventional numbering)
      const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
      const notesFile = zip.file(notesPath);
      if (notesFile) {
        const notesXml = await notesFile.async("string");
        const notesText = normalize(collectText(xmlParser.parse(notesXml)));
        // Notes often include slide body echo — still store as notes locator
        if (notesText) {
          const locator: SourceLocator = {
            kind: "pptx_notes",
            label: `PPTX slide ${slideNum} speaker notes`,
            slide: slideNum,
            page: slideNum,
            section: "speaker_notes",
          };
          locators.push(locator);
          units.push({
            unitIndex: units.length,
            content: notesText,
            contentPreview: notesText.slice(0, 240),
            locator,
          });
          slideHadText = true;
        }
      }

      // Image presence without text → visual-only disclosure
      const hasImage = /<(?:a:|p:)?blip\b/i.test(xml) || /image\//i.test(xml);
      if (!slideHadText) {
        visualOnlySlides += 1;
        limitations.push(
          `Slide ${slideNum}: no reliable native text extracted${
            hasImage ? " (visual/image content present)" : ""
          }; vision-derived extraction deferred — not claimed extracted or understood.`
        );
      } else {
        slidesWithText += 1;
        if (hasImage) {
          limitations.push(
            `Slide ${slideNum}: contains image(s); native text extracted where available, but visual meaning is not interpreted (vision deferred).`
          );
        }
      }

      void tableMatches;
    }

    // Orphan notes files
    const notesPaths = Object.keys(zip.files).filter((p) =>
      /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(p)
    );
    for (const np of notesPaths) {
      const n = notesNumberFromPath(np);
      if (n == null) continue;
      const already = units.some((u) => u.locator?.kind === "pptx_notes" && u.locator.slide === n);
      if (already) continue;
      const notesText = normalize(collectText(xmlParser.parse(await zip.file(np)!.async("string"))));
      if (!notesText) continue;
      const locator: SourceLocator = {
        kind: "pptx_notes",
        label: `PPTX slide ${n} speaker notes`,
        slide: n,
        page: n,
        section: "speaker_notes",
      };
      locators.push(locator);
      units.push({
        unitIndex: units.length,
        content: notesText,
        contentPreview: notesText.slice(0, 240),
        locator,
      });
    }

    if (units.length === 0) {
      return {
        status: "failed",
        method: "native_pptx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        representationKind: "deterministic_parser",
        processVersion: PPTX_PROCESS_VERSION,
        limitation: [
          "No native PPTX text extracted (possible visual-only deck). Original preserved; not retrieval-ready. Vision-derived extraction deferred.",
          ...limitations,
        ].join(" "),
        coverage: {
          slidesExtracted: 0,
          slidesTotal: slidePaths.length,
          note: `${visualOnlySlides} visual-only/empty slide(s)`,
        },
        units: [],
      };
    }

    return {
      status: "extracted",
      method: "native_pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      representationKind: "deterministic_parser",
      processVersion: PPTX_PROCESS_VERSION,
      text: units.map((u) => `[${u.locator?.label}]\n${u.content}`).join("\n\n"),
      units,
      locators,
      limitation: [...new Set(limitations)].join(" "),
      coverage: {
        slidesExtracted: slidesWithText,
        slidesTotal: slidePaths.length,
        note: `${visualOnlySlides} slide(s) without native text`,
      },
    };
  } catch (err) {
    return {
      status: "failed",
      method: "native_pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      representationKind: "deterministic_parser",
      processVersion: PPTX_PROCESS_VERSION,
      limitation: `PPTX native extraction failed: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved; not retrieval-ready.`,
    };
  }
}
