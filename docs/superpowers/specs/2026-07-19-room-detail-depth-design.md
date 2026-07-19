# Room Detail Depth Design

## Goal

The decor room should feel like a small lived-in space instead of a flat placement box.

## Scope

Included:

- Add visual depth to the existing retro room without changing the overall color direction.
- Add wall and floor separation, soft window light, baseboard detail, room corner shade, furniture contact shadows, and a buddy floor shadow.
- Keep the current drag-and-drop furniture behavior unchanged.
- Keep all room items in the same local storage model.
- Add a small pure presentation helper so room state class names are testable outside the React component.

Excluded:

- New room themes.
- New shop items.
- Paid image generation or Vision calls.
- Large typography, color palette, or app layout changes.
- Physics-based drag interactions.

## Architecture

`lib/room-presentation.ts` owns pure room presentation helpers. `components/BuddyCarePanel.tsx` consumes those helpers and renders a few decorative room layers before furniture and the buddy. `app/globals.css` owns the visual treatment with CSS gradients and pseudo-elements, keeping the retro pixel-like direction already used by shop item sprites.

## Visual Rules

- The room keeps the current warm retro tone.
- The wall sits behind furniture; the floor sits under furniture.
- The window light is decorative and never blocks drag targets.
- Furniture and buddy shadows are low-contrast so the room feels deeper without becoming noisy.
- Mobile layout dimensions must stay stable while dragging.

## Testing

Use Node's built-in test runner for the pure helper. The focused test verifies that the room class name includes equipped item classes, dragging state, and drop-ready state for room furniture only. Full visual confirmation is done with dev server plus browser screenshot after implementation.
