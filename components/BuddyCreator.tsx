"use client";

import { useState } from "react";

import BuddyAvatar from "@/components/BuddyAvatar";
import type { BuddyAnalysis, BuddySpecies } from "@/lib/buddy-analysis";
import {
  createAnalyzedAvatarProfile,
  getSpeciesLabel,
  normalizeBuddyAnalysis,
} from "@/lib/buddy-analysis";
import type { AvatarProfile, BuddyActionImages } from "@/lib/buddy";
import { createAvatarProfile } from "@/lib/buddy";
import type { BuddyCreationStage } from "@/lib/buddy-creation-status";
import { getBuddyCreationStatus } from "@/lib/buddy-creation-status";
import { extractPaletteFromImage } from "@/lib/palette";

type BuddyCreatorProps = {
  onCreate: (input: {
    name: string;
    photoDataUrl: string;
    dominantColor: string;
    accentColor: string;
    avatarProfile: AvatarProfile;
    generatedActionImages?: BuddyActionImages;
    generatedImageDataUrl?: string;
  }) => void;
};

type DraftBuddy = {
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
  avatarProfile: AvatarProfile;
  generatedActionImages?: BuddyActionImages;
  generatedImageDataUrl?: string;
  warning: string;
};

const SPECIES_OPTIONS: BuddySpecies[] = [
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
];

export default function BuddyCreator({ onCreate }: BuddyCreatorProps) {
  const [name, setName] = useState("");
  const [draftBuddy, setDraftBuddy] = useState<DraftBuddy | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [creationStage, setCreationStage] = useState<BuddyCreationStage>("idle");

  const avatarProfile = draftBuddy?.avatarProfile ?? null;
  const generatedImageDataUrl = draftBuddy?.generatedImageDataUrl;
  const creationStatus = getBuddyCreationStatus(creationStage);
  const canCreate = !!draftBuddy && name.trim().length > 0 && !creationStatus.isBusy;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");
    setCreationStage("reading");

    try {
      const palette = await extractPaletteFromImage(file);
      const localProfile = createLocalAvatarProfile({
        ...palette,
        seed: `${file.name}:${palette.photoDataUrl.slice(0, 96)}`,
      });

      setDraftBuddy({
        ...palette,
        avatarProfile: localProfile,
        warning: "",
      });

      setCreationStage("analyzing");
      const analyzedProfile = await analyzeBuddyPhoto(palette);
      setCreationStage(analyzedProfile.analysis ? "generating" : "idle");
      const generatedImage = analyzedProfile.analysis
        ? await generateBuddyImage(analyzedProfile.analysis)
        : null;

      setDraftBuddy({
        ...palette,
        avatarProfile: analyzedProfile.avatarProfile,
        generatedActionImages: generatedImage?.actionImages,
        generatedImageDataUrl: generatedImage?.imageDataUrl,
        warning: generatedImage?.warning || analyzedProfile.warning,
      });
    } catch (error) {
      setDraftBuddy(null);
      setErrorMessage(error instanceof Error ? error.message : "이미지를 읽지 못했습니다.");
    } finally {
      setCreationStage("idle");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreate) {
      return;
    }

    onCreate({
      name: name.trim(),
      photoDataUrl: draftBuddy.photoDataUrl,
      dominantColor: draftBuddy.dominantColor,
      accentColor: draftBuddy.accentColor,
      avatarProfile: draftBuddy.avatarProfile,
      generatedActionImages: draftBuddy.generatedActionImages,
      generatedImageDataUrl: draftBuddy.generatedImageDataUrl,
    });
  };

  const handleSpeciesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!draftBuddy) {
      return;
    }

    const species = event.target.value as BuddySpecies;
    const analysis = normalizeBuddyAnalysis({
      species,
      displayLabel: getSpeciesLabel(species),
      confidence: 1,
      primaryColor: draftBuddy.avatarProfile.bodyColor,
      secondaryColor: draftBuddy.avatarProfile.secondaryColor ?? draftBuddy.accentColor,
      accentColor: draftBuddy.avatarProfile.accentColor,
      earStyle: species === "dog" ? "floppy" : undefined,
      muzzleStyle: draftBuddy.avatarProfile.muzzleStyle,
      bodyShape: draftBuddy.avatarProfile.bodyShape,
      markings: draftBuddy.avatarProfile.markings ?? [],
      personality: "다정함",
    });

    setDraftBuddy({
      ...draftBuddy,
      avatarProfile: createAnalyzedAvatarProfile(analysis),
      generatedActionImages: undefined,
      generatedImageDataUrl: undefined,
      warning: "",
    });
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-8">
      <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">
            Dear Buddy
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-zinc-950 md:text-6xl">
            아끼는 인형을 작은 버디로 키워요
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
            사진은 브라우저 안에서만 분석합니다. 대표 색을 뽑아 2D 버디를 만들고,
            이름을 붙이면 바로 돌보기 화면으로 이어집니다.
          </p>
        </div>

        <form
          className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">인형 사진</span>
            <span className="mt-3 flex min-h-40 cursor-pointer items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-500 transition hover:border-rose-300 hover:bg-rose-50">
              <input
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                type="file"
              />
              {draftBuddy ? "다른 사진으로 바꾸기" : "사진을 선택해 주세요"}
            </span>
          </label>

          {errorMessage ? (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          ) : null}

          {draftBuddy?.warning ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {draftBuddy.warning}
            </p>
          ) : null}

          {creationStatus.message ? (
            <div
              aria-live="polite"
              className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              {creationStatus.message}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-4">
            <PreviewPanel title="원본 사진">
              {draftBuddy ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="업로드한 인형"
                  className="h-full w-full rounded-3xl object-cover"
                  src={draftBuddy.photoDataUrl}
                />
              ) : (
                <span className="text-sm text-zinc-400">아직 사진이 없어요</span>
              )}
            </PreviewPanel>
            <PreviewPanel title="생성 버디">
              {avatarProfile ? (
                <div className="flex flex-col items-center gap-2">
                  {generatedImageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="생성된 버디"
                      className="h-24 w-24 rounded-3xl object-contain"
                      src={generatedImageDataUrl}
                    />
                  ) : (
                    <BuddyAvatar profile={avatarProfile} size="sm" />
                  )}
                  <span className="text-xs font-semibold text-zinc-500">
                    {avatarProfile.displayLabel ?? "사진 속 버디"}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-zinc-400">
                  {creationStatus.message || "사진을 고르면 나타나요"}
                </span>
              )}
            </PreviewPanel>
          </div>

          {draftBuddy ? (
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-zinc-800">감지된 종류</span>
              <select
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                onChange={handleSpeciesChange}
                value={draftBuddy.avatarProfile.species ?? "custom"}
              >
                {SPECIES_OPTIONS.map((species) => (
                  <option key={species} value={species}>
                    {getSpeciesLabel(species)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-zinc-800">버디 이름</span>
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              maxLength={16}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 몽실이"
              type="text"
              value={name}
            />
          </label>

          <button
            className="mt-5 w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition enabled:hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!canCreate}
            type="submit"
          >
            {creationStatus.isBusy ? "잠시만 기다려 주세요" : "버디 만들기"}
          </button>
        </form>
      </div>
    </section>
  );
}

async function analyzeBuddyPhoto(palette: {
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
}): Promise<{ avatarProfile: AvatarProfile; analysis?: BuddyAnalysis; warning: string }> {
  try {
    const response = await fetch("/api/analyze-buddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: palette.photoDataUrl,
        dominantColor: palette.dominantColor,
        accentColor: palette.accentColor,
      }),
    });

    const result: unknown = await response.json();

    if (isAnalyzeSuccess(result)) {
      return {
        avatarProfile: result.avatarProfile,
        analysis: result.analysis,
        warning: "",
      };
    }

    return {
      avatarProfile: createLocalAvatarProfile({
        seed: palette.photoDataUrl.slice(0, 96),
        dominantColor: palette.dominantColor,
        accentColor: palette.accentColor,
      }),
      warning: getAnalyzeWarning(result),
    };
  } catch {
    return {
      avatarProfile: createLocalAvatarProfile({
        seed: palette.photoDataUrl.slice(0, 96),
        dominantColor: palette.dominantColor,
        accentColor: palette.accentColor,
      }),
      warning: "사진 분석에 실패해 로컬 생성으로 진행합니다.",
    };
  }
}

async function generateBuddyImage(
  analysis: BuddyAnalysis,
): Promise<{ actionImages?: BuddyActionImages; imageDataUrl?: string; warning: string }> {
  try {
    const response = await fetch("/api/generate-buddy-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: true, analysis }),
    });

    const result: unknown = await response.json();

    if (isGenerateImageSuccess(result)) {
      return {
        actionImages: result.actionImages,
        imageDataUrl: result.imageDataUrl,
        warning: "",
      };
    }

    return { warning: getGenerateImageWarning(result) };
  } catch {
    return { warning: "버디 이미지 생성에 실패해 SVG 버디로 진행합니다." };
  }
}

