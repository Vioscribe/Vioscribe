import Link from "next/link";
import { createDeck, deleteDeck } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Decks</h1>
        <p className="text-sm text-stone-500">Make a deck, then add cards inside it.</p>
      </div>

      <form action={createDeck} className="flex gap-2">
        <input
          name="title"
          required
          placeholder="New deck title"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Create
        </button>
      </form>

      <ul className="space-y-2">
        {(decks || []).length === 0 && (
          <li className="text-sm text-stone-500">No decks yet.</li>
        )}
        {(decks || []).map((deck) => (
          <li
            key={deck.id}
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"
          >
            <Link href={`/decks/${deck.id}`} className="font-medium hover:underline">
              {deck.title}
            </Link>
            <form action={deleteDeck}>
              <input type="hidden" name="id" value={deck.id} />
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
