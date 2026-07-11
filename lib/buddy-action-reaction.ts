import type { BuddyAction } from "./buddy";

type BuddyActionReaction = {
  message: string;
  animationClassName: string;
  symbol: string;
};

const REACTIONS: Record<BuddyAction, BuddyActionReaction> = {
  pet: {
    message: "좋아서 몸을 부비고 있어요.",
    animationClassName: "buddy-reaction-pet",
    symbol: "♡",
  },
  feed: {
    message: "냠냠, 맛있게 먹었어요.",
    animationClassName: "buddy-reaction-feed",
    symbol: "냠",
  },
  play: {
    message: "신나서 폴짝 뛰고 있어요.",
    animationClassName: "buddy-reaction-play",
    symbol: "!",
  },
  rest: {
    message: "포근하게 쉬고 있어요.",
    animationClassName: "buddy-reaction-rest",
    symbol: "Zz",
  },
};

export function getBuddyActionReaction(action: BuddyAction) {
  return REACTIONS[action];
}
