export type BuddyMood = "happy" | "sad" | "sleep" | "hungry";

export type BuddyAction = "pet" | "feed" | "play" | "rest";
export type BuddyActionImageKey = "idle" | BuddyAction;
export type BuddyActionImages = Partial<Record<BuddyActionImageKey, string>>;
export type BuddyShopItemId = "fish-snack" | "pink-rug" | "beach-ball";
export type BuddyInventory = Partial<Record<BuddyShopItemId, number>>;

export type BuddyStats = {
  affection: number;
  hunger: number;
  energy: number;
  exp: number;
};

export type AvatarProfile = {
  species?: import("./buddy-analysis").BuddySpecies;
  displayLabel?: string;
  bodyColor: string;
  secondaryColor?: string;
  accentColor: string;
  earShape: "round" | "floppy" | "pointy";
  accessory: "ribbon" | "patch" | "star";
  cheekStyle: "dot" | "oval" | "none";
  muzzleStyle?: "none" | "round" | "snout" | "beak";
  bodyShape?: "round" | "oval" | "pear";
  markings?: string[];
};

export type Buddy = {
  id: string;
  name: string;
  photoDataUrl: string;
  generatedImageDataUrl?: string;
  generatedActionImages?: BuddyActionImages;
  coins: number;
  inventory: BuddyInventory;
  equippedRoomItemId?: BuddyShopItemId;
  createdAt: string;
  updatedAt: string;
  lastCareAt: string;
  lastDailyBonusAt?: string;
  dailyCareStreak: number;
  avatarProfile: AvatarProfile;
  stats: BuddyStats;
};

type CreateBuddyInput = {
  name: string;
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
  avatarProfile?: AvatarProfile;
  generatedImageDataUrl?: string;
  generatedActionImages?: BuddyActionImages;
};

type CreateAvatarProfileInput = {
  seed: string;
  dominantColor: string;
  accentColor: string;
};

const DEFAULT_STATS: BuddyStats = {
  affection: 35,
  hunger: 75,
  energy: 70,
  exp: 0,
};
const DEFAULT_COINS = 2530;

const ACTION_DELTAS: Record<BuddyAction, Partial<BuddyStats>> = {
  pet: { affection: 4, exp: 4 },
  feed: { hunger: 18, affection: 2, exp: 6 },
  play: { affection: 6, hunger: -10, energy: -12, exp: 14 },
  rest: { energy: 22, hunger: -4, exp: 4 },
};

const PASSIVE_STAT_FLOOR = 10;
const DAILY_BONUS_EXP = 10;
export const MINI_GAME_REWARD = {
  coins: 30,
  exp: 12,
  itemId: "beach-ball" as const,
};
export const SHOP_ITEMS: Record<
  BuddyShopItemId,
  { description: string; label: string; price: number; type: "consumable" | "room" | "toy" }
> = {
  "fish-snack": {
    description: "포만감을 채우는 작은 간식이에요.",
    label: "생선 간식",
    price: 120,
    type: "consumable",
  },
  "pink-rug": {
    description: "방을 폭신하게 바꾸는 러그예요.",
    label: "핑크 러그",
    price: 180,
    type: "room",
  },
  "beach-ball": {
    description: "놀이 보상으로도 얻을 수 있는 공이에요.",
    label: "비치볼",
    price: 160,
    type: "toy",
  },
};
export const ROOM_ITEMS: BuddyShopItemId[] = ["pink-rug"];

