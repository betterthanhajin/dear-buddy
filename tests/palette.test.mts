import assert from "node:assert/strict";
import test from "node:test";

import { createAccentColor, rgbToHex } from "../lib/palette.ts";

test("rgbToHex formats RGB channel values as a hex color", () => {
  assert.equal(rgbToHex(197, 139, 99), "#c58b63");
});

test("createAccentColor lightens dark dominant colors", () => {
  assert.equal(createAccentColor("#442211"), "#8f7a70");
});

test("createAccentColor darkens light dominant colors", () => {
  assert.equal(createAccentColor("#f2d0b5"), "#c2a691");
});
