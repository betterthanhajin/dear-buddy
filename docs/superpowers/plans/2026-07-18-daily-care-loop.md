# Daily Care Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gentle time-based care loop that rewards daily returns while keeping old local saves compatible.

**Architecture:** Pure time rules live in `lib/buddy.ts`. Storage normalizes old saves and applies passive decay on load. The care UI displays return and daily bonus feedback without introducing server state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node test runner.

## Global Constraints

- No paid API calls.
- No new dependencies.
- Existing single-buddy localStorage and IndexedDB behavior must keep working.
- Older saved buddies must load without data loss.
- Passive decay must be gentle and never punish the user below stat value 10.

---

### Task 1: Buddy Time Rules

**Files:**
- Modify: `lib/buddy.ts`
- Modify: `tests/buddy.test.mts`

**Interfaces:**
- Produces: `applyTimeDecay(buddy: Buddy, now?: Date): { buddy: Buddy; elapsedHours: number; didDecay: boolean }`
- Produces: `applyDailyCareBonus(buddy: Buddy, now?: Date): { buddy: Buddy; bonusExp: number; streak: number; awarded: boolean }`

- [ ] Write failing tests for passive decay and daily bonus.
- [ ] Run `npm test -- tests/buddy.test.mts` and confirm the new tests fail.
- [ ] Add the new buddy fields and pure helper functions.
- [ ] Run `npm test -- tests/buddy.test.mts` and confirm the tests pass.

### Task 2: Storage Migration

**Files:**
- Modify: `lib/storage.ts`
- Modify: `tests/storage.test.mts`

**Interfaces:**
- Consumes: `normalizeBuddyTimeline()`, `applyTimeDecay()`
- Produces: saved buddies that always include the daily loop fields.

- [ ] Write a failing test that an older saved buddy without daily fields loads with defaults.
- [ ] Write a failing test that loading a stale saved buddy applies passive decay once.
- [ ] Run `npm test -- tests/storage.test.mts` and confirm the new tests fail.
- [ ] Normalize old saved values and apply decay during load.
- [ ] Run `npm test -- tests/storage.test.mts` and confirm the tests pass.

### Task 3: Care UI Feedback

**Files:**
- Modify: `components/DearBuddyApp.tsx`
- Modify: `components/BuddyCarePanel.tsx`
- Modify: `tests/buddy.test.mts`

**Interfaces:**
- Consumes: `applyDailyCareBonus()`
- Produces: return message and daily bonus message in the care screen.

- [ ] Add tests for no duplicate daily bonus on the same day.
- [ ] Update action handling to apply normal action first, then daily bonus.
- [ ] Show return or daily bonus text in the existing care message area.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.

