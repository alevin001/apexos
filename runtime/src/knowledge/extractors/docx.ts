import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import type { ExtractionResult, RetrievalUnitDraft, SourceLocator } from "../types.js";

export const DOCX_PROCESS_VERSION = "build19-native-docx-1.0";

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

function tableToUnits(
  tblXml: string,
  tableIndex: number,
  units: RetrievalUnitDraft[],
  locators: SourceLocator[]
): void {
  const parsed = xmlParser.parse(
    `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${tblXml}</root>`
  );
  const tbl = parsed?.root?.tbl;
  const rows = tbl?.tr ? (Array.isArray(tbl.tr) ? tbl.tr : [tbl.tr]) : [];
  rows.forEach((tr: unknown, rowIndex: number) => {
    const cells = (tr as { tc?: unknown }).tc;
    const cellList = cells ? (Array.isArray(cells) ? cells : [cells]) : [];
    cellList.forEach((tc: unknown, cellIndex: number) => {
      const text = normalize(collectText(tc));
      if (!text) return;
      const locator: SourceLocator = {
        kind: "docx_cell",
        label: `DOCX table ${tableIndex + 1} row ${rowIndex + 1} cell ${cellIndex + 1}`,
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
    });
  });
}

/**
 * Native DOCX OOXML extraction with paragraph/table/cell locators.
 * Headers, footers, text boxes, and floating objects are not fully extracted.
 */
export async function extractDocxNative(bytes: Buffer): Promise<ExtractionResult> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) {
      return {
        status: "failed",
        method: "native_docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        representationKind: "deterministic_parser",
        processVersion: DOCX_PROCESS_VERSION,
        limitation:
          "DOCX missing word/document.xml — unreadable or corrupt. Original preserved; not retrieval-ready.",
      };
    }

    const units: RetrievalUnitDraft[] = [];
    const locators: SourceLocator[] = [];
    let blockIndex = 0;
    let tableIndex = 0;

    const siblingMatches = [...docXml.matchAll(/<(?:w:)?(p|tbl)\b[\s\S]*?<\/(?:w:)?\1>/g)];
    for (const match of siblingMatches) {
      const tag = match[1];
      const fragment = match[0];
      if (tag === "p") {
        const fragParsed = xmlParser.parse(
          `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${fragment}</root>`
        );
        const text = normalize(collectText(fragParsed?.root?.p));
        if (text) {
          const locator: SourceLocator = {
            kind: "docx_block",
            label: `DOCX paragraph ${blockIndex + 1}`,
            blockIndex,
          };
          locators.push(locator);
          units.push({
            unitIndex: units.length,
            content: text,
            contentPreview: text.slice(0, 240),
            locator,
          });
        }
        blockIndex += 1;
      } else if (tag === "tbl") {
        tableToUnits(fragment, tableIndex, units, locators);
        tableIndex += 1;
      }
    }

    const hasHeader = Boolean(zip.file("word/header1.xml") || zip.file("word/header2.xml"));
    const hasFooter = Boolean(zip.file("word/footer1.xml") || zip.file("word/footer2.xml"));
    const limitations = [
      "Native DOCX body extraction — headers, footers, text boxes, floating objects, and complex formatting are omitted or incompletely represented.",
      "Material layout/positioning is not preserved; only ordered text and table cell values.",
    ];
    if (hasHeader || hasFooter) {
      limitations.push(
        "Document contains header/footer parts that were not extracted into retrieval units."
      );
    }

    if (units.length === 0) {
      return {
        status: "failed",
        method: "native_docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        representationKind: "deterministic_parser",
        processVersion: DOCX_PROCESS_VERSION,
        limitation:
          "No extractable paragraph/table text in DOCX body. Original preserved; not retrieval-ready.",
        coverage: { blocksExtracted: 0, note: "empty body text" },
        units: [],
      };
    }

    return {
      status: "extracted",
      method: "native_docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      representationKind: "deterministic_parser",
      processVersion: DOCX_PROCESS_VERSION,
      text: units.map((u) => `[${u.locator?.label}]\n${u.content}`).join("\n\n"),
      units,
      locators,
      limitation: limitations.join(" "),
      coverage: {
        blocksExtracted: units.length,
        note: `${blockIndex} paragraph slot(s); ${tableIndex} table(s)`,
      },
    };
  } catch (err) {
    return {
      status: "failed",
      method: "native_docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      representationKind: "deterministic_parser",
      processVersion: DOCX_PROCESS_VERSION,
      limitation: `DOCX native extraction failed: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved; not retrieval-ready.`,
    };
  }
}
