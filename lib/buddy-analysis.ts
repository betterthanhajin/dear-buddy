import type { AvatarProfile } from "./buddy";

export type BuddySpecies =
  | "custom"
  | "dog"
  | "cat"
  | "rabbit"
  | "bear"
  | "seal"
  | "penguin"
  | "bird"
  | "fox"
  | "frog"
  | "sheep"
  | "koala"
  | "panda";

export type BuddyAnalysis = {
  species: BuddySpecies;
  displayLabel: string;
  confidence: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  earStyle: "round" | "floppy" | "pointy" | "small" | "none";
  muzzleStyle: "none" | "round" | "snout" | "beak";
  bodyShape: "round" | "oval" | "pear";
  markings: string[];
  personality: string;
};

const SPECIES: BuddySpecies[] = [
  "custom",
  "dog",
  "cat",
  "rabbit",
  "bear",
  "seal",
  "penguin",
  "bird",
  "fox",
  "frog",
  "sheep",
  "koala",
  "panda",
];

const DEFAULT_ANALYSIS: BuddyAnalysis = {
  species: "custom",
  displayLabel: "사진 속 버디",
  confidence: 0,
  primaryColor: "#d9b99b",
  secondaryColor: "#f4d7bf",
  accentColor: "#8f6044",
  earStyle: "round",
  muzzleStyle: "round",
  bodyShape: "round",
  markings: [],
  personality: "다정함",
};

export function normalizeBuddyAnalysis(value: unknown): BuddyAnalysis {
  const candidate = isRecord(value) ? value : {};
  const species = normalizeSpecies(candidate.species);

  return {
    species,
    displayLabel: normalizeText(candidate.displayLabel, DEFAULT_ANALYSIS.displayLabel),
    confidence: normalizeConfidence(candidate.confidence),
    primaryColor: normalizeHex(candidate.primaryColor, DEFAULT_ANALYSIS.primaryColor),
    secondaryColor: normalizeHex(candidate.secondaryColor, DEFAULT_ANALYSIS.secondaryColor),
    accentColor: normalizeHex(candidate.accentColor, DEFAULT_ANALYSIS.accentColor),
    earStyle: normalizeChoice(candidate.earStyle, ["round", "floppy", "pointy", "small", "none"], getDefaultEarStyle(species)),
    muzzleStyle: normalizeChoice(candidate.muzzleStyle, ["none", "round", "snout", "beak"], getDefaultMuzzleStyle(species)),
    bodyShape: normalizeChoice(candidate.bodyShape, ["round", "oval", "pear"], getDefaultBodyShape(species)),
    markings: normalizeMarkings(candidate.markings),
    personality: normalizeText(candidate.personality, DEFAULT_ANALYSIS.personality),
  };
}

export function createAnalyzedAvatarProfile(analysis: BuddyAnalysis): AvatarProfile {
  const normalized = normalizeBuddyAnalysis(analysis);

  return {
    species: normalized.species,
    displayLabel: normalized.displayLabel,
    bodyColor: normalized.primaryColor,
    secondaryColor: normalized.secondaryColor,
    accentColor: normalized.accentColor,
    earShape: toEarShape(normalized.earStyle, normalized.species),
    accessory: chooseAccessory(normalized),
    cheekStyle: normalized.species === "penguin" || normalized.species === "bird" ? "none" : "oval",
    muzzleStyle: normalized.muzzleStyle,
    bodyShape: normalized.bodyShape,
    markings: normalized.markings,
  };
}

export function getSpeciesLabel(species: BuddySpecies) {
  const labels: Record<BuddySpecies, string> = {
    custom: "사진 속 버디",
    dog: "강아지",
    cat: "고양이",
    rabbit: "토끼",
    bear: "곰",
    seal: "물개",
    penguin: "펭귄",
    bird: "새",
    fox: "여우",
    frog: "개구리",
    sheep: "양",
    koala: "코알라",
    panda: "판다",
  };

  return labels[species];
}

function normalizeSpecies(value: unknown): BuddySpecies {
  return typeof value === "string" && SPECIES.includes(value as BuddySpecies)
    ? (value as BuddySpecies)
    : "custom";
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return /^#[\da-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 32) : fallback;
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_ANALYSIS.confidence;
  }

  return Math.min(Math.max(value, 0), 1);
}

function normalizeChoice<const T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && choices.includes(value as T) ? (value as T) : fallback;
}

function normalizeMarkings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 24))
    .slice(0, 3);
}

function toEarShape(earStyle: BuddyAnalysis["earStyle"], species: BuddySpecies) {
  if (earStyle === "none") {
    return species === "seal" || species === "penguin" || species === "bird" || species === "frog"
      ? "round"
      : "round";
  }

  if (earStyle === "small") {
    return "round";
  }

  return earStyle;
}

function chooseAccessory(analysis: BuddyAnalysis): AvatarProfile["accessory"] {
  if (analysis.markings.some((marking) => marking.includes("별"))) {
    return "star";
  }

  if (analysis.species === "panda" || analysis.species === "penguin") {
    return "patch";
  }

  return "ribbon";
}

function getDefaultEarStyle(species: BuddySpecies): BuddyAnalysis["earStyle"] {
  if (species === "dog") {
    return "floppy";
  }

  if (species === "cat" || species === "fox") {
    return "pointy";
  }

  if (species === "seal" || species === "penguin" || species === "bird" || species === "frog") {
    return "none";
  }

  return "round";
}

function getDefaultMuzzleStyle(species: BuddySpecies): BuddyAnalysis["muzzleStyle"] {
  if (species === "bird" || species === "penguin") {
    return "beak";
  }

  if (species === "dog" || species === "cat" || species === "fox") {
    return "snout";
  }

  return "round";
}

function getDefaultBodyShape(species: BuddySpecies): BuddyAnalysis["bodyShape"] {
  if (species === "seal" || species === "penguin") {
    return "oval";
  }

  if (species === "bird" || species === "frog") {
    return "pear";
  }

  return "round";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
