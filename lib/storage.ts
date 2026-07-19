import {
  applyTimeDecay,
  type Buddy,
  type BuddyActionImageKey,
  type BuddyActionImages,
  type BuddyInventory,
  type BuddyShopItemId,
  SHOP_ITEMS,
} from "./buddy.ts";

const STORAGE_KEY = "dear-buddy.saved-buddy.v1";
const DB_NAME = "dear-buddy";
const DB_VERSION = 1;
const IMAGE_STORE_NAME = "generated-buddy-images";

type SaveResult = { ok: true } | { ok: false; error: string };
type LoadResult = {
  buddy: Buddy | null;
  returnMessage: string;
};
export type BuddyImageStore = {
  delete: (id: string) => Promise<void>;
  load: (id: string) => Promise<string | undefined>;
  save: (id: string, imageDataUrl: string) => Promise<void>;
};

const ACTION_IMAGE_KEYS: BuddyActionImageKey[] = ["idle", "pet", "feed", "play", "rest"];

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
  nowDate = new Date(),
): Promise<Buddy | null> {
  const result = await loadSavedBuddyWithStatus(imageStore, nowDate);
  return result.buddy;
}

export async function loadSavedBuddyWithStatus(
  imageStore: BuddyImageStore = indexedDbBuddyImageStore,
  nowDate = new Date(),
): Promise<LoadResult> {
  if (!hasLocalStorage()) {
    return { buddy: null, returnMessage: "" };
  }

  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return { buddy: null, returnMessage: "" };
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    const parsedBuddy = normalizeSavedBuddy(parsedValue);
    if (!parsedBuddy) {
      return { buddy: null, returnMessage: "" };
    }

    const generatedImageDataUrl = parsedBuddy.generatedImageDataUrl ?? await imageStore.load(parsedBuddy.id);
    const generatedActionImages =
      parsedBuddy.generatedActionImages ?? await loadGeneratedActionImages(parsedBuddy.id, imageStore);
    const buddy = generatedImageDataUrl
      ? addOptionalActionImages({ ...parsedBuddy, generatedImageDataUrl }, generatedActionImages)
      : addOptionalActionImages(parsedBuddy, generatedActionImages);
    const decayed = applyTimeDecay(buddy, nowDate);

    if (decayed.didDecay) {
      await saveBuddy(decayed.buddy, imageStore);
    }

    return {
      buddy: decayed.buddy,
      returnMessage: getReturnMessage(decayed.elapsedHours, decayed.didDecay),
    };
  } catch {
    return { buddy: null, returnMessage: "" };
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
  const actionImagesStored = await storeGeneratedActionImages(buddy, imageStore);
  const localBuddy = removeStoredImages(buddy, {
    removeGeneratedImage: imageStored,
    removeActionImages: actionImagesStored,
  });

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
    await Promise.all(
      ACTION_IMAGE_KEYS.map((actionKey) => imageStore.delete(getActionImageId(savedBuddyId, actionKey))),
    );
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
  if (!buddy.generatedImageDataUrl && !buddy.generatedActionImages) {
    return [buddy];
  }

  return [
    buddy,
    removeStoredImages(buddy, {
      removeActionImages: true,
      removeGeneratedImage: true,
    }),
  ];
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

async function loadGeneratedActionImages(buddyId: string, imageStore: BuddyImageStore) {
  const entries = await Promise.all(
    ACTION_IMAGE_KEYS.map(async (actionKey) => {
      const imageDataUrl = await imageStore.load(getActionImageId(buddyId, actionKey));
      return [actionKey, imageDataUrl] as const;
    }),
  );
  const actionImages = entries.reduce<BuddyActionImages>((images, [actionKey, imageDataUrl]) => {
    if (imageDataUrl) {
      images[actionKey] = imageDataUrl;
    }

    return images;
  }, {});

  return Object.keys(actionImages).length > 0 ? actionImages : undefined;
}

async function storeGeneratedActionImages(buddy: Buddy, imageStore: BuddyImageStore) {
  if (!buddy.generatedActionImages) {
    return false;
  }

  try {
    await Promise.all(
      ACTION_IMAGE_KEYS.map(async (actionKey) => {
        const imageDataUrl = buddy.generatedActionImages?.[actionKey];

        if (imageDataUrl) {
          await imageStore.save(getActionImageId(buddy.id, actionKey), imageDataUrl);
        }
      }),
    );
    return true;
  } catch {
    return false;
  }
}

function removeStoredImages(
  buddy: Buddy,
  {
    removeActionImages,
    removeGeneratedImage,
  }: {
    removeActionImages: boolean;
    removeGeneratedImage: boolean;
  },
): Buddy {
  const buddyWithoutStoredImages = { ...buddy };

  if (removeGeneratedImage) {
    delete buddyWithoutStoredImages.generatedImageDataUrl;
  }

  if (removeActionImages) {
    delete buddyWithoutStoredImages.generatedActionImages;
  }

  return buddyWithoutStoredImages;
}

function getActionImageId(buddyId: string, actionKey: BuddyActionImageKey) {
  return `${buddyId}:action:${actionKey}`;
}

function addOptionalActionImages(buddy: Buddy, actionImages: BuddyActionImages | undefined): Buddy {
  return actionImages ? { ...buddy, generatedActionImages: actionImages } : buddy;
}

function getSavedBuddyId() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return undefined;
    }

    const parsedValue: unknown = JSON.parse(savedValue);
    const buddy = normalizeSavedBuddy(parsedValue);
    return buddy ? buddy.id : undefined;
  } catch {
    return undefined;
  }
}

