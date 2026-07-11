import type { Buddy } from "./buddy";

const STORAGE_KEY = "dear-buddy.saved-buddy.v1";

type SaveResult = { ok: true } | { ok: false; error: string };

export function loadSavedBuddy(): Buddy | null {
  if (!hasLocalStorage()) {
    return null;
  }

  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    return isBuddy(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function saveBuddy(buddy: Buddy): SaveResult {
  if (!hasLocalStorage()) {
    return { ok: false, error: "이 브라우저에서는 저장을 사용할 수 없습니다." };
  }

  for (const candidate of getStorageCandidates(buddy)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return { ok: true };
    } catch {
      // Try the next smaller candidate before surfacing a storage warning.
    }
  }

  return { ok: false, error: "버디 상태를 저장하지 못했습니다." };
}

export function clearSavedBuddy() {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}

function getStorageCandidates(buddy: Buddy): Buddy[] {
  if (!buddy.generatedImageDataUrl) {
    return [buddy];
  }

  const buddyWithoutGeneratedImage = { ...buddy };
  delete buddyWithoutGeneratedImage.generatedImageDataUrl;

  return [buddy, buddyWithoutGeneratedImage];
}

function isBuddy(value: unknown): value is Buddy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Buddy>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.photoDataUrl === "string" &&
    (typeof candidate.generatedImageDataUrl === "undefined" ||
      typeof candidate.generatedImageDataUrl === "string") &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    !!candidate.avatarProfile &&
    typeof candidate.avatarProfile === "object" &&
    !!candidate.stats &&
    typeof candidate.stats === "object" &&
    typeof candidate.stats.affection === "number" &&
    typeof candidate.stats.hunger === "number" &&
    typeof candidate.stats.energy === "number" &&
    typeof candidate.stats.exp === "number"
  );
}
