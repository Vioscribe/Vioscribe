import type { Profile } from "@/lib/types";

function yesterdayOf(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Sync streak counters with "today" (YYYY-MM-DD from the student's browser).
// If they skipped a day after last meeting the goal, the streak drops to 0.
export function applyDayRollover(profile: Profile, today: string): Profile {
  const next = { ...profile };

  if (next.reviews_date !== today) {
    next.reviews_today = 0;
    next.reviews_date = today;
  }

  if (
    next.last_goal_date &&
    next.last_goal_date !== today &&
    next.last_goal_date !== yesterdayOf(today)
  ) {
    next.current_streak = 0;
  }

  return next;
}

export function applyReview(profile: Profile, today: string): Profile {
  const next = applyDayRollover(profile, today);
  next.reviews_today += 1;

  if (next.reviews_today >= next.daily_goal && next.last_goal_date !== today) {
    next.current_streak += 1;
    next.last_goal_date = today;
  }

  return next;
}
