# Shop Decor Play MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the visible shop, decorating, and play buttons perform small persisted actions.

**Architecture:** Extend the existing `Buddy` state with coins, inventory, and one equipped room item. Keep feature logic in `lib/buddy.ts`, persistence migration in `lib/storage.ts`, and render all MVP panels inside `components/BuddyCarePanel.tsx` without adding routing.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner, localStorage plus IndexedDB image storage.

## Global Constraints

- No paid API calls for this feature.
- Keep the pastel retro pixel UI direction already selected by the user.
- Use TDD for behavior changes.
- Do not create a PR, merge, or push.

---

### Task 1: Buddy Economy State

**Files:**
- Modify: `lib/buddy.ts`
- Modify: `lib/storage.ts`
- Test: `tests/buddy.test.mts`
- Test: `tests/storage.test.mts`

**Interfaces:**
- Produces: `SHOP_ITEMS`, `ROOM_ITEMS`, `MINI_GAME_REWARD`, `buyBuddyItem(buddy, itemId)`, `equipBuddyRoomItem(buddy, itemId)`, `claimMiniGameReward(buddy)`.

- [ ] Write failing tests for default coins, item purchase, failed purchase, room item equip, mini-game reward, and old save migration.
- [ ] Run targeted tests and confirm they fail because functions and fields are missing.
- [ ] Add minimal types/functions in `lib/buddy.ts`.
- [ ] Migrate old saved buddies in `lib/storage.ts`.
- [ ] Run targeted tests and confirm they pass.

### Task 2: Interactive Panels

**Files:**
- Modify: `components/BuddyCarePanel.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 1 functions and constants.

- [ ] Add local `activeView` state for `home`, `shop`, `decor`, `play`, `dex`, `settings`.
- [ ] Wire bottom nav and top tabs to switch visible panels.
- [ ] Render shop cards that call `buyBuddyItem`.
- [ ] Render decorating cards that call `equipBuddyRoomItem`.
- [ ] Render one play panel button that calls `claimMiniGameReward`.
- [ ] Keep existing care actions visible on home/dex.

### Task 3: Verification And Mobile Tunnel

**Files:**
- Modify: `projects/dear-buddy/PROJECT.md`

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start dev server and cloudflared quick tunnel.
- [ ] Use `agent-browser` mobile viewport to verify bottom nav switches panels.
- [ ] Add one recent action log line to `projects/dear-buddy/PROJECT.md`.
