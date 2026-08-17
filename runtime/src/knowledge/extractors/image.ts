import { getVisionProvider } from "../vision/provider.js";
import { groundVisualDescription, VISUAL_DESCRIPTION_WITHHELD } from "../vision/grounding.js";
import { VISION_PROCESS_VERSION } from "../vision/versions.js";
import type { DerivedExtractionDraft, ExtractionResult, SourceLocator } from "../types.js";

/**
 * Governed image/diagram extraction:
 * - vision-derived transcription (may become retrieval units)
 * - separately labeled vision-derived visual description (stored, not cited as evidence units)
 */
export async function extractImageGoverned(
  bytes: Buffer,
  mimeType: string,
  opts?: { filename?: string }
): Promise<ExtractionResult> {
  const locator: SourceLocator = {
    kind: "image",
    label: opts?.filename ? `Image ${opts.filename}` : "Image",
  };
  const provider = getVisionProvider();
  const limitations: string[] = [
    "Image/diagram handling preserves the exact original raster.",
    "Vision transcription and visual description are separate derived representations.",
    "Visual description must not be treated as an interpretation of meaning.",
  ];

  const transcription = await provider.analyze({
    kind: "transcription",
    imageBytes: bytes,
    mimeType,
    locatorLabel: locator.label,
    contextNote: "Raster image/diagram — transcribe visible text only.",
  });

  const description = await provider.analyze({
    kind: "visual_description",
    imageBytes: bytes,
    mimeType,
    locatorLabel: locator.label,
    contextNote: "Describe visible arrangement only — no strategic meaning.",
  });

  const derivatives: DerivedExtractionDraft[] = [];
  const units = [];

  if (transcription.ok && transcription.text?.trim()) {
    const text = transcription.text.trim();
    const partial = /\[unreadable\]/i.test(text);
    units.push({
      unitIndex: 0,
      content: `[vision-derived transcription]\n${text}`,
      contentPreview: text.slice(0, 240),
      locator: { ...locator, section: "vision_transcription" },
    });
    derivatives.push({
      representationKind: "vision_transcription",
      method: "vision_image_transcription",
      processVersion: VISION_PROCESS_VERSION,
      providerName: transcription.provider,
      providerModel: transcription.model,
      promptVersion: transcription.promptVersion,
      text,
      units: [
        {
          unitIndex: 0,
          content: text,
          contentPreview: text.slice(0, 240),
          locator: { ...locator, section: "vision_transcription" },
        },
      ],
      createRetrievalUnits: true,
      attemptVersion: 1,
      responseId: transcription.responseId,
      limitation: partial
        ? "Partial transcription — unreadable regions noted; content was not invented."
        : "Vision-derived transcription — not independent verification of meaning.",
    });
    if (partial) {
      limitations.push("Transcription reported unreadable regions.");
    }
  } else {
    limitations.push(
      transcription.limitation ??
        "Vision transcription unavailable or failed — original preserved."
    );
  }

  if (description.ok && description.text?.trim()) {
    const transcriptionText =
      derivatives.find((d) => d.representationKind === "vision_transcription")?.text ?? "";
    const grounded = groundVisualDescription(description.text, { transcriptionText });
    const text = grounded.ok ? grounded.text : VISUAL_DESCRIPTION_WITHHELD;
    if (!grounded.ok) {
      limitations.push(
        "Visual description withheld—insufficient grounded detail (not stored as embellished layout)."
      );
    }
    derivatives.push({
      representationKind: "vision_visual_description",
      method: "vision_image_description",
      processVersion: VISION_PROCESS_VERSION,
      providerName: description.provider,
      providerModel: description.model,
      promptVersion: description.promptVersion,
      text,
      units: [],
      createRetrievalUnits: false,
      attemptVersion: 1,
      responseId: description.responseId,
      limitation:
        "Vision-derived visual description — objectively visible elements only; not a finding; not source-card input unless separately approved; never retrieval-cited.",
    });
  } else {
    derivatives.push({
      representationKind: "vision_visual_description",
      method: "vision_image_description",
      processVersion: VISION_PROCESS_VERSION,
      providerName: description.provider,
      providerModel: description.model,
      promptVersion: description.promptVersion,
      text: VISUAL_DESCRIPTION_WITHHELD,
      units: [],
      createRetrievalUnits: false,
      attemptVersion: 1,
      responseId: description.responseId,
      limitation:
        description.limitation ??
        "Vision visual description unavailable — withheld; not source-card input.",
    });
    limitations.push(
      description.limitation ?? "Vision visual description unavailable or failed."
    );
  }

  const status: ExtractionResult["status"] =
    units.length > 0 ? "extracted" : "failed";

  return {
    status,
    method: "vision_image",
    mimeType,
    representationKind: "vision_transcription",
    processVersion: VISION_PROCESS_VERSION,
    text: [
      ...derivatives
        .filter((d) => d.representationKind === "vision_transcription")
        .map((d) => `[vision-derived transcription]\n${d.text}`),
      ...derivatives
        .filter((d) => d.representationKind === "vision_visual_description")
        .map((d) => `[vision-derived visual description]\n${d.text}`),
    ].join("\n\n"),
    units,
    limitation: limitations.join(" "),
    coverage: {
      note:
        units.length > 0
          ? "transcription units available; visual description stored separately without citation units"
          : "no confirmed vision transcription units",
    },
    derivatives,
    visionInvoked: true,
    providerName: provider.name,
    providerModel: transcription.model ?? description.model,
  };
}
