import { PDFParse } from "pdf-parse";
import type { ExtractionResult, RetrievalUnitDraft, SourceLocator } from "../types.js";

export const PDF_PROCESS_VERSION = "build19-native-pdf-1.0";

/**
 * Native PDF text extraction with page-level locators.
 * Does not OCR scanned pages — empty pages are reported as coverage limitations.
 */
export async function extractPdfNative(bytes: Buffer): Promise<ExtractionResult> {
  let parser: PDFParse | undefined;
  try {
    parser = new PDFParse({ data: bytes });
    const result = await parser.getText();
    const pages = result.pages ?? [];
    const total = result.total ?? pages.length;
    const units: RetrievalUnitDraft[] = [];
    const locators: SourceLocator[] = [];
    let pagesWithText = 0;

    for (const page of pages) {
      const text = (page.text ?? "").replace(/\r\n/g, "\n").trim();
      const locator: SourceLocator = {
        kind: "pdf_page",
        label: `PDF page ${page.num}`,
        page: page.num,
      };
      locators.push(locator);
      if (!text) continue;
      pagesWithText += 1;
      units.push({
        unitIndex: units.length,
        content: text,
        contentPreview: text.slice(0, 240),
        locator,
      });
    }

    const limitations: string[] = [
      "Native PDF text extraction only — reading order/layout may differ from visual appearance.",
      "Headers/footers/columns may interleave; material layout loss is possible.",
    ];
    if (pagesWithText < total) {
      limitations.push(
        `${total - pagesWithText} of ${total} page(s) had no extractable native text (scanned/image-only pages require later vision-derived extraction).`
      );
    }

    if (units.length === 0) {
      return {
        status: "failed",
        method: "native_pdf",
        mimeType: "application/pdf",
        representationKind: "deterministic_parser",
        processVersion: PDF_PROCESS_VERSION,
        limitation:
          "No native text extracted from PDF. Original preserved; not retrieval-ready. Vision/OCR deferred.",
        coverage: {
          pagesExtracted: 0,
          pagesTotal: total,
          note: "zero native text pages",
        },
        units: [],
      };
    }

    return {
      status: "extracted",
      method: "native_pdf",
      mimeType: "application/pdf",
      representationKind: "deterministic_parser",
      processVersion: PDF_PROCESS_VERSION,
      text: units.map((u) => `[${u.locator?.label}]\n${u.content}`).join("\n\n"),
      units,
      locators,
      limitation: limitations.join(" "),
      coverage: {
        pagesExtracted: pagesWithText,
        pagesTotal: total,
        note: "one retrieval unit per page with native text; pages are not silently merged",
      },
    };
  } catch (err) {
    return {
      status: "failed",
      method: "native_pdf",
      mimeType: "application/pdf",
      representationKind: "deterministic_parser",
      processVersion: PDF_PROCESS_VERSION,
      limitation: `PDF native extraction failed: ${err instanceof Error ? err.message : String(err)}. Original preserved; not retrieval-ready.`,
    };
  } finally {
    await parser?.destroy?.();
  }
}
