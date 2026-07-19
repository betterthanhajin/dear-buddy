import assert from "node:assert/strict";
import test from "node:test";

import { getRoomPreviewClassName } from "../lib/room-presentation.ts";

test("getRoomPreviewClassName includes equipped item depth and drop states", () => {
  assert.equal(
    getRoomPreviewClassName(["pink-rug", "cozy-bed"], "cozy-bed"),
    "retro-room-preview has-pink-rug has-cozy-bed is-dragging-furniture is-drop-ready",
  );
});

test("getRoomPreviewClassName does not mark non-room items as drop ready", () => {
  assert.equal(
    getRoomPreviewClassName(["pink-rug"], "fish-snack"),
    "retro-room-preview has-pink-rug is-dragging-furniture",
  );
});
