import { PDFParse } from "pdf-parse";
import { getVisionProvider } from "../vision/provider.js";
import { VISION_PROCESS_VERSION } from "../vision/versions.js";
import type {
  DerivedExtractionDraft,
  ExtractionResult,
  PageCoverageEntry,
  RetrievalUnitDraft,
  SourceLocator,
} from "../types.js";
import { PDF_PROCESS_VERSION } from "./pdf.js";

/** Minimum trimmed character count to treat a page as having sufficient native text. */
export const NATIVE_TEXT_SUFFICIENT_CHARS = 40;

export function hasSufficientNativeText(text: string): boolean {
  return text.replace(/\s+/g, " ").trim().length >= NATIVE_TEXT_SUFFICIENT_CHARS;
}

/**
 * Native-first PDF extraction with governed vision only for text-missing pages.
 * Native and vision derivatives remain separate — never silently merged.
 */
export async function extractPdfGoverned(
  bytes: Buffer,
  opts?: { enableVision?: boolean }
): Promise<ExtractionResult> {
  const enableVision = opts?.enableVision !== false;
  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({ data: bytes });
    const textResult = await parser.getText();
    const pages = textResult.pages ?? [];
    const total = textResult.total ?? pages.length;

    const nativeUnits: RetrievalUnitDraft[] = [];
    const visionUnits: RetrievalUnitDraft[] = [];
    const pageCoverage: PageCoverageEntry[] = [];
    const limitations: string[] = [
      "PDF handling is format-specific (not an Office document).",
      "Native PDF text extraction — reading order/layout may differ from visual appearance.",
      "Native and vision-derived page texts are separate derived representations — not silently merged.",
    ];
    let visionInvoked = false;
    let visionModel: string | undefined;
    let visionProvider: string | undefined;
    const pagesNeedingVision: number[] = [];

    for (const page of pages) {
      const nativeText = (page.text ?? "").replace(/\r\n/g, "\n").trim();
      const sufficient = hasSufficientNativeText(nativeText);
      const locator: SourceLocator = {
        kind: "pdf_page",
        label: `PDF page ${page.num}`,
        page: page.num,
      };

      if (sufficient) {
        nativeUnits.push({
          unitIndex: nativeUnits.length,
          content: nativeText,
          contentPreview: nativeText.slice(0, 240),
          locator: { ...locator, section: "native" },
        });
        pageCoverage.push({
          page: page.num,
          status: "native",
          methods: ["native"],
          nativeCharCount: nativeText.length,
        });
      } else {
        pagesNeedingVision.push(page.num);
        if (nativeText) {
          // Keep sparse native text separately if any, marked partial
          nativeUnits.push({
            unitIndex: nativeUnits.length,
            content: nativeText,
            contentPreview: nativeText.slice(0, 240),
            locator: { ...locator, section: "native_sparse" },
          });
        }
      }
    }

    if (pagesNeedingVision.length && enableVision) {
      visionInvoked = true;
      const provider = getVisionProvider();
      visionProvider = provider.name;

      for (const pageNum of pagesNeedingVision) {
        const locator: SourceLocator = {
          kind: "pdf_page",
          label: `PDF page ${pageNum}`,
          page: pageNum,
        };
        try {
          const shot = await parser.getScreenshot({
            partial: [pageNum],
            imageBuffer: true,
            scale: 1.5,
          });
          const pageShot = shot.pages?.[0];
          const img = pageShot?.data;
          if (!img || img.length === 0) {
            pageCoverage.push({
              page: pageNum,
              status: "blocked",
              methods: [],
              nativeCharCount: 0,
              limitation: "Could not render page for vision.",
            });
            limitations.push(`PDF page ${pageNum}: vision blocked (render failed).`);
            continue;
          }

          const result = await provider.analyze({
            kind: "transcription",
            imageBytes: Buffer.from(img),
            mimeType: "image/png",
            locatorLabel: locator.label,
            contextNote: "Scanned or text-missing PDF page — transcription only.",
          });
          visionModel = result.model;

          if (!result.ok || !result.text?.trim()) {
            pageCoverage.push({
              page: pageNum,
              status: "blocked",
              methods: [],
              nativeCharCount: 0,
              limitation: result.limitation ?? result.error,
            });
            limitations.push(
              `PDF page ${pageNum}: ${result.limitation ?? "vision extraction blocked"}.`
            );
            continue;
          }

          const visionText = result.text.trim();
          const partial = /\[unreadable\]/i.test(visionText);

          visionUnits.push({
            unitIndex: visionUnits.length,
            content: visionText,
            contentPreview: visionText.slice(0, 240),
            locator: {
              ...locator,
              section: "vision_transcription",
            },
          });

          const hadSparseNative = nativeUnits.some(
            (u) => u.locator?.page === pageNum && u.locator?.section === "native_sparse"
          );
          pageCoverage.push({
            page: pageNum,
            status: partial ? "partial" : hadSparseNative ? "both_separate" : "vision_derived",
            methods: hadSparseNative
              ? ["native", "vision_transcription"]
              : ["vision_transcription"],
            nativeCharCount: hadSparseNative
              ? nativeUnits.find((u) => u.locator?.page === pageNum)?.content.length
              : 0,
            visionCharCount: visionText.length,
            limitation: result.limitation,
          });
        } catch (err) {
          pageCoverage.push({
            page: pageNum,
            status: "blocked",
            methods: [],
            limitation: err instanceof Error ? err.message : String(err),
          });
          limitations.push(
            `PDF page ${pageNum}: vision failed (${err instanceof Error ? err.message : String(err)}).`
          );
        }
      }
    } else if (pagesNeedingVision.length && !enableVision) {
      for (const pageNum of pagesNeedingVision) {
        pageCoverage.push({
          page: pageNum,
          status: "unavailable",
          methods: [],
          limitation: "Vision disabled for this run.",
        });
      }
      limitations.push(
        `${pagesNeedingVision.length} page(s) lack sufficient native text; vision was not invoked.`
      );
    }

    // Ensure every page appears in coverage
    for (let p = 1; p <= total; p++) {
      if (!pageCoverage.some((c) => c.page === p)) {
        pageCoverage.push({
          page: p,
          status: "unavailable",
          methods: [],
          limitation: "Page missing from parser output.",
        });
      }
    }
    pageCoverage.sort((a, b) => a.page - b.page);

    const derivatives: DerivedExtractionDraft[] = [];
    if (nativeUnits.length) {
      // Re-index
      const units = nativeUnits.map((u, i) => ({ ...u, unitIndex: i }));
      derivatives.push({
        representationKind: "deterministic_parser",
        method: "native_pdf",
        processVersion: PDF_PROCESS_VERSION,
        text: units.map((u) => `[${u.locator?.label} native]\n${u.content}`).join("\n\n"),
        units,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation:
          "Native PDF text extraction — reading order/layout may differ from visual appearance.",
        coverage: {
          pagesExtracted: units.length,
          pagesTotal: total,
          pageCoverage,
          note: "native derivative only",
        },
      });
    }

    if (visionUnits.length) {
      const units = visionUnits.map((u, i) => ({ ...u, unitIndex: i }));
      derivatives.push({
        representationKind: "vision_transcription",
        method: "vision_pdf_page",
        processVersion: VISION_PROCESS_VERSION,
        providerName: visionProvider,
        providerModel: visionModel,
        promptVersion: "build19-vision-schema-1.0",
        text: units
          .map((u) => `[${u.locator?.label} vision-derived transcription]\n${u.content}`)
          .join("\n\n"),
        units,
        createRetrievalUnits: true,
        attemptVersion: 1,
        limitation:
          "Vision-derived transcription of text-missing pages — not independent verification of meaning; not a finding.",
        coverage: {
          pagesExtracted: units.length,
          pagesTotal: total,
          pageCoverage,
          note: "vision transcription derivative only",
        },
      });
    }

    const confirmedUnitCount =
      (derivatives.find((d) => d.representationKind === "deterministic_parser")?.units.length ??
        0) +
      (derivatives.find((d) => d.representationKind === "vision_transcription")?.units.length ?? 0);

    const allPagesOk = pageCoverage.every(
      (c) => c.status === "native" || c.status === "vision_derived" || c.status === "both_separate"
    );
    const anyVisionPartial = pageCoverage.some((c) => c.status === "partial");
    const anyBlocked = pageCoverage.some(
      (c) => c.status === "blocked" || c.status === "unavailable"
    );

    if (allPagesOk && pageCoverage.length > 0) {
      limitations.push(
        `Page coverage confirmed for all ${pageCoverage.length} page(s); methods reported per page.`
      );
    } else if (!allPagesOk) {
      limitations.push(
        "Source is not fully extracted — retrieval availability limited to confirmed units with visible page coverage."
      );
    }
    if (visionInvoked) {
      limitations.push(
        `Vision invoked for ${pagesNeedingVision.length} text-missing page(s) only; pages with sufficient native text were not sent to vision.`
      );
    } else {
      limitations.push("Vision was not invoked — all pages had sufficient native text or vision was disabled.");
    }

    const status: ExtractionResult["status"] =
      confirmedUnitCount === 0
        ? anyBlocked
          ? "failed"
          : "failed"
        : anyBlocked || anyVisionPartial || !allPagesOk
          ? "extracted"
          : "extracted";

    const combinedUnits: RetrievalUnitDraft[] = [];
    for (const d of derivatives) {
      if (!d.createRetrievalUnits) continue;
      for (const u of d.units) {
        combinedUnits.push({
          ...u,
          unitIndex: combinedUnits.length,
          content:
            d.representationKind === "vision_transcription"
              ? `[vision-derived transcription]\n${u.content}`
              : u.content,
        });
      }
    }

    return {
      status,
      method: visionInvoked ? "native_pdf+vision" : "native_pdf",
      mimeType: "application/pdf",
      representationKind: visionInvoked ? "vision_transcription" : "deterministic_parser",
      processVersion: visionInvoked
        ? `${PDF_PROCESS_VERSION}+${VISION_PROCESS_VERSION}`
        : PDF_PROCESS_VERSION,
      text: combinedUnits.map((u) => `[${u.locator?.label}]\n${u.content}`).join("\n\n"),
      units: combinedUnits,
      limitation: limitations.join(" "),
      coverage: {
        pagesExtracted: pageCoverage.filter((c) =>
          ["native", "vision_derived", "both_separate", "partial"].includes(c.status)
        ).length,
        pagesTotal: total,
        pageCoverage,
        note: visionInvoked
          ? "hybrid/scanned handling with separate native and vision derivatives"
          : "native-only; vision not invoked",
      },
      pageCoverage,
      pageCoverageComplete: allPagesOk && pageCoverage.length > 0,
      derivatives,
      visionInvoked,
      providerModel: visionModel,
      providerName: visionProvider,
    };
  } catch (err) {
    return {
      status: "failed",
      method: "native_pdf+vision",
      mimeType: "application/pdf",
      representationKind: "deterministic_parser",
      processVersion: PDF_PROCESS_VERSION,
      limitation: `PDF governed extraction failed: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved; not retrieval-ready.`,
    };
  } finally {
    await parser?.destroy?.();
  }
}
