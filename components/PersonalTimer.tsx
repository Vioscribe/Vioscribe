"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TimerRow = {
  user_id: string;
  room_id: string | null;
  timer_state: "paused" | "running" | "on_break";
  timer_phase: "study" | "break";
  ends_at: string | null;
  seconds_left: number;
  phase_started_at: string | null;
  updated_at: string;
};

function timerRow(data: unknown): TimerRow | null {
  if (Array.isArray(data)) return (data[0] as TimerRow | undefined) ?? null;
  return data && typeof data === "object" ? data as TimerRow : null;
}

function formatTime(total: number) {
  const seconds = Math.max(0, Math.ceil(total));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PersonalTimer({
  initialTimer,
  userId,
  roomId,
}: {
  initialTimer: TimerRow | null;
  userId: string;
  roomId?: string;
}) {
  const [timer, setTimer] = useState<TimerRow | null>(initialTimer);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const advancing = useRef(false);

  const advance = useCallback(async () => {
    if (advancing.current) return;
    advancing.current = true;
    const endedPhase = timer?.timer_phase;
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("advance_personal_timer");
      if (rpcError) throw rpcError;
      const updated = timerRow(data);
      if (updated) {
        setTimer(updated);
        if (endedPhase === "study") setNotice("Study block complete. Your time has been logged; take a break when you’re ready.");
        else if (endedPhase === "break") setNotice("Break complete. Start another study block when you’re ready.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the timer.");
    } finally {
      advancing.current = false;
    }
  }, [timer?.timer_phase]);

  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`personal-timer:${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "personal_timers", filter: `user_id=eq.${userId}`,
      }, (payload) => setTimer(payload.new as TimerRow))
      .subscribe();

    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const refreshTimer = window.setTimeout(() => void advanceRef.current(), 0);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const remaining = timer?.timer_state === "paused"
    ? timer.seconds_left
    : timer?.ends_at ? Math.max(0, (Date.parse(timer.ends_at) - now) / 1000) : 1500;

  useEffect(() => {
    if (timer?.timer_state !== "paused" && remaining <= 0) {
      const timeout = window.setTimeout(() => void advanceRef.current(), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [remaining, timer?.timer_state]);

  async function control(action: "start" | "pause") {
    setError("");
    setNotice("");
    const previousPhase = timer?.timer_phase;
    const supabase = createClient();
    const { data, error: rpcError } = action === "start"
      ? await supabase.rpc("start_personal_timer", { target_room_id: roomId ?? null })
      : await supabase.rpc("pause_personal_timer");
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const updated = timerRow(data);
    if (updated) {
      setTimer(updated);
      if (action === "pause" && previousPhase !== updated.timer_phase) {
        setNotice(previousPhase === "study"
          ? "Study block complete. Your time has been logged; take a break when you’re ready."
          : "Break complete. Start another study block when you’re ready.");
      }
    }
  }

  const phase = timer?.timer_phase ?? "study";
  const running = Boolean(timer && timer.timer_state !== "paused");
  const willLogToRoom = running ? Boolean(timer?.room_id) : Boolean(roomId);
  return (
    <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 text-center">
      <div>
        <p className="text-xs uppercase tracking-wider text-amber-600">Personal Pomodoro</p>
        <h2 className="mt-1 text-lg font-medium">{phase === "study" ? "Study block · 25 min" : "Break · 5 min"}</h2>
      </div>
      <p className="font-mono text-5xl tabular-nums" aria-live="off">{formatTime(remaining)}</p>
      <div className="flex justify-center gap-2">
        {running ? (
          <button type="button" onClick={() => void control("pause")} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100">Pause and log time</button>
        ) : (
          <button type="button" onClick={() => void control("start")} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">Start {phase === "study" ? "study" : "break"}</button>
        )}
      </div>
      <p className="text-xs text-stone-500">
        {willLogToRoom ? "Study minutes count toward your friends and this room’s leaderboard." : "Study minutes count toward your friends leaderboard."}
      </p>
      {notice && <p role="status" aria-live="polite" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
