import { redirect } from "next/navigation";
import PersonalTimer from "@/components/PersonalTimer";
import { createClient } from "@/lib/supabase/server";

const cellColors = [
  "bg-stone-100",
  "bg-amber-100",
  "bg-amber-300",
  "bg-orange-400",
  "bg-orange-700",
];

export default async function HeatmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentMonth = new Date();
  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const firstIso = first.toISOString();
  const nextIso = next.toISOString();
  const monthDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthLabel = first.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });

  const [profileResult, reviewsResult, sessionsResult, timerResult] = await Promise.all([
    supabase.from("profiles").select("current_streak").eq("id", user.id).single(),
    supabase.from("study_reviews").select("reviewed_at").eq("user_id", user.id).gte("reviewed_at", firstIso).lt("reviewed_at", nextIso),
    supabase.from("study_sessions").select("started_at, duration_seconds").eq("user_id", user.id).gte("started_at", firstIso).lt("started_at", nextIso),
    supabase.from("personal_timers").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  for (const result of [profileResult, reviewsResult, sessionsResult, timerResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const daily = new Map<number, { reviews: number; seconds: number }>();
  for (const row of reviewsResult.data ?? []) {
    const day = new Date(row.reviewed_at).getUTCDate();
    const value = daily.get(day) ?? { reviews: 0, seconds: 0 };
    value.reviews += 1;
    daily.set(day, value);
  }
  for (const row of sessionsResult.data ?? []) {
    const day = new Date(row.started_at).getUTCDate();
    const value = daily.get(day) ?? { reviews: 0, seconds: 0 };
    value.seconds += row.duration_seconds ?? 0;
    daily.set(day, value);
  }

  const offset = (first.getUTCDay() + 6) % 7;
  const activeScores = Array.from(daily.values()).map((value) => value.reviews + Math.floor(value.seconds / 600));
  const maxScore = Math.max(1, ...activeScores);
  const cells = Array.from({ length: offset + monthDays }, (_, index) => {
    if (index < offset) return null;
    const day = index - offset + 1;
    const activity = daily.get(day) ?? { reviews: 0, seconds: 0 };
    const score = activity.reviews + Math.floor(activity.seconds / 600);
    const level = score === 0 ? 0 : Math.min(4, Math.ceil((score / maxScore) * 4));
    return { day, activity, level };
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Study activity</h1>
        <p className="text-sm text-stone-500">This month · {monthLabel} {year} · UTC</p>
        <p className="text-sm">Current streak: <strong className="font-mono text-amber-700">{profileResult.data?.current_streak ?? 0} days</strong></p>
      </header>

      <PersonalTimer initialTimer={timerResult.data} userId={user.id} />

      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">{monthLabel}</h2>
          <p className="text-xs text-stone-500">{Array.from(daily.values()).reduce((sum, value) => sum + value.reviews, 0)} reviews · {Math.floor(Array.from(daily.values()).reduce((sum, value) => sum + value.seconds, 0) / 60)} study minutes</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] text-stone-500 sm:gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => <span key={weekday} className="pb-1">{weekday}</span>)}
          {cells.map((cell, index) => cell ? (
            <div
              key={cell.day}
              title={`${monthLabel} ${cell.day}: ${cell.activity.reviews} reviews, ${Math.floor(cell.activity.seconds / 60)} minutes`}
              aria-label={`${monthLabel} ${cell.day}: ${cell.activity.reviews} reviews, ${Math.floor(cell.activity.seconds / 60)} minutes`}
              className={`aspect-square rounded-sm ${cellColors[cell.level]}`}
            >
              <span className="sr-only">{cell.day}</span>
            </div>
          ) : <span key={`pad-${index}`} aria-hidden="true" />)}
        </div>
        <div className="flex items-center justify-end gap-1 text-[0.65rem] text-stone-500">
          <span>Less</span>{cellColors.map((color) => <span key={color} className={`h-3 w-3 rounded-sm ${color}`} />)}<span>More</span>
        </div>
      </section>
    </div>
  );
}
