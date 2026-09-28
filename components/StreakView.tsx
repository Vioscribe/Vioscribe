"use client";

import { useMemo, useState } from "react";
import { saveDailyGoal } from "@/app/actions";
import { applyDayRollover } from "@/lib/streak";
import type { Profile } from "@/lib/types";
import HomeMascot from "@/components/HomeMascot";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function StreakView({
  profile,
  result,
}: {
  profile: Profile;
  result?: "saved" | "invalid" | "error";
}) {
  const today = useMemo(() => localToday(), []);
  const view = applyDayRollover(profile, today);
  const remaining = Math.max(0, view.daily_goal - view.reviews_today);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goal, setGoal] = useState(String(view.daily_goal));
  const goalValue = Number(goal);
  const sparkyMessage = !goal || goalValue < 2 || goalValue > 30
    ? "Choose a goal from 2 to 30 reviews."
    : goalValue < 5
      ? "You can do better than that."
      : goalValue < 10
        ? "A nice start. 10 is the sweet spot!"
        : goalValue === 10
          ? "10 is the sweet spot!"
          : goalValue === 30
            ? "Thirty a day! Sparky believes in you."
            : "A big goal! Keep that flame going.";

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

      <section className="space-y-3" aria-labelledby="daily-goal-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
          <div>
            <h2 id="daily-goal-heading" className="text-sm font-medium">Daily goal</h2>
            <p className="mt-1 text-xs text-stone-500">{view.daily_goal} card reviews each day</p>
          </div>
          <button
            type="button"
            aria-expanded={editingGoal}
            aria-controls="daily-goal-editor"
            onClick={() => {
              if (!editingGoal) setGoal(String(view.daily_goal));
              setEditingGoal((editing) => !editing);
            }}
            className="goal-editor-toggle rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:border-amber-500"
          >
            {editingGoal ? "Close editor" : "Change daily goal"}
          </button>
        </div>

        {result === "saved" && <p role="status" className="text-sm text-emerald-300">Daily goal updated.</p>}
        {result === "invalid" && <p role="alert" className="text-sm text-amber-200">Choose a whole number from 2 to 30.</p>}
        {result === "error" && <p role="alert" className="text-sm text-red-300">We couldn’t save your daily goal. Please try again.</p>}

        <div
          id="daily-goal-editor"
          className={`goal-editor-reveal${editingGoal ? " is-open" : ""}`}
          aria-hidden={!editingGoal}
          inert={!editingGoal}
        >
          <div className="goal-editor-content">
            <div className="goal-editor-card">
              <div className="goal-sparky-row">
                <HomeMascot message={sparkyMessage} placement="inline" interactive={false} />
              </div>
              <form action={saveDailyGoal} className="goal-editor-form">
                <input type="hidden" name="today" value={today} />
                <label htmlFor="daily-goal-input" className="text-sm font-medium">Reviews per day</label>
                <div className="flex flex-wrap items-end gap-3">
                  <input
                    id="daily-goal-input"
                    type="number"
                    min={2}
                    max={30}
                    step={1}
                    required
                    name="daily_goal"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    className="goal-editor-input w-28 rounded-lg border border-stone-300 px-3 py-2"
                  />
                  <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">
                    Save goal
                  </button>
                  <button type="button" onClick={() => { setGoal(String(view.daily_goal)); setEditingGoal(false); }} className="goal-editor-cancel rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:border-stone-500">
                    Cancel
                  </button>
                </div>
                <p className="goal-editor-hint text-xs">Set a goal between 2 and 30 reviews. 10 is Sparky’s sweet spot.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
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
