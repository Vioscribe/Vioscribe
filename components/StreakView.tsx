"use client";

import { useMemo } from "react";
import { saveDailyGoal } from "@/app/actions";
import { applyDayRollover } from "@/lib/streak";
import type { Profile } from "@/lib/types";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function StreakView({ profile }: { profile: Profile }) {
  const today = useMemo(() => localToday(), []);
  const view = applyDayRollover(profile, today);
  const remaining = Math.max(0, view.daily_goal - view.reviews_today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Streak</h1>
        <p className="text-sm text-stone-500">
          Hit your daily review goal to keep the streak. Miss a day and it resets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Current streak"
          value={`${view.current_streak} day${view.current_streak === 1 ? "" : "s"}`}
        />
        <Stat label="Reviews today" value={`${view.reviews_today} / ${view.daily_goal}`} />
        <Stat label="Still to go" value={remaining === 0 ? "Goal met" : `${remaining}`} />
      </div>

      <p className="text-sm text-stone-500">
        Friend code: <span className="font-mono text-stone-800">{view.friend_code}</span>
      </p>

      <form action={saveDailyGoal} className="flex items-end gap-2">
        <input type="hidden" name="today" value={today} />
        <label className="text-sm">
          Daily goal (reviews)
          <input
            type="number"
            min={1}
            name="daily_goal"
            defaultValue={view.daily_goal}
            className="mt-1 block w-28 rounded-lg border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
