import { NextResponse } from "next/server";

import { createAnalyzedAvatarProfile, normalizeBuddyAnalysis } from "@/lib/buddy-analysis";
import {
  extractResponseJsonText,
  getAnalyzeBuddyRequestPayload,
} from "@/lib/openai-buddy-analysis";

const DEFAULT_MODEL = "gpt-4.1-mini";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY가 없어 로컬 생성으로 진행합니다." },
      { status: 503 },
    );
  }

  try {
    const body: unknown = await request.json();

    if (!isAnalyzeRequest(body)) {
      return NextResponse.json(
        { ok: false, error: "이미지 분석 요청 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        getAnalyzeBuddyRequestPayload({
          imageDataUrl: body.imageDataUrl,
          dominantColor: body.dominantColor,
          accentColor: body.accentColor,
          model: process.env.OPENAI_VISION_MODEL ?? DEFAULT_MODEL,
        }),
      ),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "사진 분석에 실패해 로컬 생성으로 진행합니다." },
        { status: 502 },
      );
    }

    const responseBody: unknown = await response.json();
    const jsonText = extractResponseJsonText(responseBody);
    const analysis = normalizeBuddyAnalysis(JSON.parse(jsonText));

    return NextResponse.json({
      ok: true,
      analysis,
      avatarProfile: createAnalyzedAvatarProfile(analysis),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "사진 분석에 실패해 로컬 생성으로 진행합니다." },
      { status: 500 },
    );
  }
}

function isAnalyzeRequest(value: unknown): value is {
  imageDataUrl: string;
  dominantColor: string;
  accentColor: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.imageDataUrl === "string" &&
    candidate.imageDataUrl.startsWith("data:image/") &&
    typeof candidate.dominantColor === "string" &&
    typeof candidate.accentColor === "string"
  );
}
