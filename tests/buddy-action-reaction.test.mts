import assert from "node:assert/strict";
import test from "node:test";

import { getBuddyActionReaction } from "../lib/buddy-action-reaction.ts";

test("getBuddyActionReaction gives each care action a distinct response", () => {
  assert.deepEqual(getBuddyActionReaction("pet"), {
    message: "좋아서 몸을 부비고 있어요.",
    animationClassName: "buddy-reaction-pet",
    symbol: "♡",
  });
  assert.deepEqual(getBuddyActionReaction("feed"), {
    message: "냠냠, 맛있게 먹었어요.",
    animationClassName: "buddy-reaction-feed",
    symbol: "냠",
  });
  assert.deepEqual(getBuddyActionReaction("play"), {
    message: "신나서 폴짝 뛰고 있어요.",
    animationClassName: "buddy-reaction-play",
    symbol: "!",
  });
  assert.deepEqual(getBuddyActionReaction("rest"), {
    message: "포근하게 쉬고 있어요.",
    animationClassName: "buddy-reaction-rest",
    symbol: "Zz",
  });
});
