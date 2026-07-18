# Action Buddy Images Design

## Goal

Dear Buddy should show a different generated buddy image for each care action: idle, pet, feed, play, and rest. This makes the care buttons feel like the buddy is reacting, not only moving.

## Scope

Included:

- Generate up to five PNG images from one analysis result: idle, pet, feed, play, rest.
- Keep the existing single `generatedImageDataUrl` field as the idle fallback.
- Store action PNG data URLs in IndexedDB, not localStorage.
- Show the selected action image briefly when the user taps a care button.
- Fall back to the idle generated image or SVG buddy if action image generation fails.
- Cover prompt construction, response extraction, storage fallback, and old save compatibility with tests.

Excluded:

- Runtime regeneration on every button tap.
- Server persistence.
- Multiple buddy profiles.
- Video or animated image generation.

## Cost And API Behavior

The user approved OpenAI image API usage for this flow on 2026-07-18. The app may call the image generation endpoint up to five times while creating a buddy. Automated tests must not call OpenAI.

If one action image fails, the route returns the images that succeeded. If the whole request fails, the client continues with the existing SVG or single generated image fallback.

## Data Model

`Buddy` gains an optional `generatedActionImages` object:

```ts
type BuddyActionImageKey = "idle" | "pet" | "feed" | "play" | "rest";
type BuddyActionImages = Partial<Record<BuddyActionImageKey, string>>;
```

`generatedImageDataUrl` remains the idle image for compatibility. When both fields exist, `generatedActionImages.idle` is preferred.

## UI Behavior

The care screen chooses the rendered image in this order:

1. Active action image for the last tapped care action.
2. Idle action image.
3. Existing `generatedImageDataUrl`.
4. SVG fallback.

When the reaction animation restarts, the image switches with it. No separate timer is required for v1 because the active reaction state already changes on each tap and the idle image remains available for the default state.

