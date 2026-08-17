import ExcelJS from "exceljs";
import type { ExtractionResult, RetrievalUnitDraft, SourceLocator } from "../types.js";

export const XLSX_PROCESS_VERSION = "build19-native-xlsx-1.0";

function colLetter(col: number): string {
  let n = col;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || "A";
}

/**
 * Native XLSX extraction — values and formulas distinct; no recalculation.
 */
export async function extractXlsxNative(bytes: Buffer): Promise<ExtractionResult> {
  try {
    const workbook = new ExcelJS.Workbook();
    // exceljs types accept Buffer via Uint8Array
    await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);

    const units: RetrievalUnitDraft[] = [];
    const locators: SourceLocator[] = [];
    const limitations: string[] = [
      "Native XLSX extraction preserves stored values and formula text distinctly.",
      "Formulas are not recalculated; cached values are not independently verified.",
    ];
    let sheetsExtracted = 0;
    const sheetsTotal = workbook.worksheets.length;

    for (const sheet of workbook.worksheets) {
      const hidden = sheet.state === "hidden" || sheet.state === "veryHidden";
      let sheetHadContent = false;

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const addr = `${colLetter(colNumber)}${rowNumber}`;
          const formula =
            typeof cell.formula === "string"
              ? cell.formula
              : typeof (cell as { value?: { formula?: string } }).value === "object" &&
                  cell.value &&
                  typeof cell.value === "object" &&
                  "formula" in (cell.value as object)
                ? String((cell.value as { formula: string }).formula)
                : undefined;

          let cachedValue: string | undefined;
          if (cell.value != null) {
            if (typeof cell.value === "object" && "result" in (cell.value as object)) {
              const result = (cell.value as { result?: unknown }).result;
              cachedValue = result == null ? undefined : String(result);
            } else if (!formula) {
              cachedValue = String(cell.text ?? cell.value);
            } else if (cell.text) {
              cachedValue = String(cell.text);
            }
          }

          const parts: string[] = [`Sheet: ${sheet.name}`, `Cell: ${addr}`];
          if (formula) parts.push(`Formula: =${formula}`);
          if (cachedValue != null && cachedValue !== "") {
            parts.push(`Cached value: ${cachedValue}`);
          } else if (formula) {
            parts.push("Cached value: (none — not independently verified; formula not recalculated)");
          } else {
            return;
          }
          if (hidden) parts.push("Sheet visibility: hidden");

          const content = parts.join("\n");
          const locator: SourceLocator = {
            kind: "xlsx_range",
            label: `XLSX ${sheet.name}!${addr}`,
            sheet: sheet.name,
            range: addr,
            formula: formula ? `=${formula}` : undefined,
            cachedValue,
            sheetHidden: hidden || undefined,
          };
          locators.push(locator);
          units.push({
            unitIndex: units.length,
            content,
            contentPreview: content.slice(0, 240),
            locator,
          });
          sheetHadContent = true;
        });
      });

      if (sheetHadContent) sheetsExtracted += 1;
      if (hidden) {
        limitations.push(`Sheet “${sheet.name}” is hidden; content extracted with visibility disclosed.`);
      }
    }

    if (units.length === 0) {
      return {
        status: "failed",
        method: "native_xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        representationKind: "deterministic_parser",
        processVersion: XLSX_PROCESS_VERSION,
        limitation:
          "No cell values/formulas extracted from XLSX. Original preserved; not retrieval-ready.",
        coverage: { sheetsExtracted: 0, sheetsTotal, note: "empty workbook" },
        units: [],
      };
    }

    return {
      status: "extracted",
      method: "native_xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      representationKind: "deterministic_parser",
      processVersion: XLSX_PROCESS_VERSION,
      text: units.map((u) => `[${u.locator?.label}]\n${u.content}`).join("\n\n"),
      units,
      locators,
      limitation: limitations.join(" "),
      coverage: {
        sheetsExtracted,
        sheetsTotal,
        note: "one retrieval unit per non-empty cell; formula vs cached value distinct",
      },
    };
  } catch (err) {
    return {
      status: "failed",
      method: "native_xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      representationKind: "deterministic_parser",
      processVersion: XLSX_PROCESS_VERSION,
      limitation: `XLSX native extraction failed: ${
        err instanceof Error ? err.message : String(err)
      }. Original preserved; not retrieval-ready.`,
    };
  }
}
