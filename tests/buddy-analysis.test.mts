import assert from "node:assert/strict";
import test from "node:test";

import {
  createAnalyzedAvatarProfile,
  normalizeBuddyAnalysis,
} from "../lib/buddy-analysis.ts";

test("normalizeBuddyAnalysis keeps a detected seal plush instead of forcing dog or generic plush", () => {
  const analysis = normalizeBuddyAnalysis({
    species: "seal",
    displayLabel: "하얀 물개 인형",
    confidence: 0.91,
    primaryColor: "#f7f2ea",
    secondaryColor: "#cfd8dc",
    accentColor: "#6b7280",
    earStyle: "none",
    muzzleStyle: "round",
    bodyShape: "oval",
    markings: ["작은 검은 코", "둥근 앞발"],
    personality: "느긋하고 폭신함",
  });

  assert.equal(analysis.species, "seal");
  assert.equal(analysis.displayLabel, "하얀 물개 인형");
  assert.equal(analysis.earStyle, "none");
  assert.equal(analysis.bodyShape, "oval");
  assert.deepEqual(analysis.markings, ["작은 검은 코", "둥근 앞발"]);
});

test("normalizeBuddyAnalysis falls back to a custom plush when API output is incomplete", () => {
  const analysis = normalizeBuddyAnalysis({
    species: "unknown",
    confidence: 2,
    primaryColor: "brown",
    markings: ["a", "b", "c", "d", "e"],
  });

  assert.equal(analysis.species, "custom");
  assert.equal(analysis.displayLabel, "사진 속 버디");
  assert.equal(analysis.confidence, 1);
  assert.equal(analysis.primaryColor, "#d9b99b");
  assert.equal(analysis.secondaryColor, "#f4d7bf");
  assert.equal(analysis.accentColor, "#8f6044");
  assert.deepEqual(analysis.markings, ["a", "b", "c"]);
});

test("createAnalyzedAvatarProfile preserves detected species traits for the avatar", () => {
  const profile = createAnalyzedAvatarProfile({
    species: "dog",
    displayLabel: "갈색 강아지",
    confidence: 0.87,
    primaryColor: "#b77b4f",
    secondaryColor: "#f1d1b0",
    accentColor: "#5d3a24",
    earStyle: "floppy",
    muzzleStyle: "snout",
    bodyShape: "round",
    markings: ["흰 주둥이"],
    personality: "활발함",
  });

  assert.equal(profile.species, "dog");
  assert.equal(profile.displayLabel, "갈색 강아지");
  assert.equal(profile.bodyColor, "#b77b4f");
  assert.equal(profile.secondaryColor, "#f1d1b0");
  assert.equal(profile.accentColor, "#5d3a24");
  assert.equal(profile.earShape, "floppy");
  assert.equal(profile.muzzleStyle, "snout");
  assert.equal(profile.bodyShape, "round");
});
