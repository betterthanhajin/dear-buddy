"use client";

import { useEffect, useState } from "react";

import BuddyCarePanel from "@/components/BuddyCarePanel";
import BuddyCreator from "@/components/BuddyCreator";
import type { Buddy } from "@/lib/buddy";
import { createBuddy } from "@/lib/buddy";
import { clearSavedBuddy, loadSavedBuddy, saveBuddy } from "@/lib/storage";

type CreateBuddyPayload = Parameters<typeof BuddyCreator>[0]["onCreate"] extends (
  input: infer Input,
) => void
  ? Input
  : never;

export default function DearBuddyApp() {
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [storageWarning, setStorageWarning] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadSavedBuddy().then((savedBuddy) => {
      if (isMounted) {
        setBuddy(savedBuddy);
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
    avatarProfile,
    generatedImageDataUrl,
  }: CreateBuddyPayload) => {
    const nextBuddy = createBuddy({
      name,
      photoDataUrl,
      dominantColor,
      accentColor,
      avatarProfile,
      generatedImageDataUrl,
    });
    const result = await saveBuddy(nextBuddy);

    setBuddy(nextBuddy);
    setStorageWarning(result.ok ? "" : result.error);
  };

  const handleChange = async (nextBuddy: Buddy) => {
    const result = await saveBuddy(nextBuddy);

    setBuddy(nextBuddy);
    setStorageWarning(result.ok ? "" : result.error);
  };

  const handleReset = async () => {
    await clearSavedBuddy(undefined, buddy?.id);
    setBuddy(null);
    setStorageWarning("");
  };

  if (!buddy) {
    return <BuddyCreator onCreate={handleCreate} />;
  }

  return (
    <BuddyCarePanel
      buddy={buddy}
      onChange={handleChange}
      onReset={handleReset}
      storageWarning={storageWarning}
    />
  );
}
