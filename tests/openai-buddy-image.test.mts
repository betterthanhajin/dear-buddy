import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBuddyImagePrompt,
  extractGeneratedImageDataUrl,
  getGenerateBuddyImageRequestPayload,
} from "../lib/openai-buddy-image.ts";

const analysis = {
  species: "seal" as const,
  displayLabel: "하얀 물개 인형",
  confidence: 0.91,
  primaryColor: "#f7f2ea",
  secondaryColor: "#cfd8dc",
  accentColor: "#6b7280",
  earStyle: "none" as const,
  muzzleStyle: "round" as const,
  bodyShape: "oval" as const,
  markings: ["작은 검은 코", "짧은 지느러미"],
  personality: "느긋하고 폭신함",
};

test("buildBuddyImagePrompt asks for a cute plush sticker while preserving detected traits", () => {
  const prompt = buildBuddyImagePrompt(analysis);

  assert.match(prompt, /하얀 물개 인형/);
  assert.match(prompt, /작은 검은 코/);
  assert.match(prompt, /짧은 지느러미/);
  assert.match(prompt, /soft 2D plush character sticker/);
  assert.doesNotMatch(prompt, /svg/i);
});

test("getGenerateBuddyImageRequestPayload requests a PNG image model result", () => {
  const payload = getGenerateBuddyImageRequestPayload({
    analysis,
    model: "gpt-image-1",
  });

  assert.equal(payload.model, "gpt-image-1");
  assert.equal(payload.size, "1024x1024");
  assert.equal(payload.output_format, "png");
  assert.match(payload.prompt, /transparent background/);
});

test("extractGeneratedImageDataUrl converts b64_json image output to a data URL", () => {
  const dataUrl = extractGeneratedImageDataUrl({
    data: [{ b64_json: "abc123" }],
  });

  assert.equal(dataUrl, "data:image/png;base64,abc123");
});
