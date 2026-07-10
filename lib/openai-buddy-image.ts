import type { BuddyAnalysis } from "./buddy-analysis";

export type GenerateBuddyImageRequestInput = {
  analysis: BuddyAnalysis;
  model: string;
};

export function buildBuddyImagePrompt(analysis: BuddyAnalysis) {
  const markings =
    analysis.markings.length > 0 ? analysis.markings.join(", ") : "simple soft details";

  return [
    "Create a cute soft 2D plush character sticker for a virtual pet app named Dear Buddy.",
    `The character is based on this uploaded beloved object: ${analysis.displayLabel}.`,
    `Detected species or motif: ${analysis.species}.`,
    `Key visible traits to preserve: ${markings}.`,
    `Use these colors as the main palette: primary ${analysis.primaryColor}, secondary ${analysis.secondaryColor}, accent ${analysis.accentColor}.`,
    `Personality: ${analysis.personality}.`,
    "Art direction: soft 2D plush character sticker, round oversized head, tiny body, short soft limbs, gentle face, small glossy eyes, subtle fabric texture, stitched toy charm, warm and lovable, polished mobile game asset.",
    "Composition: centered full body character, transparent background, no text, no logo, no frame, no realistic photo background, no scary expression.",
  ].join(" ");
}

export function getGenerateBuddyImageRequestPayload({
  analysis,
  model,
}: GenerateBuddyImageRequestInput) {
  return {
    model,
    prompt: buildBuddyImagePrompt(analysis),
    size: "1024x1024",
    output_format: "png",
    quality: "medium",
  } as const;
}

export function extractGeneratedImageDataUrl(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("생성 이미지를 읽지 못했습니다.");
  }

  const data = (response as { data?: unknown }).data;

  if (!Array.isArray(data)) {
    throw new Error("생성 이미지를 읽지 못했습니다.");
  }

  const first = data[0];

  if (!first || typeof first !== "object") {
    throw new Error("생성 이미지를 읽지 못했습니다.");
  }

  const b64Json = (first as { b64_json?: unknown }).b64_json;

  if (typeof b64Json !== "string" || b64Json.trim().length === 0) {
    throw new Error("생성 이미지를 읽지 못했습니다.");
  }

  return `data:image/png;base64,${b64Json}`;
}
