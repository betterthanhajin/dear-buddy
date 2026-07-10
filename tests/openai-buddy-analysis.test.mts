import assert from "node:assert/strict";
import test from "node:test";

import {
  extractResponseJsonText,
  getAnalyzeBuddyRequestPayload,
} from "../lib/openai-buddy-analysis.ts";

test("extractResponseJsonText reads the Responses API output_text content", () => {
  const text = extractResponseJsonText({
    output: [
      {
        content: [
          {
            type: "output_text",
            text: "{\"species\":\"seal\"}",
          },
        ],
      },
    ],
  });

  assert.equal(text, "{\"species\":\"seal\"}");
});

test("extractResponseJsonText falls back to output_text shortcut", () => {
  assert.equal(
    extractResponseJsonText({ output_text: "{\"species\":\"dog\"}" }),
    "{\"species\":\"dog\"}",
  );
});

test("getAnalyzeBuddyRequestPayload sends the uploaded image as multimodal input with a strict schema", () => {
  const payload = getAnalyzeBuddyRequestPayload({
    imageDataUrl: "data:image/png;base64,abc",
    dominantColor: "#d9b99b",
    accentColor: "#8f6044",
    model: "gpt-4.1-mini",
  });

  assert.equal(payload.model, "gpt-4.1-mini");
  assert.equal(payload.input[0].content[0].type, "input_text");
  assert.equal(payload.input[0].content[1].type, "input_image");
  assert.equal(payload.input[0].content[1].image_url, "data:image/png;base64,abc");
  assert.equal(payload.text.format.type, "json_schema");
  assert.equal(payload.text.format.strict, true);
  assert.equal(payload.text.format.schema.required.includes("species"), true);
});
