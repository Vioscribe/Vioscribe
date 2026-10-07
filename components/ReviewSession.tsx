"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { reviewCard } from "@/app/actions";
import type { Card } from "@/lib/types";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type QueuedCard = { card: Card; retry: boolean };
type PendingReview = { reviewId: string; cardId: string; result: "got_it" | "not_yet"; today: string; roomId: string | null };

function queueKey(userId: string) { return `vioscribe:offline-reviews:${userId}`; }

export default function ReviewSession({
  deckId,
  deckTitle,
  userId,
  roomId = null,
  initialCards,
  allCards,
}: {
  deckId: string;
  deckTitle: string;
  userId: string;
  roomId?: string | null;
  initialCards: Card[];
  allCards: Card[];
}) {
  // Queue: missed cards are pushed to the end so they show up again sooner.
  const [queue, setQueue] = useState<QueuedCard[]>(() =>
    initialCards.map((card) => ({ card, retry: false })),
  );
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const current = queue[0]?.card;
  const today = useMemo(() => localToday(), []);

  const syncQueued = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const key = queueKey(userId);
      const queued = JSON.parse(localStorage.getItem(key) || "[]") as PendingReview[];
      let saved = 0;
      for (const item of queued) {
        const form = new FormData();
        form.set("review_id", item.reviewId);
        form.set("card_id", item.cardId);
        form.set("result", item.result);
        form.set("today", item.today);
        if (item.roomId) form.set("room_id", item.roomId);
        try {
          await reviewCard(form);
          saved += 1;
        } catch {
          break;
        }
      }
      const remaining = queued.slice(saved);
      localStorage.setItem(key, JSON.stringify(remaining));
      setQueuedCount(remaining.length);
    } catch {
      // Keep queued reviews in browser storage if reconnecting or storage fails.
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [userId]);

  useEffect(() => {
    const key = queueKey(userId);
    try { setQueuedCount((JSON.parse(localStorage.getItem(key) || "[]") as PendingReview[]).length); } catch { setQueuedCount(0); }
    void syncQueued();
    const onOnline = () => { void syncQueued(); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncQueued, userId]);

  function grade(result: "got_it" | "not_yet") {
    if (!current) return;
    const card = current;
    const isRetry = queue[0].retry;
    startTransition(async () => {
      const review: PendingReview = { reviewId: crypto.randomUUID(), cardId: card.id, result, today, roomId };
      let queuedOffline = !navigator.onLine;
      if (!queuedOffline) {
        const form = new FormData();
        form.set("review_id", review.reviewId);
        form.set("card_id", card.id);
        form.set("result", result);
        form.set("today", today);
        if (roomId) form.set("room_id", roomId);
        try { await reviewCard(form); } catch { queuedOffline = true; }
      }
      if (queuedOffline) {
        try {
          const key = queueKey(userId);
          const queued = JSON.parse(localStorage.getItem(key) || "[]") as PendingReview[];
          queued.push(review);
          localStorage.setItem(key, JSON.stringify(queued));
          setQueuedCount(queued.length);
        } catch {
          // The card stays in the current session, but the UI will warn that it could not be saved.
          setQueuedCount(-1);
        }
      }

      setFlipped(false);
      setQueue((q) => {
        const rest = q.slice(1);
        // Give a missed card one quick retry after the first pass. A second
        // miss is still due soon in the database, but won't trap this session.
        if (result === "not_yet" && !isRetry) rest.push({ card, retry: true });
        return rest;
      });
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (event.altKey || event.ctrlKey || event.metaKey || target instanceof HTMLElement && (target.isContentEditable || target.closest("button, a, input, textarea, select, [role=button]"))) return;
      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (!pending && event.key.toLowerCase() === "y" && flipped) {
        grade("got_it");
      } else if (!pending && event.key.toLowerCase() === "n" && flipped) {
        grade("not_yet");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, flipped, pending, grade]);

  if (!current) {
    return (
      <div className="space-y-4">
        <Link href={roomId ? `/rooms/${roomId}` : `/decks/${deckId}`} className="text-sm text-stone-500 hover:underline">
          ← {roomId ? "Room" : deckTitle}
        </Link>
        <h1 className="text-2xl font-semibold">All caught up</h1>
        <p className="text-stone-600">No more cards due in this deck right now.</p>
        {allCards.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQueue(allCards.map((card) => ({ card, retry: false })));
              setFlipped(false);
            }}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
          >
            Study all {allCards.length} cards anyway
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={roomId ? `/rooms/${roomId}` : `/decks/${deckId}`} className="text-sm text-stone-500 hover:underline">
          ← {roomId ? "Room" : deckTitle}
        </Link>
        <p aria-live="polite" className="text-sm text-stone-400">{queue.length} {queue.length === 1 ? "card" : "cards"} left, including retries</p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show the card question" : "Show the card answer"}
        aria-pressed={flipped}
        className={`review-flip-button w-full rounded-2xl border border-stone-200 bg-white text-center text-xl shadow-sm${flipped ? " is-flipped" : ""}`}
      >
        <span className="review-card-inner">
          <span className="review-card-face review-card-front" aria-hidden={flipped}>
            {current.front}
          </span>
          <span className="review-card-face review-card-back" aria-hidden={!flipped}>
            {current.back}
          </span>
        </span>
      </button>
      <p className="text-center text-xs text-stone-400">Tap or press Space to flip · Y: Got it · N: Not yet</p>
      {queuedCount > 0 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{queuedCount} review{queuedCount === 1 ? "" : "s"} saved on this device and waiting to sync{syncing ? "…" : ""}</p>}
      {queuedCount === -1 && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">This review could not be saved locally. Keep this page open and try again when connected.</p>}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={pending || !flipped}
          onClick={() => grade("not_yet")}
          className="rounded-lg border border-stone-300 bg-white py-3 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Not yet
        </button>
        <button
          type="button"
          disabled={pending || !flipped}
          onClick={() => grade("got_it")}
          className="rounded-lg bg-teal-800 py-3 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
