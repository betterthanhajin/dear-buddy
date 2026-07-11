import assert from "node:assert/strict";
import test from "node:test";

import {
  getBuddyCreationStatus,
  type BuddyCreationStage,
} from "../lib/buddy-creation-status.ts";

test("getBuddyCreationStatus explains each slow creation stage", () => {
  const stages: BuddyCreationStage[] = ["idle", "reading", "analyzing", "generating"];

  assert.deepEqual(
    stages.map((stage) => getBuddyCreationStatus(stage).message),
    [
      "",
      "사진을 불러오고 있어요.",
      "사진 속 버디를 살펴보고 있어요.",
      "버디 이미지를 그리고 있어요. 잠시만 기다려 주세요.",
    ],
  );
});

test("getBuddyCreationStatus only blocks submission while remote creation is running", () => {
  assert.equal(getBuddyCreationStatus("idle").isBusy, false);
  assert.equal(getBuddyCreationStatus("reading").isBusy, true);
  assert.equal(getBuddyCreationStatus("analyzing").isBusy, true);
  assert.equal(getBuddyCreationStatus("generating").isBusy, true);
});
