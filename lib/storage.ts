import type { Buddy } from "./buddy";

const STORAGE_KEY = "dear-buddy.saved-buddy.v1";
const DB_NAME = "dear-buddy";
const DB_VERSION = 1;
const IMAGE_STORE_NAME = "generated-buddy-images";

type SaveResult = { ok: true } | { ok: false; error: string };
export type BuddyImageStore = {
  delete: (id: string) => Promise<void>;
  load: (id: string) => Promise<string | undefined>;
  save: (id: string, imageDataUrl: string) => Promise<void>;
};

const indexedDbBuddyImageStore: BuddyImageStore = {
  async delete(id) {
    if (!hasIndexedDb()) {
      return;
    }

    const database = await openDatabase();
    await runRequest(
      database.transaction(IMAGE_STORE_NAME, "readwrite").objectStore(IMAGE_STORE_NAME).delete(id),
    );
    database.close();
  },

  async load(id) {
    if (!hasIndexedDb()) {
      return undefined;
    }

    const database = await openDatabase();
    const value = await runRequest(
      database.transaction(IMAGE_STORE_NAME, "readonly").objectStore(IMAGE_STORE_NAME).get(id),
    );
    database.close();

    return typeof value === "string" ? value : undefined;
  },

  async save(id, imageDataUrl) {
    if (!hasIndexedDb()) {
      throw new Error("IndexedDB를 사용할 수 없습니다.");
    }

    const database = await openDatabase();
    await runRequest(
      database
        .transaction(IMAGE_STORE_NAME, "readwrite")
        .objectStore(IMAGE_STORE_NAME)
        .put(imageDataUrl, id),
    );
    database.close();
  },
};

export async function loadSavedBuddy(
  imageStore: BuddyImageStore = indexedDbBuddyImageStore,
): Promise<Buddy | null> {
  if (!hasLocalStorage()) {
    return null;
  }

  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    if (!isBuddy(parsedValue)) {
      return null;
    }

    const generatedImageDataUrl = parsedValue.generatedImageDataUrl ?? await imageStore.load(parsedValue.id);

    return generatedImageDataUrl
      ? { ...parsedValue, generatedImageDataUrl }
      : parsedValue;
  } catch {
    return null;
  }
}

export async function saveBuddy(
  buddy: Buddy,
  imageStore: BuddyImageStore = indexedDbBuddyImageStore,
): Promise<SaveResult> {
  if (!hasLocalStorage()) {
    return { ok: false, error: "이 브라우저에서는 저장을 사용할 수 없습니다." };
  }

  const imageStored = await storeGeneratedImage(buddy, imageStore);
  const localBuddy = imageStored ? removeGeneratedImage(buddy) : buddy;

  for (const candidate of getStorageCandidates(localBuddy)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return { ok: true };
    } catch {
      // Try the next smaller candidate before surfacing a storage warning.
    }
  }

  return { ok: false, error: "버디 상태를 저장하지 못했습니다." };
}

export async function clearSavedBuddy(
  imageStore: BuddyImageStore = indexedDbBuddyImageStore,
  buddyId?: string,
) {
  if (!hasLocalStorage()) {
    return;
  }

  const savedBuddyId = buddyId ?? getSavedBuddyId();
  localStorage.removeItem(STORAGE_KEY);

  if (savedBuddyId) {
    await imageStore.delete(savedBuddyId);
  }
}

function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME);
      }
    });
  });
}

function runRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("success", () => resolve(request.result));
  });
}

function getStorageCandidates(buddy: Buddy): Buddy[] {
  if (!buddy.generatedImageDataUrl) {
    return [buddy];
  }

  return [buddy, removeGeneratedImage(buddy)];
}

async function storeGeneratedImage(buddy: Buddy, imageStore: BuddyImageStore) {
  if (!buddy.generatedImageDataUrl) {
    return false;
  }

  try {
    await imageStore.save(buddy.id, buddy.generatedImageDataUrl);
    return true;
  } catch {
    return false;
  }
}

function removeGeneratedImage(buddy: Buddy): Buddy {
  const buddyWithoutGeneratedImage = { ...buddy };
  delete buddyWithoutGeneratedImage.generatedImageDataUrl;

  return buddyWithoutGeneratedImage;
}

function getSavedBuddyId() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return undefined;
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    return isBuddy(parsedValue) ? parsedValue.id : undefined;
  } catch {
    return undefined;
  }
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
