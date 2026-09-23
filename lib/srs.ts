// Tiny spaced-repetition helper.
// "Got it" stretches the gap; "Not yet" brings the card back almost immediately.

const MAX_INTERVAL_MINUTES = 60 * 24 * 30; // 30 days
const FIRST_SUCCESS_MINUTES = 60 * 24; // 1 day
const FAIL_MINUTES = 1;

export function nextAfterGotIt(intervalMinutes: number) {
  const next =
    intervalMinutes <= 0
      ? FIRST_SUCCESS_MINUTES
      : Math.min(intervalMinutes * 3, MAX_INTERVAL_MINUTES);
  return next;
}

export function nextAfterMissed() {
  return FAIL_MINUTES;
}
