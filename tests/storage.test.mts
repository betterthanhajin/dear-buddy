import assert from "node:assert/strict";
import test from "node:test";

import { createBuddy } from "../lib/buddy.ts";
import {
  clearSavedBuddy,
  type BuddyImageStore,
  loadSavedBuddy,
  saveBuddy,
} from "../lib/storage.ts";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

class QuotaStorage extends MemoryStorage {
  private readonly maxLength: number;

  constructor(maxLength: number) {
    super();
    this.maxLength = maxLength;
  }

  setItem(key: string, value: string) {
    if (value.length > this.maxLength) {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }

    super.setItem(key, value);
  }
}

function useMemoryStorage() {
  const storage = new MemoryStorage();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  return storage;
}

function useQuotaStorage(maxLength: number) {
  const storage = new QuotaStorage(maxLength);

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  return storage;
}

function createMemoryImageStore(): BuddyImageStore {
  const images = new Map<string, string>();

  return {
    async delete(id: string) {
      images.delete(id);
    },
    async load(id: string) {
      return images.get(id);
    },
    async save(id: string, imageDataUrl: string) {
      images.set(id, imageDataUrl);
    },
  };
}

test("saveBuddy and loadSavedBuddy persist the current buddy", async () => {
  useMemoryStorage();
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  const result = await saveBuddy(buddy);

  assert.equal(result.ok, true);
  assert.deepEqual(await loadSavedBuddy(), buddy);
});

test("loadSavedBuddy returns null for malformed saved data", async () => {
  const storage = useMemoryStorage();
  storage.setItem("dear-buddy.saved-buddy.v1", JSON.stringify({ name: "broken" }));

  assert.equal(await loadSavedBuddy(), null);
});

test("saveBuddy stores large generated images outside localStorage and restores them", async () => {
  useQuotaStorage(1800);
  const imageStore = createMemoryImageStore();
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
    generatedImageDataUrl: `data:image/png;base64,${"a".repeat(3000)}`,
  });

  const result = await saveBuddy(buddy, imageStore);
  const savedBuddy = await loadSavedBuddy(imageStore);

  assert.equal(result.ok, true);
  assert.deepEqual(savedBuddy, buddy);
});

test("saveBuddy falls back to the avatar profile when image storage fails", async () => {
  useQuotaStorage(1800);
  const imageStore: BuddyImageStore = {
    async delete() {},
    async load() {
      return undefined;
    },
    async save() {
      throw new Error("image store unavailable");
    },
  };
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
    generatedImageDataUrl: `data:image/png;base64,${"a".repeat(3000)}`,
  });

  const result = await saveBuddy(buddy, imageStore);
  const savedBuddy = await loadSavedBuddy(imageStore);

  assert.equal(result.ok, true);
  assert.equal(savedBuddy?.name, "몽실이");
  assert.equal(savedBuddy?.generatedImageDataUrl, undefined);
  assert.deepEqual(savedBuddy?.stats, buddy.stats);
  assert.deepEqual(savedBuddy?.avatarProfile, buddy.avatarProfile);
});

test("clearSavedBuddy removes the persisted buddy", async () => {
  useMemoryStorage();
  const imageStore = createMemoryImageStore();
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  await saveBuddy(buddy, imageStore);
  await clearSavedBuddy(imageStore, buddy.id);

  assert.equal(await loadSavedBuddy(imageStore), null);
});
