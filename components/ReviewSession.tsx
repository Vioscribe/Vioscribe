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

export default function ReviewSession({
  deckId,
  deckTitle,
  initialCards,
}: {
  deckId: string;
  deckTitle: string;
  initialCards: Card[];
}) {
  // Queue: missed cards are pushed to the end so they show up again sooner.
  const [queue, setQueue] = useState(initialCards);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = queue[0];
  const today = useMemo(() => localToday(), []);

  function grade(result: "got_it" | "not_yet") {
    if (!current) return;
    const card = current;
    startTransition(async () => {
      const form = new FormData();
      form.set("card_id", card.id);
      form.set("result", result);
      form.set("today", today);
      await reviewCard(form);

      setFlipped(false);
      setQueue((q) => {
        const rest = q.slice(1);
        if (result === "not_yet") return [...rest, card];
        return rest;
      });
    });
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <Link href={`/decks/${deckId}`} className="text-sm text-stone-500 hover:underline">
          ← {deckTitle}
        </Link>
        <h1 className="text-2xl font-semibold">All caught up</h1>
        <p className="text-stone-600">No more cards due in this deck right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/decks/${deckId}`} className="text-sm text-stone-500 hover:underline">
          ← {deckTitle}
        </Link>
        <p className="text-sm text-stone-400">{queue.length} left</p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-48 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white p-8 text-center text-xl shadow-sm"
      >
        {flipped ? current.back : current.front}
        <span className="sr-only">Flip card</span>
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
