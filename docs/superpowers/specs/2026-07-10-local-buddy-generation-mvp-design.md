# Local Buddy Generation MVP Design

## Goal

Dear Buddy turns a user's cherished plush photo into a small 2D buddy and lets the user raise it like a Tamagotchi.

The first MVP avoids paid image generation APIs. The app runs entirely in the browser: the user uploads a photo, the app extracts a simple color palette, generates a stylized 2D buddy avatar, and stores the buddy locally.

## Scope

Included:

- Photo upload from the browser.
- Uploaded photo preview.
- Local 2D avatar generation from preset SVG parts and the photo's dominant color.
- Buddy naming.
- Raising screen with affection, hunger, energy, level, and experience.
- Actions: pet, feed, play, rest.
- localStorage persistence.
- Metadata cleanup for the app title, description, and page language.

Excluded for this MVP:

- Paid AI image generation.
- User accounts.
- Server-side upload storage.
- Multiple buddies.
- Social sharing.

## User Flow

1. The user lands on an onboarding screen.
2. The user uploads a plush photo.
3. The app previews the photo and generates a 2D buddy avatar.
4. The user enters a buddy name.
5. The user creates the buddy and enters the raising screen.
6. The raising screen persists between reloads.
7. The user can reset and create a new buddy.

## Architecture

The home page stays simple and delegates interactive behavior to a client component.

- `app/page.tsx`: server component shell.
- `components/DearBuddyApp.tsx`: main client app and flow controller.
- `components/BuddyCreator.tsx`: upload, preview, name input, and generated avatar preview.
- `components/BuddyCarePanel.tsx`: raising screen and action buttons.
- `components/BuddyAvatar.tsx`: deterministic SVG avatar from a generated profile.
- `lib/buddy.ts`: shared types, defaults, and state transition helpers.
- `lib/palette.ts`: browser image palette extraction from a temporary canvas.
- `lib/storage.ts`: localStorage read/write helpers.

The palette extractor uses the uploaded image only in the browser. It does not upload the image anywhere.

## Buddy Model

The saved buddy contains:

- `id`
- `name`
- `photoDataUrl`
- `createdAt`
- `updatedAt`
- `avatarProfile`
- `stats`

Stats:

- `affection`: 0 to 100
- `hunger`: 0 to 100, higher means fuller
- `energy`: 0 to 100
- `exp`: total experience

Derived values:

- `level = Math.floor(exp / 100) + 1`
- `levelProgress = exp % 100`
- `mood` is derived from hunger, energy, and affection.

## Local Avatar Generation

The generated avatar is not a pixel-art transformation of the photo. It is a deterministic illustrated proxy:

- Base body color comes from the photo's dominant color.
- Secondary accent comes from a lighter or darker palette variant.
- Face, ears, cheek, and accessory options are chosen from a stable hash of the photo data URL and buddy name.
- Mood changes the face expression.

This keeps the MVP fast and private while preserving the "my plush became a character" feeling.

## Interaction Rules

- Pet: affection +4, exp +4.
- Feed: hunger +18, affection +2, exp +6.
- Play: affection +6, hunger -10, energy -12, exp +14.
- Rest: energy +22, hunger -4, exp +4.

All stats are clamped to 0 to 100.

## Error Handling

- If the file is not an image, show an inline message and keep the user on the creator screen.
- If the image cannot be decoded, show an inline message and allow retry.
- If localStorage read fails, start from an empty state.
- If localStorage write fails, keep the in-memory state and show a short warning.

## Testing And Verification

Manual verification:

- `npm run lint`
- `npm run build`
- Browser check with `agent-browser`
- Upload flow with a local sample image
- Action buttons update stats and mood
- Reload keeps the saved buddy
- Reset returns to onboarding

## Open Decisions

None for MVP. Visual polish can be adjusted after the first playable version is visible.
