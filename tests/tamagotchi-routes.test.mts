import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the backup route preserves the previous Dear Buddy app", () => {
  const source = readFileSync(resolve(repoRoot, "app/backup/page.tsx"), "utf8");

  assert.match(source, /DearBuddyApp/);
});
