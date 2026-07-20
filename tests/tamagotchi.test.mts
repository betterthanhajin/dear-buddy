import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_TAMAGOTCHI_STATE,
  petBuddy,
} from "../lib/tamagotchi.ts";

test("petBuddy increases affection and advances the reaction sequence", () => {
  assert.deepEqual(petBuddy(INITIAL_TAMAGOTCHI_STATE), {
    affection: 88,
    reactionId: 1,
  });
});

test("petBuddy caps affection at 99", () => {
  const state = { affection: 99, reactionId: 4 };

  assert.strictEqual(petBuddy(state), state);
});
