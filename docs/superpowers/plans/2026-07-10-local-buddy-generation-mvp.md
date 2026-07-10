# Local Buddy Generation MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable browser-only Dear Buddy MVP where users upload a plush photo, generate a local 2D buddy avatar, name it, and raise it with persistent stats.

**Architecture:** Keep `app/page.tsx` as a server shell and move all app state into focused client components. Put deterministic game rules, avatar profile generation, palette extraction, and storage helpers in small files under `lib/` so they can be tested or manually verified without reading the UI internals.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, browser FileReader/canvas APIs, localStorage.

## Global Constraints

- No paid AI image generation in this MVP.
- The uploaded photo stays in the browser and is not sent to a server.
- Store one buddy in localStorage.
- Use the current npm stack; do not add dependencies.
- Keep visual polish modest until the first playable version is visible.

---

### Task 1: Buddy Domain Model And Rules

**Files:**
- Create: `lib/buddy.ts`
- Remove after migration: `type/buddy.tsx`

**Interfaces:**
- Produces: `Buddy`, `BuddyStats`, `BuddyMood`, `AvatarProfile`, `BuddyAction`, `createBuddy()`, `applyBuddyAction()`, `getBuddyLevel()`, `getBuddyMood()`, `clampStat()`, `createAvatarProfile()`
- Consumes: none

- [ ] **Step 1: Create domain helpers**

Implement `lib/buddy.ts` with exported types and pure helpers:

```ts
export type BuddyMood = "happy" | "sad" | "sleep" | "hungry";

export type BuddyAction = "pet" | "feed" | "play" | "rest";

export type BuddyStats = {
  affection: number;
  hunger: number;
  energy: number;
  exp: number;
};

export type AvatarProfile = {
  bodyColor: string;
  accentColor: string;
  earShape: "round" | "floppy" | "pointy";
  accessory: "ribbon" | "patch" | "star";
  cheekStyle: "dot" | "oval" | "none";
};

export type Buddy = {
  id: string;
  name: string;
  photoDataUrl: string;
  createdAt: string;
  updatedAt: string;
  avatarProfile: AvatarProfile;
  stats: BuddyStats;
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/buddy.ts type/buddy.tsx
git commit -m "feat: add buddy domain model"
```

### Task 2: Palette And Storage Helpers

**Files:**
- Create: `lib/palette.ts`
- Create: `lib/storage.ts`

**Interfaces:**
- Consumes: `Buddy` from `lib/buddy.ts`
- Produces: `extractPaletteFromImage(file: File): Promise<{ photoDataUrl: string; dominantColor: string; accentColor: string }>` and `loadSavedBuddy()`, `saveBuddy()`, `clearSavedBuddy()`

- [ ] **Step 1: Add palette extraction**

Use `FileReader`, `Image`, and a temporary canvas. Reject non-image files and image decode failures with user-readable `Error` messages.

- [ ] **Step 2: Add localStorage helpers**

Use storage key `dear-buddy.saved-buddy.v1`. Validate minimal object shape on read.

- [ ] **Step 3: Verify TypeScript**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/palette.ts lib/storage.ts
git commit -m "feat: add local palette and storage helpers"
```

### Task 3: Creator And Avatar UI

**Files:**
- Create: `components/BuddyAvatar.tsx`
- Create: `components/BuddyCreator.tsx`

**Interfaces:**
- Consumes: `AvatarProfile`, `BuddyMood`, `createAvatarProfile()` from `lib/buddy.ts`; `extractPaletteFromImage()` from `lib/palette.ts`
- Produces: `BuddyCreator({ onCreate }: { onCreate: (input: { name: string; photoDataUrl: string; avatarProfile: AvatarProfile }) => void })`

- [ ] **Step 1: Build deterministic SVG avatar**

`BuddyAvatar` renders an accessible SVG using profile colors and mood-specific face expressions.

- [ ] **Step 2: Build upload and naming flow**

`BuddyCreator` handles image file validation, preview, generated avatar preview, name input, and disabled create button until both photo and name exist.

- [ ] **Step 3: Verify TypeScript**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/BuddyAvatar.tsx components/BuddyCreator.tsx
git commit -m "feat: add buddy creator flow"
```

### Task 4: Raising Screen And App Flow

**Files:**
- Create: `components/BuddyCarePanel.tsx`
- Create: `components/DearBuddyApp.tsx`
- Modify: `components/BuddyCard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Buddy`, `createBuddy()`, `applyBuddyAction()`, `getBuddyLevel()`, `getBuddyMood()`, storage helpers
- Produces: A complete app flow from onboarding to care screen.

- [ ] **Step 1: Build care panel**

Render buddy avatar, photo thumbnail, name, level, stats, and four actions: pet, feed, play, rest.

- [ ] **Step 2: Build app controller**

Load saved buddy on mount. Save after each action. Reset clears localStorage and returns to creator.

- [ ] **Step 3: Replace old page flow**

Use `DearBuddyApp` from `app/page.tsx`. Keep `BuddyCard.tsx` as a compatibility re-export or remove it if no import remains.

- [ ] **Step 4: Verify TypeScript**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/BuddyCarePanel.tsx components/DearBuddyApp.tsx components/BuddyCard.tsx
git commit -m "feat: add buddy raising flow"
```

### Task 5: Metadata, Styles, And Verification

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed app flow
- Produces: polished MVP with accurate metadata and documentation.

- [ ] **Step 1: Update metadata**

Set title to `Dear Buddy`, description to the MVP value proposition, and HTML language to `ko`.

- [ ] **Step 2: Update global styles**

Add avatar and reaction animations. Keep the interface responsive for mobile screens.

- [ ] **Step 3: Update README**

Replace create-next-app README with project summary, current MVP, local commands, and privacy note.

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both PASS.

- [ ] **Step 5: Browser verification**

Start local dev server and inspect with `agent-browser`. Verify onboarding, upload, create, action buttons, reload persistence, and reset.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css README.md
git commit -m "chore: polish dear buddy MVP"
```

## Self-Review

- Spec coverage: upload, preview, local avatar generation, naming, care actions, persistence, metadata, and manual verification are covered.
- Placeholder scan: no TBD or deferred implementation placeholders remain.
- Type consistency: `Buddy`, `AvatarProfile`, `BuddyStats`, and helper names are consistent across tasks.
