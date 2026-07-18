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
    actionImageAnalysis?: BuddyAnalysis;
    avatarProfile: AvatarProfile;
    generatedActionImages?: BuddyActionImages;
    generatedImageDataUrl?: string;
  }) => void;
};

type DraftBuddy = {
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
  actionImageAnalysis?: BuddyAnalysis;
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
        actionImageAnalysis: analyzedProfile.analysis,
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
      actionImageAnalysis: draftBuddy.actionImageAnalysis,
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
      actionImageAnalysis: analysis,
      avatarProfile: createAnalyzedAvatarProfile(analysis),
      generatedActionImages: undefined,
      generatedImageDataUrl: undefined,
      warning: "",
    });
  };

  return (
    <main className="retro-page">
      <section className="retro-shell retro-shell-creator">
        <div className="retro-copy">
          <p className="retro-kicker">Dear Buddy</p>
          <h1>사진 속 친구를 작은 도트 버디로 데려와요</h1>
          <p>
            먼저 기본 버디를 빠르게 만들고, 돌봄 표정은 뒤에서 천천히 준비합니다.
            사진과 버디는 이 브라우저에 저장돼요.
          </p>
        </div>

        <form className="retro-device retro-device-form" onSubmit={handleSubmit}>
          <div className="retro-device-top">
            <span>NEW BUDDY</span>
            <span>{creationStatus.isBusy ? "SYNC" : "READY"}</span>
          </div>
          <div className="retro-screen retro-screen-form">
            <label className="block">
              <span className="retro-label">인형 사진</span>
              <span className="retro-upload">
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
              <p className="retro-alert retro-alert-error">
                {errorMessage}
              </p>
            ) : null}

            {draftBuddy?.warning ? (
              <p className="retro-alert retro-alert-warn">
                {draftBuddy.warning}
              </p>
            ) : null}

            {creationStatus.message ? (
              <div
                aria-live="polite"
                className="retro-alert retro-alert-live"
              >
                {creationStatus.message}
              </div>
            ) : null}

            <div className="retro-preview-grid">
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
              <label className="retro-field">
                <span className="retro-label">감지된 종류</span>
                <select
                  className="retro-input"
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

            <label className="retro-field">
              <span className="retro-label">버디 이름</span>
              <input
                className="retro-input"
                maxLength={16}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 몽실이"
                type="text"
                value={name}
              />
            </label>
          </div>

          <button
            className="retro-primary-button"
            disabled={!canCreate}
            type="submit"
          >
            {creationStatus.isBusy ? "잠시만 기다려 주세요" : "버디 만들기"}
          </button>
        </form>
      </section>
    </main>
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
      body: JSON.stringify({ actionKeys: ["idle"], actions: true, analysis }),
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
      <p className="retro-preview-title">{title}</p>
      <div className="retro-preview-panel">
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
