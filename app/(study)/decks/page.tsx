import Link from "next/link";
import { createDeck, deleteDeck } from "@/app/actions";
import FileItemMoveForm from "@/components/FileItemMoveForm";
import { createClient } from "@/lib/supabase/server";

export default async function DecksPage() {
  const supabase = await createClient();
  const [{ data: decks }, { data: files }] = await Promise.all([
    supabase
      .from("decks")
      .select("id, title, created_at, file_id")
      .order("created_at", { ascending: false }),
    supabase.from("files").select("id, title").order("title"),
  ]);
  const fileTitles = new Map((files ?? []).map((file) => [file.id, file.title]));

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
          <li className="text-sm text-stone-500">No decks yet. Create one above, then add cards to start studying.</li>
        )}
        {(decks || []).map((deck) => (
          <li
            key={deck.id}
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"
          >
            <Link href={`/decks/${deck.id}`} className="font-medium hover:underline">
              {deck.title}
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="text-right">
                <p className="text-xs text-stone-500">{deck.file_id ? `Filed in ${fileTitles.get(deck.file_id) ?? "a file"}` : "Unfiled"}</p>
                {decks && files && <FileItemMoveForm item={deck} kind="deck" files={files} returnTo="/decks" />}
              </div>
              <form action={deleteDeck}>
                <input type="hidden" name="id" value={deck.id} />
                <button type="submit" className="text-sm text-stone-400 hover:text-red-700">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
