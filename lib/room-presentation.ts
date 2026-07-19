import type { Buddy, BuddyRoomItemPlacement, BuddyShopItemId } from "./buddy.ts";
import { ROOM_ITEMS } from "./buddy.ts";

const defaultRoomItemPlacements: Record<BuddyShopItemId, BuddyRoomItemPlacement> = {
  "fish-snack": { x: 50, y: 50 },
  "pink-rug": { x: 50, y: 74 },
  "beach-ball": { x: 74, y: 70 },
  "cozy-bed": { x: 28, y: 76 },
  "wooden-shelf": { x: 28, y: 27 },
  "stand-lamp": { x: 78, y: 59 },
  "round-window": { x: 76, y: 25 },
  "soft-cushion": { x: 62, y: 76 },
};

export function getRoomPreviewClassName(
  equippedRoomItemIds: BuddyShopItemId[],
  draggingItemId?: BuddyShopItemId,
) {
  const itemClassNames = equippedRoomItemIds.map((itemId) => `has-${itemId}`);
  const draggingClassName = draggingItemId ? "is-dragging-furniture" : "";
  const dropClassName = draggingItemId && ROOM_ITEMS.includes(draggingItemId) ? "is-drop-ready" : "";
  return ["retro-room-preview", ...itemClassNames, draggingClassName, dropClassName]
    .filter(Boolean)
    .join(" ");
}

export function getRoomItemPlacement(buddy: Buddy, itemId: BuddyShopItemId) {
  return buddy.roomItemPlacements?.[itemId] ?? defaultRoomItemPlacements[itemId];
}