function createLocalAvatarProfile({
  seed,
  dominantColor,
  accentColor,
}: {
  seed: string;
  dominantColor: string;
  accentColor: string;
}): AvatarProfile {
  return {
    ...createAvatarProfile({ seed, dominantColor, accentColor }),
    species: "custom",
    displayLabel: "사진 속 버디",
    secondaryColor: accentColor,
    muzzleStyle: "round",
    bodyShape: "round",
    markings: [],
  };
}

function isAnalyzeSuccess(value: unknown): value is {
  ok: true;
  analysis: BuddyAnalysis;
  avatarProfile: AvatarProfile;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { ok?: unknown; avatarProfile?: unknown };
  return candidate.ok === true && !!candidate.avatarProfile;
}

function getAnalyzeWarning(value: unknown) {
  if (!value || typeof value !== "object") {
    return "사진 분석에 실패해 로컬 생성으로 진행합니다.";
  }

  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : "사진 분석에 실패해 로컬 생성으로 진행합니다.";
}

function isGenerateImageSuccess(value: unknown): value is {
  actionImages?: BuddyActionImages;
  ok: true;
  imageDataUrl: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    actionImages?: unknown;
    ok?: unknown;
    imageDataUrl?: unknown;
  };

  return (
    candidate.ok === true &&
    typeof candidate.imageDataUrl === "string" &&
    (typeof candidate.actionImages === "undefined" || isActionImageMap(candidate.actionImages))
  );
}

function getGenerateImageWarning(value: unknown) {
  if (!value || typeof value !== "object") {
    return "버디 이미지 생성에 실패해 SVG 버디로 진행합니다.";
  }

  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : "버디 이미지 생성에 실패해 SVG 버디로 진행합니다.";
}

function PreviewPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-zinc-500">{title}</p>
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-zinc-50 p-3">
        {children}
      </div>
    </div>
  );
}

function isActionImageMap(value: unknown): value is BuddyActionImages {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((imageDataUrl) => typeof imageDataUrl === "string");
}
