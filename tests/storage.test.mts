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

function useMemoryStorage() {
  const storage = new MemoryStorage();

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
