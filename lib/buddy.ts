export type BuddyMood = "happy" | "sad" | "sleep" | "hungry";

export type BuddyAction = "pet" | "feed" | "play" | "rest";

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
  createdAt: string;
  updatedAt: string;
  avatarProfile: AvatarProfile;
  stats: BuddyStats;
};

type CreateBuddyInput = {
  name: string;
  photoDataUrl: string;
  dominantColor: string;
  accentColor: string;
  avatarProfile?: AvatarProfile;
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

const ACTION_DELTAS: Record<BuddyAction, Partial<BuddyStats>> = {
  pet: { affection: 4, exp: 4 },
  feed: { hunger: 18, affection: 2, exp: 6 },
  play: { affection: 6, hunger: -10, energy: -12, exp: 14 },
  rest: { energy: 22, hunger: -4, exp: 4 },
};

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
}: CreateBuddyInput): Buddy {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    photoDataUrl,
    createdAt: now,
    updatedAt: now,
    avatarProfile:
      avatarProfile ??
      createAvatarProfile({
        seed: `${name}:${photoDataUrl.slice(0, 96)}`,
        dominantColor,
        accentColor,
      }),
    stats: { ...DEFAULT_STATS },
  };
}

export function applyBuddyAction(buddy: Buddy, action: BuddyAction): Buddy {
  const delta = ACTION_DELTAS[action];

  return {
    ...buddy,
    updatedAt: new Date().toISOString(),
    stats: {
      affection: clampStat(buddy.stats.affection + (delta.affection ?? 0)),
      hunger: clampStat(buddy.stats.hunger + (delta.hunger ?? 0)),
      energy: clampStat(buddy.stats.energy + (delta.energy ?? 0)),
      exp: buddy.stats.exp + (delta.exp ?? 0),
    },
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
