export type AnalyzeBuddyRequestInput = {
  imageDataUrl: string;
  dominantColor: string;
  accentColor: string;
  model: string;
};

export function getAnalyzeBuddyRequestPayload({
  imageDataUrl,
  dominantColor,
  accentColor,
  model,
}: AnalyzeBuddyRequestInput) {
  return {
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Analyze this uploaded photo for a cute 2D virtual buddy.",
              "Identify the main beloved object or animal, not just dog vs plush.",
              "If it looks like a seal plush, return seal. If it is a dog, return dog. If uncertain, return custom.",
              `Use these fallback colors only when visual colors are unclear: primary ${dominantColor}, accent ${accentColor}.`,
              "Return only structured data that fits the schema.",
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "buddy_photo_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "species",
            "displayLabel",
            "confidence",
            "primaryColor",
            "secondaryColor",
            "accentColor",
            "earStyle",
            "muzzleStyle",
            "bodyShape",
            "markings",
            "personality",
          ],
          properties: {
            species: {
              type: "string",
              enum: [
                "custom",
                "dog",
                "cat",
                "rabbit",
                "bear",
                "seal",
                "penguin",
                "bird",
                "fox",
                "frog",
                "sheep",
                "koala",
                "panda",
              ],
            },
            displayLabel: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            primaryColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
            secondaryColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
            accentColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
            earStyle: {
              type: "string",
              enum: ["round", "floppy", "pointy", "small", "none"],
            },
            muzzleStyle: {
              type: "string",
              enum: ["none", "round", "snout", "beak"],
            },
            bodyShape: {
              type: "string",
              enum: ["round", "oval", "pear"],
            },
            markings: {
              type: "array",
              maxItems: 3,
              items: { type: "string" },
            },
            personality: { type: "string" },
          },
        },
      },
    },
  } as const;
}

export function extractResponseJsonText(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("분석 응답을 읽지 못했습니다.");
  }

  const shortcut = (response as { output_text?: unknown }).output_text;

  if (typeof shortcut === "string" && shortcut.trim().length > 0) {
    return shortcut;
  }

  const output = (response as { output?: unknown }).output;

  if (!Array.isArray(output)) {
    throw new Error("분석 응답을 읽지 못했습니다.");
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const text = (contentItem as { text?: unknown }).text;

      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  throw new Error("분석 응답을 읽지 못했습니다.");
}
