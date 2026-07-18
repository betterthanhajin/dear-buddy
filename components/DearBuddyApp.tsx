"use client";

import { useEffect, useState } from "react";

import BuddyCarePanel from "@/components/BuddyCarePanel";
import BuddyCreator from "@/components/BuddyCreator";
import type { Buddy, BuddyActionImages } from "@/lib/buddy";
import { createBuddy } from "@/lib/buddy";
import { BACKGROUND_BUDDY_ACTION_IMAGE_KEYS } from "@/lib/openai-buddy-image";
import { clearSavedBuddy, loadSavedBuddyWithStatus, saveBuddy } from "@/lib/storage";

type CreateBuddyPayload = Parameters<typeof BuddyCreator>[0]["onCreate"] extends (
  input: infer Input,
) => void
  ? Input
  : never;

export default function DearBuddyApp() {
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [actionImagesMessage, setActionImagesMessage] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [returnMessage, setReturnMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadSavedBuddyWithStatus().then((result) => {
      if (isMounted) {
        setBuddy(result.buddy);
        setReturnMessage(result.returnMessage);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async ({
    name,
    photoDataUrl,
    dominantColor,
    accentColor,
    actionImageAnalysis,
    avatarProfile,
    generatedActionImages,
    generatedImageDataUrl,
  }: CreateBuddyPayload) => {
    const nextBuddy = createBuddy({
      name,
      photoDataUrl,
      dominantColor,
      accentColor,
      avatarProfile,
      generatedActionImages,
      generatedImageDataUrl,
    });
    const result = await saveBuddy(nextBuddy);

    setBuddy(nextBuddy);
    setActionImagesMessage(
      actionImageAnalysis ? "돌봄 표정을 뒤에서 준비하고 있어요." : "",
    );
    setStorageWarning(result.ok ? "" : result.error);
    setReturnMessage("");

    if (actionImageAnalysis) {
      void generateBackgroundActionImages(nextBuddy, actionImageAnalysis);
    }
  };

  const handleChange = async (nextBuddy: Buddy) => {
    const result = await saveBuddy(nextBuddy);

    setBuddy(nextBuddy);
    setStorageWarning(result.ok ? "" : result.error);
    setReturnMessage("");
  };

  const handleReset = async () => {
    await clearSavedBuddy(undefined, buddy?.id);
    setBuddy(null);
    setActionImagesMessage("");
    setStorageWarning("");
    setReturnMessage("");
  };

  async function generateBackgroundActionImages(
    currentBuddy: Buddy,
    analysis: NonNullable<CreateBuddyPayload["actionImageAnalysis"]>,
  ) {
    try {
      const response = await fetch("/api/generate-buddy-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionKeys: BACKGROUND_BUDDY_ACTION_IMAGE_KEYS,
          actions: true,
          analysis,
        }),
      });
      const result: unknown = await response.json();

      if (!isActionImagesSuccess(result)) {
        setActionImagesMessage("돌봄 표정 일부를 준비하지 못했어요. 기본 이미지로 진행합니다.");
        return;
      }

      let mergedBuddy: Buddy | null = null;
      setBuddy((latestBuddy) => {
        if (!latestBuddy || latestBuddy.id !== currentBuddy.id) {
          return latestBuddy;
        }

        mergedBuddy = {
          ...latestBuddy,
          generatedActionImages: {
            ...latestBuddy.generatedActionImages,
            ...result.actionImages,
          },
        };

        return mergedBuddy;
      });

      if (!mergedBuddy) {
        return;
      }

      const saveResult = await saveBuddy(mergedBuddy);
      setActionImagesMessage("돌봄 표정이 준비됐어요.");
      setStorageWarning(saveResult.ok ? "" : saveResult.error);
    } catch {
      setActionImagesMessage("돌봄 표정 일부를 준비하지 못했어요. 기본 이미지로 진행합니다.");
    }
  }

  if (!buddy) {
    return <BuddyCreator onCreate={handleCreate} />;
  }

  return (
    <BuddyCarePanel
      buddy={buddy}
      actionImagesMessage={actionImagesMessage}
      onChange={handleChange}
      onReset={handleReset}
      returnMessage={returnMessage}
      storageWarning={storageWarning}
    />
  );
}

function isActionImagesSuccess(value: unknown): value is {
  actionImages: BuddyActionImages;
  ok: true;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { actionImages?: unknown; ok?: unknown };

  return candidate.ok === true && isActionImageMap(candidate.actionImages);
}

function isActionImageMap(value: unknown): value is BuddyActionImages {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((imageDataUrl) => typeof imageDataUrl === "string");
}
