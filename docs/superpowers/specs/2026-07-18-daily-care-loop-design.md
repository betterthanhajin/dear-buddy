# Daily Care Loop Design

## Goal

Dear Buddy should feel alive when the user returns later. The first daily loop adds gentle time passage and a once-per-day care bonus without adding accounts, push notifications, server state, or paid API calls.

## Scope

Included:

- Apply gentle stat decay when a saved buddy is opened after time has passed.
- Add `lastCareAt`, `lastDailyBonusAt`, and `dailyCareStreak` to the local buddy model.
- Keep older saved buddies compatible by deriving missing fields from `updatedAt` or `createdAt`.
- Give a once-per-day bonus on the first care action of the day.
- Show a short return or daily bonus message in the care screen.
- Cover the time rules and storage migration with tests.

Excluded:

- Multiple buddies.
- Growth-stage art changes.
- Push notifications.
- Server persistence.

## Rules

- Less than 6 hours away: no passive stat change.
- Each full 6-hour block away: hunger -4, energy -3.
- Each full 24-hour block away: affection -2.
- Passive decay never lowers affection, hunger, or energy below 10.
- The first care action on a new local day gives +10 experience.
- If the previous daily bonus was yesterday, `dailyCareStreak` increases by 1.
- If more than one local day was missed, `dailyCareStreak` resets to 1.

## Architecture

`lib/buddy.ts` owns the pure game rules. It will export `applyTimeDecay()` and `applyDailyCareBonus()` so UI and storage do not duplicate time math. `lib/storage.ts` will normalize old saved data before returning a `Buddy`, then apply time decay once on load.

`components/DearBuddyApp.tsx` will keep a short return message from `loadSavedBuddy()`. `components/BuddyCarePanel.tsx` will show that message until the user performs an action, then show the existing action reaction or the daily bonus message.

## Testing

Use Node's built-in test runner. Add focused tests to `tests/buddy.test.mts` for decay, daily bonus, and streak reset. Add storage tests for loading older saved data that lacks the new fields.

