"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { reviewCard } from "@/app/actions";
import type { Card } from "@/lib/types";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type QueuedCard = { card: Card; retry: boolean };

export default function ReviewSession({
  deckId,
  deckTitle,
  roomId = null,
  initialCards,
  allCards,
}: {
  deckId: string;
  deckTitle: string;
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
  const current = queue[0]?.card;
  const today = useMemo(() => localToday(), []);

  function grade(result: "got_it" | "not_yet") {
    if (!current) return;
    const card = current;
    const isRetry = queue[0].retry;
    startTransition(async () => {
      const form = new FormData();
      form.set("card_id", card.id);
      form.set("result", result);
      form.set("today", today);
      if (roomId) form.set("room_id", roomId);
      await reviewCard(form);

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
            Study anyway
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
        <p className="text-sm text-stone-400">{queue.length} left</p>
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
      <p className="text-center text-xs text-stone-400">Tap the card to flip</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => grade("not_yet")}
          className="rounded-lg border border-stone-300 bg-white py-3 text-sm font-medium hover:bg-stone-100 disabled:opacity-50"
        >
          Not yet
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => grade("got_it")}
          className="rounded-lg bg-teal-800 py-3 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
