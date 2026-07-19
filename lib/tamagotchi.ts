export type TamagotchiState = {
  affection: number;
  reactionId: number;
};

export const INITIAL_TAMAGOTCHI_STATE: TamagotchiState = {
  affection: 87,
  reactionId: 0,
};

export function petBuddy(state: TamagotchiState): TamagotchiState {
  return {
    affection: Math.min(99, state.affection + 1),
    reactionId: state.reactionId + 1,
  };
}
