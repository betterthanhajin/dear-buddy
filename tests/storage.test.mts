import assert from "node:assert/strict";
import test from "node:test";

import { createBuddy } from "../lib/buddy.ts";
import { clearSavedBuddy, loadSavedBuddy, saveBuddy } from "../lib/storage.ts";

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

test("saveBuddy and loadSavedBuddy persist the current buddy", () => {
  useMemoryStorage();
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  const result = saveBuddy(buddy);

  assert.equal(result.ok, true);
  assert.deepEqual(loadSavedBuddy(), buddy);
});

test("loadSavedBuddy returns null for malformed saved data", () => {
  const storage = useMemoryStorage();
  storage.setItem("dear-buddy.saved-buddy.v1", JSON.stringify({ name: "broken" }));

  assert.equal(loadSavedBuddy(), null);
});

test("saveBuddy falls back to the avatar profile when the generated image is too large", () => {
  useQuotaStorage(1800);
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
    generatedImageDataUrl: `data:image/png;base64,${"a".repeat(3000)}`,
  });

  const result = saveBuddy(buddy);
  const savedBuddy = loadSavedBuddy();

  assert.equal(result.ok, true);
  assert.equal(savedBuddy?.name, "몽실이");
  assert.equal(savedBuddy?.generatedImageDataUrl, undefined);
  assert.deepEqual(savedBuddy?.stats, buddy.stats);
  assert.deepEqual(savedBuddy?.avatarProfile, buddy.avatarProfile);
});

test("clearSavedBuddy removes the persisted buddy", () => {
  useMemoryStorage();
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  saveBuddy(buddy);
  clearSavedBuddy();

  assert.equal(loadSavedBuddy(), null);
});
