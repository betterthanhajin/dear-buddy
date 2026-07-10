import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBuddyAction,
  createAvatarProfile,
  createBuddy,
  getBuddyLevel,
  getBuddyMood,
} from "../lib/buddy.ts";

test("createBuddy stores a named buddy with generated avatar profile and initial stats", () => {
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  assert.equal(buddy.name, "몽실이");
  assert.equal(buddy.photoDataUrl, "data:image/png;base64,abc");
  assert.equal(buddy.avatarProfile.bodyColor, "#c58b63");
  assert.equal(buddy.stats.affection, 35);
  assert.equal(buddy.stats.hunger, 75);
  assert.equal(buddy.stats.energy, 70);
  assert.equal(buddy.stats.exp, 0);
});

test("applyBuddyAction updates stats and clamps values", () => {
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  const played = applyBuddyAction(buddy, "play");
  assert.equal(played.stats.affection, 41);
  assert.equal(played.stats.hunger, 65);
  assert.equal(played.stats.energy, 58);
  assert.equal(played.stats.exp, 14);

  const rested = Array.from({ length: 5 }).reduce(
    (current) => applyBuddyAction(current, "rest"),
    played,
  );

  assert.equal(rested.stats.energy, 100);
});

test("getBuddyLevel derives level and progress from total experience", () => {
  assert.deepEqual(getBuddyLevel(0), { level: 1, progress: 0 });
  assert.deepEqual(getBuddyLevel(240), { level: 3, progress: 40 });
});

test("getBuddyMood prioritizes sleep, hunger, sadness, then happiness", () => {
  assert.equal(getBuddyMood({ affection: 80, hunger: 80, energy: 10, exp: 0 }), "sleep");
  assert.equal(getBuddyMood({ affection: 80, hunger: 20, energy: 80, exp: 0 }), "hungry");
  assert.equal(getBuddyMood({ affection: 15, hunger: 80, energy: 80, exp: 0 }), "sad");
  assert.equal(getBuddyMood({ affection: 80, hunger: 80, energy: 80, exp: 0 }), "happy");
});

test("createAvatarProfile is deterministic for the same seed", () => {
  const first = createAvatarProfile({
    seed: "same-plush",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });
  const second = createAvatarProfile({
    seed: "same-plush",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  assert.deepEqual(first, second);
});
