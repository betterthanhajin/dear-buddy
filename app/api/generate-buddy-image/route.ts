import { NextResponse } from "next/server";

import { normalizeBuddyAnalysis } from "@/lib/buddy-analysis";
import {
  BUDDY_ACTION_IMAGE_KEYS,
  type BuddyActionImages,
  extractGeneratedImageDataUrl,
  getGenerateBuddyImageRequestPayload,
} from "@/lib/openai-buddy-image";

const DEFAULT_MODEL = "gpt-image-1";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY가 없어 SVG 버디로 진행합니다." },
      { status: 503 },
    );
  }

  try {
    const body: unknown = await request.json();

    if (!isGenerateImageRequest(body)) {
      return NextResponse.json(
        { ok: false, error: "이미지 생성 요청 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const analysis = normalizeBuddyAnalysis(body.analysis);
    const model = process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_MODEL;

    if (body.actions === true) {
      const entries = await Promise.all(
        BUDDY_ACTION_IMAGE_KEYS.map(async (actionKey) => {
          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              getGenerateBuddyImageRequestPayload({
                actionKey,
                analysis,
                model,
              }),
            ),
          });

          if (!response.ok) {
            return [actionKey, undefined] as const;
          }

          const responseBody: unknown = await response.json();
          return [actionKey, extractGeneratedImageDataUrl(responseBody)] as const;
        }),
      );
      const actionImages = entries.reduce<BuddyActionImages>((images, [actionKey, imageDataUrl]) => {
        if (imageDataUrl) {
          images[actionKey] = imageDataUrl;
        }

        return images;
      }, {});

      if (Object.keys(actionImages).length === 0) {
        return NextResponse.json(
          { ok: false, error: "버디 이미지 생성에 실패해 SVG 버디로 진행합니다." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        actionImages,
        imageDataUrl: actionImages.idle,
      });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
          getGenerateBuddyImageRequestPayload({
            analysis,
            model,
          }),
      ),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "버디 이미지 생성에 실패해 SVG 버디로 진행합니다." },
        { status: 502 },
      );
    }

    const responseBody: unknown = await response.json();

    return NextResponse.json({
      ok: true,
      imageDataUrl: extractGeneratedImageDataUrl(responseBody),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "버디 이미지 생성에 실패해 SVG 버디로 진행합니다." },
      { status: 500 },
    );
  }
}

function isGenerateImageRequest(value: unknown): value is {
  analysis: unknown;
  actions?: unknown;
} {
  return !!value && typeof value === "object" && "analysis" in value;
}
