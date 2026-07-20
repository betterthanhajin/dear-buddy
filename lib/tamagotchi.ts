export type TamagotchiState = {
  affection: number;
  reactionId: number;
};

export const INITIAL_TAMAGOTCHI_STATE: TamagotchiState = {
  affection: 87,
  reactionId: 0,
};

export function petBuddy(state: TamagotchiState): TamagotchiState {
  if (state.affection >= 99) {
    return state;
  }

  return {
    affection: state.affection + 1,
    reactionId: state.reactionId + 1,
  };
}
