import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCard, saveCard } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, front, back")
    .eq("deck_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/decks" className="text-sm text-stone-500 hover:underline">
            ← Decks
          </Link>
          <h1 className="text-2xl font-semibold">{deck.title}</h1>
        </div>
        <Link
          href={`/decks/${deck.id}/review`}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Review
        </Link>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-stone-500">Add a card</h2>
        <form action={saveCard} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="deck_id" value={deck.id} />
          <textarea
            name="front"
            required
            placeholder="Front"
            rows={3}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            name="back"
            required
            placeholder="Back"
            rows={3}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-2 w-fit rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white"
          >
            Add card
          </button>
        </form>
      </section>

      <ul className="space-y-4">
        {(cards || []).length === 0 && (
          <li className="text-sm text-stone-500">No cards in this deck yet.</li>
        )}
        {(cards || []).map((card) => (
          <li key={card.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <form action={saveCard} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="deck_id" value={deck.id} />
              <input type="hidden" name="card_id" value={card.id} />
              <textarea
                name="front"
                required
                defaultValue={card.front}
                rows={3}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <textarea
                name="back"
                required
                defaultValue={card.back}
                rows={3}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="text-sm font-medium text-teal-800">
                  Save
                </button>
              </div>
            </form>
            <form action={deleteCard} className="mt-1">
              <input type="hidden" name="deck_id" value={deck.id} />
              <input type="hidden" name="card_id" value={card.id} />
              <button type="submit" className="text-sm text-stone-400 hover:text-red-700">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
