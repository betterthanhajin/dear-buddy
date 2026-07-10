"use client";

import { useMemo, useState } from "react";

import BuddyAvatar from "@/components/BuddyAvatar";
import type { AvatarProfile } from "@/lib/buddy";
import { createAvatarProfile } from "@/lib/buddy";
import { extractPaletteFromImage } from "@/lib/palette";

type BuddyCreatorProps = {
  onCreate: (input: {
    name: string;
    photoDataUrl: string;
    dominantColor: string;
    accentColor: string;
    avatarProfile: AvatarProfile;
  }) => void;
};

type DraftBuddy = {
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
};

export default function BuddyCreator({ onCreate }: BuddyCreatorProps) {
  const [name, setName] = useState("");
  const [draftBuddy, setDraftBuddy] = useState<DraftBuddy | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const avatarProfile = useMemo(() => {
    if (!draftBuddy) {
      return null;
    }

    return createAvatarProfile({
      seed: `${name}:${draftBuddy.photoDataUrl.slice(0, 96)}`,
      dominantColor: draftBuddy.dominantColor,
      accentColor: draftBuddy.accentColor,
    });
  }, [draftBuddy, name]);

  const canCreate = !!draftBuddy && !!avatarProfile && name.trim().length > 0;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");
    setIsAnalyzing(true);

    try {
      const palette = await extractPaletteFromImage(file);
      setDraftBuddy(palette);
    } catch (error) {
      setDraftBuddy(null);
      setErrorMessage(error instanceof Error ? error.message : "이미지를 읽지 못했습니다.");
    } finally {
      setIsAnalyzing(false);
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
      avatarProfile,
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
                <BuddyAvatar profile={avatarProfile} size="sm" />
              ) : (
                <span className="text-sm text-zinc-400">
                  {isAnalyzing ? "분석 중입니다" : "사진을 고르면 나타나요"}
                </span>
              )}
            </PreviewPanel>
          </div>

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
            disabled={!canCreate || isAnalyzing}
            type="submit"
          >
            버디 만들기
          </button>
        </form>
      </div>
    </section>
  );
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
