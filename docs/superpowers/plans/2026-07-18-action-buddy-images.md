# Action Buddy Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, store, and display distinct buddy PNG images for idle, pet, feed, play, and rest states.

**Architecture:** `lib/openai-buddy-image.ts` owns action-specific prompt and response helpers. `app/api/generate-buddy-image/route.ts` accepts an optional action image request and returns a map of generated images. `lib/storage.ts` keeps large action image data URLs in IndexedDB while localStorage stores only compact buddy state.

**Tech Stack:** Next.js 16 Route Handlers, React 19, TypeScript, IndexedDB, OpenAI image generation API, Node test runner.

## Global Constraints

- The user approved OpenAI image API usage for the buddy creation flow on 2026-07-18.
- Tests must not call OpenAI.
- No new dependencies.
- Existing single-image saved buddies must still load.
- Generated PNG data URLs must not be forced into localStorage when IndexedDB is available.

---

### Task 1: Action Image Prompt Helpers

**Files:**
- Modify: `lib/openai-buddy-image.ts`
- Modify: `tests/openai-buddy-image.test.mts`

**Interfaces:**
- Produces: `BUDDY_ACTION_IMAGE_KEYS`
- Produces: `buildBuddyImagePrompt(analysis, actionKey?)`
- Produces: `extractGeneratedActionImages(response, actionKeys)`

- [ ] Write failing tests for action-specific prompts.
- [ ] Write failing tests for extracting multiple image data URLs.
- [ ] Implement action image keys, prompt variants, and extraction helper.
- [ ] Run `npm test -- tests/openai-buddy-image.test.mts`.

### Task 2: Buddy Model And Storage

**Files:**
- Modify: `lib/buddy.ts`
- Modify: `lib/storage.ts`
- Modify: `tests/storage.test.mts`

**Interfaces:**
- Produces: optional `generatedActionImages` on `Buddy`.
- Stores action images outside localStorage through `BuddyImageStore`.

- [ ] Write failing storage tests for storing and restoring action images.
- [ ] Extend the buddy type and create flow payload.
- [ ] Store action images under deterministic IndexedDB keys.
- [ ] Preserve fallback when action image storage fails.
- [ ] Run `npm test -- tests/storage.test.mts`.

### Task 3: API And UI Wiring

**Files:**
- Modify: `app/api/generate-buddy-image/route.ts`
- Modify: `components/BuddyCreator.tsx`
- Modify: `components/DearBuddyApp.tsx`
- Modify: `components/BuddyCarePanel.tsx`

**Interfaces:**
- Consumes: generated action image map from `/api/generate-buddy-image`.
- Displays action image for active care action.

- [ ] Update route handler to request action image maps.
- [ ] Update creator to keep action images in draft state.
- [ ] Update app controller to save action images with the buddy.
- [ ] Update care panel render order for active action, idle, generated fallback, SVG fallback.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.

