"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  minutes_studied: number;
  cards_reviewed: number;
};

export default function Leaderboard({
  entries,
  currentUserId,
  period,
  roomId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
  period: "week" | "today";
  roomId?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [metric, setMetric] = useState<"minutes" | "cards">("minutes");

  // Keep ranked totals current when a participant logs a timer or card review.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`leaderboard:${roomId ?? currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "study_sessions",
        ...(roomId ? { filter: `room_id=eq.${roomId}` } : {}),
      }, () => startTransition(() => router.refresh()))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "study_reviews",
        ...(roomId ? { filter: `room_id=eq.${roomId}` } : {}),
      }, () => startTransition(() => router.refresh()))
      .subscribe();

    // The friend RPC returns aggregates, so a light refresh keeps their totals current
    // without exposing another person's raw session rows through RLS.
    const poll = roomId ? null : window.setInterval(() => {
      startTransition(() => router.refresh());
    }, 20000);

    return () => {
      if (poll !== null) window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, roomId, router]);

  const periodLabel = period === "week" ? "This week" : "Today";
  const rankedEntries = [...entries].sort((a, b) => {
    const primary = metric === "minutes"
      ? b.minutes_studied - a.minutes_studied
      : b.cards_reviewed - a.cards_reviewed;
    if (primary !== 0) return primary;
    return metric === "minutes"
      ? b.cards_reviewed - a.cards_reviewed
      : b.minutes_studied - a.minutes_studied;
  });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 text-xs text-stone-500">
          <span>{periodLabel}</span><span>·</span><span>Updates as activity is logged</span>
        </div>
        <div className="flex gap-1" role="group" aria-label="Leaderboard metric">
          <button type="button" aria-pressed={metric === "minutes"} onClick={() => setMetric("minutes")} className={`rounded px-2 py-1 text-xs ${metric === "minutes" ? "bg-amber-100 text-amber-950" : "text-stone-500 hover:bg-stone-100"}`}>Minutes</button>
          <button type="button" aria-pressed={metric === "cards"} onClick={() => setMetric("cards")} className={`rounded px-2 py-1 text-xs ${metric === "cards" ? "bg-amber-100 text-amber-950" : "text-stone-500 hover:bg-stone-100"}`}>Cards</button>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-stone-500">No activity yet.</p>
      ) : (
        <ol className="space-y-2">
          {rankedEntries.map((entry, index) => (
            <li key={entry.user_id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
              <span><span className="mr-3 text-stone-500">{index + 1}.</span>{entry.display_name}{entry.user_id === currentUserId ? " (you)" : ""}</span>
              <span className="whitespace-nowrap font-mono text-amber-300">
                {metric === "minutes" ? entry.minutes_studied : entry.cards_reviewed}
                <span className="ml-1 text-xs text-stone-500">{metric === "minutes" ? "min" : "cards"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