export function clampStat(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

export function getBuddyLevel(exp: number) {
  return {
    level: Math.floor(exp / 100) + 1,
    progress: exp % 100,
  };
}

export function getBuddyMood(stats: BuddyStats): BuddyMood {
  if (stats.energy <= 20) {
    return "sleep";
  }

  if (stats.hunger <= 25) {
    return "hungry";
  }

  if (stats.affection <= 25) {
    return "sad";
  }

  return "happy";
}

export function createAvatarProfile({
  seed,
  dominantColor,
  accentColor,
}: CreateAvatarProfileInput): AvatarProfile {
  const hash = hashString(seed);
  const earShapes: AvatarProfile["earShape"][] = ["round", "floppy", "pointy"];
  const accessories: AvatarProfile["accessory"][] = ["ribbon", "patch", "star"];
  const cheekStyles: AvatarProfile["cheekStyle"][] = ["dot", "oval", "none"];

  return {
    bodyColor: dominantColor,
    accentColor,
    earShape: earShapes[hash % earShapes.length],
    accessory: accessories[Math.floor(hash / 3) % accessories.length],
    cheekStyle: cheekStyles[Math.floor(hash / 9) % cheekStyles.length],
  };
}

export function createBuddy({
  name,
  photoDataUrl,
  dominantColor,
  accentColor,
  avatarProfile,
  generatedActionImages,
  generatedImageDataUrl,
}: CreateBuddyInput, nowDate = new Date()): Buddy {
  const now = nowDate.toISOString();

  const buddy: Buddy = {
    id: crypto.randomUUID(),
    name: name.trim(),
    photoDataUrl,
    createdAt: now,
    updatedAt: now,
    lastCareAt: now,
    dailyCareStreak: 0,
    coins: DEFAULT_COINS,
    inventory: {},
    avatarProfile:
      avatarProfile ??
      createAvatarProfile({
        seed: `${name}:${photoDataUrl.slice(0, 96)}`,
        dominantColor,
        accentColor,
      }),
    stats: { ...DEFAULT_STATS },
  };

  if (generatedImageDataUrl) {
    buddy.generatedImageDataUrl = generatedImageDataUrl;
  }

  if (generatedActionImages && Object.keys(generatedActionImages).length > 0) {
    buddy.generatedActionImages = generatedActionImages;
  }

  return buddy;
}

export function buyBuddyItem(buddy: Buddy, itemId: BuddyShopItemId) {
  const item = SHOP_ITEMS[itemId];

  if (buddy.coins < item.price) {
    return {
      ok: false as const,
      buddy,
      message: "코인이 부족해요.",
    };
  }

  return {
    ok: true as const,
    buddy: {
      ...buddy,
      coins: buddy.coins - item.price,
      inventory: addInventoryItem(buddy.inventory, itemId),
      updatedAt: new Date().toISOString(),
    },
    message: `${item.label}을 구매했어요.`,
  };
}

export function equipBuddyRoomItem(buddy: Buddy, itemId: BuddyShopItemId) {
  const item = SHOP_ITEMS[itemId];

  if (!ROOM_ITEMS.includes(itemId)) {
    return {
      ok: false as const,
      buddy,
      message: "방에 배치할 수 없는 아이템이에요.",
    };
  }

  if (!buddy.inventory[itemId]) {
    return {
      ok: false as const,
      buddy,
      message: "아직 가지고 있지 않은 아이템이에요.",
    };
  }

  return {
    ok: true as const,
    buddy: {
      ...buddy,
      equippedRoomItemId: itemId,
      updatedAt: new Date().toISOString(),
    },
    message: `${item.label}를 방에 배치했어요.`,
  };
}

export function claimMiniGameReward(buddy: Buddy) {
  return {
    buddy: {
      ...buddy,
      coins: buddy.coins + MINI_GAME_REWARD.coins,
      inventory: addInventoryItem(buddy.inventory, MINI_GAME_REWARD.itemId),
      stats: {
        ...buddy.stats,
        exp: buddy.stats.exp + MINI_GAME_REWARD.exp,
      },
      updatedAt: new Date().toISOString(),
    },
    message: `공놀이 성공! 코인 +${MINI_GAME_REWARD.coins}, 경험치 +${MINI_GAME_REWARD.exp}를 받았어요.`,
  };
}

export function applyBuddyAction(buddy: Buddy, action: BuddyAction): Buddy {
  const delta = ACTION_DELTAS[action];
  const now = new Date().toISOString();

  return {
    ...buddy,
    updatedAt: now,
    lastCareAt: now,
    stats: {
      affection: clampStat(buddy.stats.affection + (delta.affection ?? 0)),
      hunger: clampStat(buddy.stats.hunger + (delta.hunger ?? 0)),
      energy: clampStat(buddy.stats.energy + (delta.energy ?? 0)),
      exp: buddy.stats.exp + (delta.exp ?? 0),
    },
  };
}

export function applyTimeDecay(buddy: Buddy, nowDate = new Date()) {
  const lastCareDate = parseDate(buddy.lastCareAt) ?? parseDate(buddy.updatedAt) ?? nowDate;
  const elapsedHours = Math.max(
    0,
    Math.floor((nowDate.getTime() - lastCareDate.getTime()) / (60 * 60 * 1000)),
  );
  const sixHourBlocks = Math.floor(elapsedHours / 6);
  const dayBlocks = Math.floor(elapsedHours / 24);

  if (sixHourBlocks === 0 && dayBlocks === 0) {
    return {
      buddy,
      elapsedHours,
      didDecay: false,
    };
  }

  const now = nowDate.toISOString();

  return {
    buddy: {
      ...buddy,
      updatedAt: now,
      lastCareAt: now,
      stats: {
        affection: clampPassiveStat(buddy.stats.affection - dayBlocks * 2),
        hunger: clampPassiveStat(buddy.stats.hunger - sixHourBlocks * 4),
        energy: clampPassiveStat(buddy.stats.energy - sixHourBlocks * 3),
        exp: buddy.stats.exp,
      },
    },
    elapsedHours,
    didDecay: true,
  };
}

export function applyDailyCareBonus(buddy: Buddy, nowDate = new Date()) {
  const lastBonusDate = parseDate(buddy.lastDailyBonusAt);

  if (lastBonusDate && isSameLocalDay(lastBonusDate, nowDate)) {
    return {
      buddy,
      bonusExp: 0,
      streak: buddy.dailyCareStreak,
      awarded: false,
    };
  }

  const dayGap = lastBonusDate ? getLocalDayGap(lastBonusDate, nowDate) : 0;
  const streak = lastBonusDate && dayGap === 1 ? buddy.dailyCareStreak + 1 : 1;
  const now = nowDate.toISOString();

  return {
    buddy: {
      ...buddy,
      updatedAt: now,
      lastCareAt: now,
      lastDailyBonusAt: now,
      dailyCareStreak: streak,
      stats: {
        ...buddy.stats,
        exp: buddy.stats.exp + DAILY_BONUS_EXP,
      },
    },
    bonusExp: DAILY_BONUS_EXP,
    streak,
    awarded: true,
  };
}

function clampPassiveStat(value: number) {
  return Math.min(Math.max(value, PASSIVE_STAT_FLOOR), 100);
}

function addInventoryItem(inventory: BuddyInventory, itemId: BuddyShopItemId): BuddyInventory {
  return {
    ...inventory,
    [itemId]: (inventory[itemId] ?? 0) + 1,
  };
}

function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(first: Date, second: Date) {
  return getLocalDayKey(first) === getLocalDayKey(second);
}

function getLocalDayGap(first: Date, second: Date) {
  const firstMidnight = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const secondMidnight = new Date(second.getFullYear(), second.getMonth(), second.getDate());

  return Math.floor((secondMidnight.getTime() - firstMidnight.getTime()) / (24 * 60 * 60 * 1000));
}

function getLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