function normalizeSavedBuddy(value: unknown): Buddy | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Buddy>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.photoDataUrl !== "string" ||
    (typeof candidate.generatedImageDataUrl !== "undefined" &&
      typeof candidate.generatedImageDataUrl !== "string") ||
    (typeof candidate.generatedActionImages !== "undefined" &&
      !isActionImageMap(candidate.generatedActionImages)) ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string" ||
    !candidate.avatarProfile ||
    typeof candidate.avatarProfile !== "object" ||
    !candidate.stats ||
    typeof candidate.stats !== "object" ||
    typeof candidate.stats.affection !== "number" ||
    typeof candidate.stats.hunger !== "number" ||
    typeof candidate.stats.energy !== "number" ||
    typeof candidate.stats.exp !== "number"
  ) {
    return null;
  }

  const buddy: Buddy = {
    id: candidate.id,
    name: candidate.name,
    photoDataUrl: candidate.photoDataUrl,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    lastCareAt: candidate.lastCareAt ?? candidate.updatedAt ?? candidate.createdAt,
    dailyCareStreak: candidate.dailyCareStreak ?? 0,
    coins: typeof candidate.coins === "number" ? candidate.coins : 2530,
    inventory: normalizeInventory(candidate.inventory),
    equippedRoomItemIds: normalizeEquippedRoomItemIds(candidate),
    avatarProfile: candidate.avatarProfile as Buddy["avatarProfile"],
    stats: {
      affection: candidate.stats.affection,
      hunger: candidate.stats.hunger,
      energy: candidate.stats.energy,
      exp: candidate.stats.exp,
    },
  };

  if (candidate.generatedImageDataUrl) {
    buddy.generatedImageDataUrl = candidate.generatedImageDataUrl;
  }

  if (candidate.generatedActionImages) {
    buddy.generatedActionImages = candidate.generatedActionImages;
  }

  if (
    typeof candidate.equippedRoomItemId === "string" &&
    candidate.equippedRoomItemId in SHOP_ITEMS
  ) {
    buddy.equippedRoomItemId = candidate.equippedRoomItemId as BuddyShopItemId;
  }

  if (candidate.lastDailyBonusAt) {
    buddy.lastDailyBonusAt = candidate.lastDailyBonusAt;
  }

  return buddy;
}

function normalizeInventory(value: unknown): BuddyInventory {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<BuddyInventory>((inventory, [itemId, count]) => {
    if (itemId in SHOP_ITEMS && typeof count === "number" && count > 0) {
      inventory[itemId as BuddyShopItemId] = count;
    }

    return inventory;
  }, {});
}

function normalizeEquippedRoomItemIds(candidate: Partial<Buddy>): BuddyShopItemId[] {
  const inventory = normalizeInventory(candidate.inventory);
  const roomItemIds = [
    ...(Array.isArray(candidate.equippedRoomItemIds) ? candidate.equippedRoomItemIds : []),
    ...(typeof candidate.equippedRoomItemId === "string" ? [candidate.equippedRoomItemId] : []),
  ];

  return Array.from(
    new Set(
      roomItemIds.filter(
        (itemId): itemId is BuddyShopItemId =>
          itemId in SHOP_ITEMS &&
          SHOP_ITEMS[itemId as BuddyShopItemId].type === "room" &&
          !!inventory[itemId as BuddyShopItemId],
      ),
    ),
  );
}

function isActionImageMap(value: unknown): value is BuddyActionImages {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return Object.entries(candidate).every(
    ([key, imageDataUrl]) =>
      ACTION_IMAGE_KEYS.includes(key as BuddyActionImageKey) &&
      typeof imageDataUrl === "string",
  );
}

function getReturnMessage(elapsedHours: number, didDecay: boolean) {
  if (!didDecay) {
    return "";
  }

  if (elapsedHours >= 24) {
    const days = Math.floor(elapsedHours / 24);
    return days > 1
      ? `${days}일 만에 다시 만났어요. 버디가 조용히 기다리고 있었어요.`
      : "하루 만에 다시 만났어요. 버디가 조금 배고파졌어요.";
  }

  return "잠시 떨어져 있는 동안 버디가 조금 쉬고 있었어요.";
}
