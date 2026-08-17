/**
 * Build 19 technical spikes — synthetic fixtures only.
 * Does not import Andrew’s real library.
 *
 *   npm run knowledge:spike-build19
 *
 * Live OpenAI vision requires OPENAI_API_KEY in .env / .env.local.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import msgMod from "@kenjiuno/msgreader";
import { runtimeConfig } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const spikeRoot = resolve(repoRoot, "knowledge/import/seed-build19-spike");

type SpikeResult = Record<string, unknown>;

async function spikePdf(): Promise<SpikeResult> {
  const pdfPath = resolve(spikeRoot, "pdf/native-text-spike.pdf");
  if (!existsSync(pdfPath)) {
    return { ok: false, error: `Missing fixture ${pdfPath}` };
  }
  const bytes = readFileSync(pdfPath);
  const parser = new PDFParse({ data: bytes });
  try {
    const text = await parser.getText();
    return {
      ok: true,
      library: "pdf-parse@2.4.5",
      pages: text?.total ?? null,
      textPreview: (text?.text || "").slice(0, 200),
      hasExpectedPhrase:
        (text?.text || "").includes("Build19") || (text?.text || "").includes("ApexOS"),
    };
  } finally {
    await parser.destroy?.();
  }
}

function spikeMsg(): SpikeResult {
  const msgPath = resolve(spikeRoot, "msg/sample-spike.msg");
  if (!existsSync(msgPath)) {
    return { ok: false, error: `Missing fixture ${msgPath}` };
  }
  const MsgReader = (msgMod as { default?: unknown }).default ?? msgMod;
  if (typeof MsgReader !== "function") {
    return { ok: false, error: "MsgReader constructor not found (ESM interop)" };
  }
  const bytes = readFileSync(msgPath);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reader = new (MsgReader as any)(bytes);
  const data = reader.getFileData();
  return {
    ok: true,
    library: "@kenjiuno/msgreader@1.28.0",
    subject: data.subject ?? null,
    bodyPreview: (data.body || "").slice(0, 200),
    recipientCount: Array.isArray(data.recipients) ? data.recipients.length : 0,
    attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0,
  };
}

async function spikeVision(): Promise<SpikeResult> {
  const key = runtimeConfig.openaiApiKey;
  const imgPath = resolve(spikeRoot, "image/diagram-spike.png");
  if (!key) {
    return {
      ok: false,
      blocker: "OPENAI_API_KEY not configured",
      note: "Live vision acceptance remains mandatory; configure .env.local and re-run.",
      fixture: imgPath,
    };
  }
  if (!existsSync(imgPath)) {
    return { ok: false, error: `Missing fixture ${imgPath}` };
  }
  const b64 = readFileSync(imgPath).toString("base64");
  const model = runtimeConfig.openaiModel;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Transcribe any visible text. Separately give one short visual description. Label each part clearly.",
            },
            { type: "input_image", image_url: `data:image/png;base64,${b64}` },
          ],
        },
      ],
    }),
  });
  const body = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    model,
    processVersion: "build19-vision-spike-1.0",
    bodyPreview: body.slice(0, 800),
  };
}

async function main(): Promise<void> {
  const out = {
    generatedAt: new Date().toISOString(),
    spikeRoot,
    pdf: await spikePdf().catch((e) => ({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })),
    msg: (() => {
      try {
        return spikeMsg();
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    })(),
    vision: await spikeVision().catch((e) => ({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })),
  };

  const outDir = resolve(repoRoot, "build");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "build-19-spike-results.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);

  if (!(out.pdf as { ok?: boolean }).ok || !(out.msg as { ok?: boolean }).ok) {
    process.exitCode = 1;
  }
  if (!(out.vision as { ok?: boolean }).ok) {
    console.error("\nBLOCKER: live OpenAI vision spike did not succeed (required for final acceptance).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
