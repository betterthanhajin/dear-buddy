"use client";

import { useState } from "react";

import BuddyAvatar from "@/components/BuddyAvatar";
import { getBuddyActionReaction } from "@/lib/buddy-action-reaction";
import type { Buddy, BuddyAction } from "@/lib/buddy";
import {
  applyBuddyAction,
  applyDailyCareBonus,
  getBuddyLevel,
  getBuddyMood,
} from "@/lib/buddy";

type BuddyCarePanelProps = {
  buddy: Buddy;
  onChange: (buddy: Buddy) => void;
  onReset: () => void;
  returnMessage?: string;
  storageWarning?: string;
};

const actionLabels: Record<BuddyAction, { label: string; description: string }> = {
  pet: { label: "쓰다듬기", description: "친밀도와 경험치가 조금 올라요" },
  feed: { label: "밥주기", description: "배고픔을 채우고 친밀도가 올라요" },
  play: { label: "놀아주기", description: "경험치가 크게 오르지만 에너지를 써요" },
  rest: { label: "재우기", description: "에너지를 회복해요" },
};

export default function BuddyCarePanel({
  buddy,
  onChange,
  onReset,
  returnMessage,
  storageWarning,
}: BuddyCarePanelProps) {
  const mood = getBuddyMood(buddy.stats);
  const { level, progress } = getBuddyLevel(buddy.stats.exp);
  const [reaction, setReaction] = useState<{
    action: BuddyAction;
    nonce: number;
  } | null>(null);
  const [dailyBonusMessage, setDailyBonusMessage] = useState("");
  const activeReaction = reaction ? getBuddyActionReaction(reaction.action) : null;
  const activeActionImageDataUrl = reaction
    ? buddy.generatedActionImages?.[reaction.action]
    : undefined;
  const idleImageDataUrl = buddy.generatedActionImages?.idle ?? buddy.generatedImageDataUrl;
  const buddyImageDataUrl = activeActionImageDataUrl ?? idleImageDataUrl;
  const careMessage =
    dailyBonusMessage || activeReaction?.message || returnMessage || getMoodText(mood);

  const handleAction = (action: BuddyAction) => {
    setReaction((currentReaction) => ({
      action,
      nonce: (currentReaction?.nonce ?? 0) + 1,
    }));
    const actionBuddy = applyBuddyAction(buddy, action);
    const dailyBonus = applyDailyCareBonus(actionBuddy);

    setDailyBonusMessage(
      dailyBonus.awarded
        ? `오늘 첫 돌봄 보너스 +${dailyBonus.bonusExp} EXP, ${dailyBonus.streak}일째 만나는 중이에요.`
        : "",
    );
    onChange(dailyBonus.buddy);
  };

  return (
    <main className="min-h-screen bg-[#f7f2ec] px-5 py-6 text-zinc-950">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-center">
        <section className="flex flex-col items-center rounded-[2rem] bg-white p-6 text-center shadow-xl shadow-zinc-300/40">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
                Dear Buddy
              </p>
              <h1 className="mt-1 text-3xl font-black">{buddy.name}</h1>
            </div>
            <button
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900"
              onClick={onReset}
              type="button"
            >
              새로 만들기
            </button>
          </div>

          <div className="relative mt-6 rounded-full bg-[#fff7ed] p-5">
            {activeReaction ? (
              <span
                aria-hidden="true"
                className="buddy-reaction-badge absolute right-6 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-rose-500 shadow-lg shadow-rose-100"
                key={`${reaction?.action}-${reaction?.nonce}-badge`}
              >
                {activeReaction.symbol}
              </span>
            ) : null}
            {buddyImageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${buddy.name} 버디`}
                className={`buddy-float h-48 w-48 object-contain ${activeReaction?.animationClassName ?? ""}`}
                key={reaction?.nonce ?? "generated-buddy"}
                src={buddyImageDataUrl}
              />
            ) : (
              <div
                className={`buddy-float ${activeReaction?.animationClassName ?? ""}`}
                key={reaction?.nonce ?? "svg-buddy"}
              >
                <BuddyAvatar mood={mood} profile={buddy.avatarProfile} size="lg" />
              </div>
            )}
          </div>

          <p className="mt-5 text-sm font-bold text-zinc-500">Lv. {level}</p>
          <div className="mt-2 h-3 w-full rounded-full bg-zinc-100">
            <div
              className="h-3 rounded-full bg-rose-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-zinc-500">
            {careMessage}
          </p>

          {storageWarning ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {storageWarning}
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-zinc-300/40">
          <div className="grid grid-cols-[96px_1fr] gap-4 rounded-3xl bg-zinc-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${buddy.name} 원본 인형`}
              className="h-24 w-24 rounded-3xl object-cover"
              src={buddy.photoDataUrl}
            />
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-zinc-900">처음 만난 인형 사진</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                이 사진을 바탕으로 버디 이미지가 만들어졌어요. 사진과 버디는 이 브라우저에만 저장됩니다.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Status label="친밀도" tone="rose" value={buddy.stats.affection} />
            <Status label="배부름" tone="amber" value={buddy.stats.hunger} />
            <Status label="에너지" tone="sky" value={buddy.stats.energy} />
            <Status label="연속 돌봄" suffix="일" tone="emerald" value={buddy.dailyCareStreak} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(Object.keys(actionLabels) as BuddyAction[]).map((action) => (
              <button
                className="rounded-3xl border border-zinc-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100"
                key={action}
                onClick={() => handleAction(action)}
                type="button"
              >
                <span className="block text-base font-black text-zinc-950">
                  {actionLabels[action].label}
                </span>
                <span className="mt-1 block text-sm leading-5 text-zinc-500">
                  {actionLabels[action].description}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Status({
  label,
  suffix = "/100",
  tone,
  value,
}: {
  label: string;
  suffix?: string;
  tone: "rose" | "amber" | "sky" | "emerald";
  value: number;
}) {
  const colorClassName = {
    rose: "bg-rose-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
    emerald: "bg-emerald-400",
  }[tone];
  const width = suffix === "/100" ? `${value}%` : `${Math.min(value * 12, 100)}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-3 rounded-full bg-zinc-100">
        <div
          className={`h-3 rounded-full transition-all ${colorClassName}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function getMoodText(mood: ReturnType<typeof getBuddyMood>) {
  if (mood === "sleep") {
    return "졸려 보여요. 잠깐 쉬게 해 주세요.";
  }

  if (mood === "hungry") {
    return "배가 고픈 것 같아요.";
  }

  if (mood === "sad") {
    return "조금 외로워 보여요. 쓰다듬어 주세요.";
  }

  return "기분이 좋아 보여요.";
}
