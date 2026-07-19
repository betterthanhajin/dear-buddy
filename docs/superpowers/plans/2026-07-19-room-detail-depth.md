# Room Detail Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual depth to the existing decor room while preserving the current drag-and-drop furniture behavior.

**Architecture:** Extract pure room class-name and placement helpers into `lib/room-presentation.ts` so the React component stays focused on interaction. Add decorative DOM layers in `components/BuddyCarePanel.tsx` and style them in `app/globals.css`.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, CSS gradients, Node test runner.

## Global Constraints

- Do not call paid OpenAI or image generation APIs.
- Do not change the overall color direction, typography, or app shell layout.
- Keep drag-and-drop furniture placement behavior unchanged.
- Keep the current local storage model unchanged.
- Use CSS and existing item ids only.

---

### Task 1: Room Presentation Helper

**Files:**
- Create: `lib/room-presentation.ts`
- Test: `tests/room-presentation.test.mts`
- Modify: `components/BuddyCarePanel.tsx`

**Interfaces:**
- Consumes: `Buddy`, `BuddyShopItemId`, `BuddyRoomItemPlacement`, `ROOM_ITEMS` from `lib/buddy.ts`.
- Produces: `getRoomPreviewClassName(equippedRoomItemIds: BuddyShopItemId[], draggingItemId?: BuddyShopItemId): string` and `getRoomItemPlacement(buddy: Buddy, itemId: BuddyShopItemId): BuddyRoomItemPlacement`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/room-presentation.test.mts`

Expected: FAIL because `lib/room-presentation.ts` does not exist.

- [ ] **Step 3: Add the helper and import it in the component**

Create `lib/room-presentation.ts` with the helper functions and remove the local duplicate helpers from `components/BuddyCarePanel.tsx`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- tests/room-presentation.test.mts`

Expected: PASS.

### Task 2: Decorative Room Depth Layers

**Files:**
- Modify: `components/BuddyCarePanel.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `retro-room-preview`, `retro-room-window`, `retro-room-shelf`, `retro-room-buddy`, and `retro-room-furniture`.
- Produces: Decorative classes `retro-room-wall-light`, `retro-room-baseboard`, `retro-room-floor-grid`, and richer shadow treatment.

- [ ] **Step 1: Add decorative layer markup**

Insert `retro-room-wall-light`, `retro-room-baseboard`, and `retro-room-floor-grid` inside the room preview before furniture.

- [ ] **Step 2: Add CSS depth details**

Update `app/globals.css` so the room has wall/floor separation, soft window light, floor grid, baseboard, contact shadows under furniture, and buddy floor shadow.

- [ ] **Step 3: Run verification**

Run: `npm test`, `npm run lint`, and `npm run build`.

Expected: all commands pass.

### Task 3: Mobile Visual Check

**Files:**
- No source changes unless the screenshot reveals layout defects.

**Interfaces:**
- Consumes: the local Next dev server on port 3000.
- Produces: a mobile quick tunnel URL for review and a PROJECT.md action log.

- [ ] **Step 1: Start local dev server**

Run: `npm run dev`.

- [ ] **Step 2: Open quick tunnel**

Run: `cloudflared tunnel --url http://localhost:3000`.

- [ ] **Step 3: Verify mobile room**

Use browser automation at a mobile viewport to confirm the room renders nonblank, decorative layers do not block furniture dragging, and text does not overlap.

- [ ] **Step 4: Update PROJECT.md and commit**

Add a recent action log entry and commit the implementation.
