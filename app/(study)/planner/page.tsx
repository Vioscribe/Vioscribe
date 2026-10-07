import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ScheduledCard = {
  id: string;
  next_review_at: string;
  decks: { id: string; title: string } | { id: string; title: string }[] | null;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function StudyPlannerPage() {
  const supabase = await createClient();
  const today = new Date();
  const todayKey = dayKey(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data } = await supabase
    .from("cards")
    .select("id, next_review_at, decks(id, title)")
    .lte("next_review_at", weekEnd.toISOString())
    .order("next_review_at", { ascending: true });

  const cards = (data ?? []) as ScheduledCard[];
  const days = Array.from({ length: 8 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const key = dayKey(date);
    return {
      date,
      key,
      cards: cards.filter((card) => dayKey(new Date(card.next_review_at)) === key),
    };
  });
  const dueToday = cards.filter((card) => new Date(card.next_review_at) <= today).length;

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold">Study planner</h1>
        <p className="mt-1 text-sm text-stone-500">See what’s due and plan the next week of reviews.</p>
      </header>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <p className="text-sm font-medium text-teal-900">Today</p>
        <p className="mt-1 text-2xl font-semibold text-teal-950">{dueToday} {dueToday === 1 ? "card" : "cards"} due</p>
        <p className="mt-1 text-sm text-teal-800">Cards become due based on your review history.</p>
        <Link href="/decks" className="mt-3 inline-block text-sm font-medium text-teal-900 underline">Choose a deck to review</Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Coming up</h2>
        {days.map(({ date, key, cards: dayCards }) => (
          <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3">
            <div>
              <p className="font-medium">{key === todayKey ? "Today" : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
              <p className="text-xs text-stone-500">{[...new Set(dayCards.map((card) => {
                const deck = Array.isArray(card.decks) ? card.decks[0] : card.decks;
                return deck?.title;
              }).filter(Boolean))].join(", ") || "No cards scheduled"}</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm">{dayCards.length}</span>
          </div>
        ))}
      </section>
      <p className="text-xs text-stone-500">Dates use your device’s local time. New cards are included when they are due.</p>
    </div>
  );
}
