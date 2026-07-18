import assert from "node:assert/strict";
import test from "node:test";

import {
  BUDDY_ACTION_IMAGE_KEYS,
  buildBuddyImagePrompt,
  extractGeneratedActionImages,
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

test("buildBuddyImagePrompt asks for a cute pixel art buddy while preserving detected traits", () => {
  const prompt = buildBuddyImagePrompt(analysis);

  assert.match(prompt, /하얀 물개 인형/);
  assert.match(prompt, /작은 검은 코/);
  assert.match(prompt, /짧은 지느러미/);
  assert.match(prompt, /pixel art virtual pet sprite/);
  assert.match(prompt, /soft pixel art/);
  assert.match(prompt, /no text/i);
  assert.match(prompt, /no letters/i);
  assert.match(prompt, /no logo/i);
  assert.match(prompt, /no app name/i);
  assert.doesNotMatch(prompt, /Dear Buddy/);
  assert.doesNotMatch(prompt, /svg/i);
});

test("buildBuddyImagePrompt adds action-specific pose direction", () => {
  assert.match(buildBuddyImagePrompt(analysis, "idle"), /neutral idle pose/i);
  assert.match(buildBuddyImagePrompt(analysis, "pet"), /being gently petted/i);
  assert.match(buildBuddyImagePrompt(analysis, "feed"), /eating a tiny snack/i);
  assert.match(buildBuddyImagePrompt(analysis, "play"), /playful jump/i);
  assert.match(buildBuddyImagePrompt(analysis, "rest"), /sleepy resting pose/i);
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

test("extractGeneratedActionImages converts multiple image outputs to an action image map", () => {
  const actionImages = extractGeneratedActionImages(
    {
      data: [
        { b64_json: "idle-image" },
        { b64_json: "pet-image" },
        { b64_json: "feed-image" },
        { b64_json: "play-image" },
        { b64_json: "rest-image" },
      ],
    },
    BUDDY_ACTION_IMAGE_KEYS,
  );

  assert.deepEqual(actionImages, {
    idle: "data:image/png;base64,idle-image",
    pet: "data:image/png;base64,pet-image",
    feed: "data:image/png;base64,feed-image",
    play: "data:image/png;base64,play-image",
    rest: "data:image/png;base64,rest-image",
  });
});
