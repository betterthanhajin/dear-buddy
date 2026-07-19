import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBuddyAction,
  applyBuddyItemEffect,
  applyDailyCareBonus,
  applyTimeDecay,
  buyBuddyItem,
  claimMiniGameReward,
  createAvatarProfile,
  createBuddy,
  equipBuddyRoomItem,
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
  assert.equal(buddy.coins, 2530);
  assert.deepEqual(buddy.inventory, {});
  assert.equal(buddy.equippedRoomItemId, undefined);
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

test("buyBuddyItem spends coins and adds the item to inventory", () => {
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  const result = buyBuddyItem(buddy, "fish-snack");

  assert.equal(result.ok, true);
  assert.equal(result.buddy.coins, 2410);
  assert.equal(result.buddy.inventory["fish-snack"], 1);
  assert.equal(result.message, "생선 간식을 구매했어요.");
});

test("buyBuddyItem rejects purchases when coins are too low", () => {
  const buddy = {
    ...createBuddy({
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    }),
    coins: 10,
  };

  const result = buyBuddyItem(buddy, "pink-rug");

  assert.equal(result.ok, false);
  assert.equal(result.buddy, buddy);
  assert.equal(result.message, "코인이 부족해요.");
});

test("equipBuddyRoomItem equips an owned room item", () => {
  const buddy = {
    ...createBuddy({
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    }),
    inventory: { "pink-rug": 1 },
  };

  const result = equipBuddyRoomItem(buddy, "pink-rug");

  assert.equal(result.ok, true);
  assert.equal(result.buddy.equippedRoomItemId, "pink-rug");
  assert.equal(result.message, "핑크 러그를 방에 배치했어요.");
});

test("claimMiniGameReward grants coins, experience, and a beach ball", () => {
  const buddy = createBuddy({
    name: "몽실이",
    photoDataUrl: "data:image/png;base64,abc",
    dominantColor: "#c58b63",
    accentColor: "#f2d0b5",
  });

  const result = claimMiniGameReward(buddy);

  assert.equal(result.buddy.coins, 2560);
  assert.equal(result.buddy.stats.exp, 12);
  assert.equal(result.buddy.inventory["beach-ball"], 1);
  assert.equal(result.message, "공놀이 성공! 코인 +30, 경험치 +12를 받았어요.");
});

test("applyBuddyItemEffect applies consumable item effects and consumes one item", () => {
  const buddy = {
    ...createBuddy({
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    }),
    inventory: { "fish-snack": 1, "beach-ball": 1 },
    stats: { affection: 80, hunger: 70, energy: 70, exp: 0 },
  };

  const fed = applyBuddyItemEffect(buddy, "fish-snack");
  const played = applyBuddyItemEffect(fed.buddy, "beach-ball");

  assert.equal(fed.ok, true);
  assert.equal(fed.buddy.stats.hunger, 95);
  assert.equal(fed.buddy.inventory["fish-snack"], undefined);
  assert.equal(fed.message, "생선 간식을 먹었어요. 포만감이 올랐어요.");
  assert.equal(played.ok, true);
  assert.equal(played.buddy.stats.affection, 88);
  assert.equal(played.buddy.stats.exp, 10);
  assert.equal(played.buddy.inventory["beach-ball"], undefined);
  assert.equal(played.message, "비치볼로 놀았어요. 행복도와 경험치가 올랐어요.");
});

test("applyBuddyItemEffect equips room items without consuming them", () => {
  const buddy = {
    ...createBuddy({
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    }),
    inventory: { "pink-rug": 1 },
  };

  const result = applyBuddyItemEffect(buddy, "pink-rug");

  assert.equal(result.ok, true);
  assert.equal(result.buddy.equippedRoomItemId, "pink-rug");
  assert.equal(result.buddy.inventory["pink-rug"], 1);
  assert.equal(result.message, "핑크 러그를 방에 배치했어요.");
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

test("applyTimeDecay gently lowers stats after full six hour blocks", () => {
  const buddy = createBuddy(
    {
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    },
    new Date("2026-07-17T00:00:00.000Z"),
  );

  const result = applyTimeDecay(buddy, new Date("2026-07-18T06:30:00.000Z"));

  assert.equal(result.elapsedHours, 30);
  assert.equal(result.didDecay, true);
  assert.equal(result.buddy.stats.hunger, 55);
  assert.equal(result.buddy.stats.energy, 55);
  assert.equal(result.buddy.stats.affection, 33);
  assert.equal(result.buddy.lastCareAt, "2026-07-18T06:30:00.000Z");
});

test("applyTimeDecay does not lower passive stats below ten", () => {
  const buddy = {
    ...createBuddy(
      {
        name: "몽실이",
        photoDataUrl: "data:image/png;base64,abc",
        dominantColor: "#c58b63",
        accentColor: "#f2d0b5",
      },
      new Date("2026-07-10T00:00:00.000Z"),
    ),
    stats: { affection: 12, hunger: 12, energy: 12, exp: 0 },
  };

  const result = applyTimeDecay(buddy, new Date("2026-07-18T00:00:00.000Z"));

  assert.deepEqual(result.buddy.stats, {
    affection: 10,
    hunger: 10,
    energy: 10,
    exp: 0,
  });
});

test("applyDailyCareBonus awards once per local day and increases streak", () => {
  const buddy = createBuddy(
    {
      name: "몽실이",
      photoDataUrl: "data:image/png;base64,abc",
      dominantColor: "#c58b63",
      accentColor: "#f2d0b5",
    },
    new Date("2026-07-17T08:00:00.000+09:00"),
  );

  const first = applyDailyCareBonus(buddy, new Date("2026-07-17T09:00:00.000+09:00"));
  const duplicate = applyDailyCareBonus(first.buddy, new Date("2026-07-17T21:00:00.000+09:00"));
  const nextDay = applyDailyCareBonus(first.buddy, new Date("2026-07-18T09:00:00.000+09:00"));

  assert.equal(first.awarded, true);
  assert.equal(first.bonusExp, 10);
  assert.equal(first.streak, 1);
  assert.equal(duplicate.awarded, false);
  assert.equal(duplicate.bonusExp, 0);
  assert.equal(nextDay.awarded, true);
  assert.equal(nextDay.streak, 2);
  assert.equal(nextDay.buddy.stats.exp, 20);
});

test("applyDailyCareBonus resets streak after missing a local day", () => {
  const buddy = {
    ...createBuddy(
      {
        name: "몽실이",
        photoDataUrl: "data:image/png;base64,abc",
        dominantColor: "#c58b63",
        accentColor: "#f2d0b5",
      },
      new Date("2026-07-15T08:00:00.000+09:00"),
    ),
    dailyCareStreak: 3,
    lastDailyBonusAt: "2026-07-15T08:00:00.000+09:00",
  };

  const result = applyDailyCareBonus(buddy, new Date("2026-07-18T09:00:00.000+09:00"));

  assert.equal(result.awarded, true);
  assert.equal(result.streak, 1);
  assert.equal(result.buddy.dailyCareStreak, 1);
});
