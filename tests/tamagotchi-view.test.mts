import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the tamagotchi device exposes the three physical controls", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /aria-label="메뉴 버튼 준비 중"/);
  assert.match(source, /aria-label="버디 쓰다듬기"/);
  assert.match(source, /aria-label="더보기 버튼 준비 중"/);
});

test("the tamagotchi device uses the supplied frame and generated pet assets", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /\/tamagotchi\/tv-frame\.png/);
  assert.match(source, /\/tamagotchi\/idle-pet\.png/);
});

test("the animated pet and reaction use distinct React keys", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /key={`pet-\${state\.reactionId}`}/);
  assert.match(source, /key={`reaction-\${state\.reactionId}`}/);
});

test("the tamagotchi state is exposed to assistive technology", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.tsx"),
    "utf8",
  );

  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuenow={currentValue}/);
});

test("short viewports and reduced motion keep the device bounded", () => {
  const source = readFileSync(
    resolve(repoRoot, "components/TamagotchiDevice.module.css"),
    "utf8",
  );

  assert.match(source, /calc\(\(100svh - 32px\) \* 2 \/ 3\)/);
  assert.match(
    source,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.reaction\s*{[\s\S]*?display: none;/,
  );
});
