import Link from "next/link";
import { notFound } from "next/navigation";
import { createDeck, createNote, deleteFile } from "@/app/actions";
import FileItemMoveForm from "@/components/FileItemMoveForm";
import { createClient } from "@/lib/supabase/server";

type Limits = { max_files: number | null; max_items_per_file: number | null };

export default async function FilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: file, error: fileError }, filesResult, notesResult, decksResult, limitsResult] = await Promise.all([
    supabase.from("files").select("id, title, created_at").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("files").select("id, title").eq("user_id", user.id).order("title"),
    supabase.from("notes").select("id, title, file_id, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("decks").select("id, title, file_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.rpc("get_my_filing_limits"),
  ]);

  if (fileError) {
    return (
      <section className="filing-notice space-y-2" role="status">
        <p className="filing-kicker">MIGRATION NEEDED</p>
        <h1 className="text-xl font-semibold">The Filing Room database update is not available yet.</h1>
        <p className="text-sm text-stone-400">Apply <code>supabase/migrations/20260925050000_filing_room.sql</code> in Supabase, then reload.</p>
      </section>
    );
  }
  if (!file) notFound();
  if (notesResult.error || decksResult.error || filesResult.error || limitsResult.error) {
    return <p className="filing-notice text-sm" role="alert">Could not load this file. Reload after the Filing Room migration has completed.</p>;
  }

  const files = filesResult.data ?? [];
  const notes = notesResult.data ?? [];
  const decks = decksResult.data ?? [];
  const fileNotes = notes.filter((note) => note.file_id === file.id);
  const fileDecks = decks.filter((deck) => deck.file_id === file.id);
  const unfiledNotes = notes.filter((note) => !note.file_id);
  const unfiledDecks = decks.filter((deck) => !deck.file_id);
  const limitsData = limitsResult.data as Limits[] | null;
  const limits = limitsData?.[0] ?? { max_files: 3, max_items_per_file: 10 };
  const itemCount = fileNotes.length + fileDecks.length;
  const atItemLimit = limits.max_items_per_file !== null && itemCount >= limits.max_items_per_file;

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <Link href="/files" className="text-xs text-stone-500 hover:text-yellow-200">← Filing Room</Link>
        <div className="filing-drawer filing-drawer-open p-5">
          <p className="filing-drawer-label">FILE_{file.id.slice(0, 4).toUpperCase()}</p>
          <h1 className="mt-2 text-2xl font-semibold">{file.title}</h1>
          <p className="mt-2 text-xs text-stone-500">
            {itemCount}/{limits.max_items_per_file ?? "∞"} items · {fileNotes.length} notes · {fileDecks.length} decks
          </p>
          <span className="filing-drawer-handle" aria-hidden="true"><i /></span>
        </div>
      </header>

      {query?.error && <p className="filing-notice text-sm" role="alert">{query.error}</p>}

      <section className="filing-panel grid gap-5 sm:grid-cols-2" aria-label="Create items in this file">
        <form action={createNote} className="space-y-2">
          <p className="filing-kicker">NEW NOTE</p>
          <input type="hidden" name="file_id" value={file.id} />
          <label htmlFor="new-file-note" className="sr-only">Note title</label>
          <input id="new-file-note" name="title" required maxLength={80} pattern=".*\\S.*" placeholder="Note title" className="w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={atItemLimit} className="rounded bg-teal-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Create note in this file
          </button>
        </form>
        <form action={createDeck} className="space-y-2">
          <p className="filing-kicker">NEW DECK</p>
          <input type="hidden" name="file_id" value={file.id} />
          <label htmlFor="new-file-deck" className="sr-only">Deck title</label>
          <input id="new-file-deck" name="title" required placeholder="Deck title" className="w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={atItemLimit} className="rounded bg-teal-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Create deck in this file
          </button>
        </form>
        {atItemLimit && (
          <p className="text-xs text-amber-200 sm:col-span-2">This file has reached its {limits.max_items_per_file}-item Free plan limit.</p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="file-contents-heading">
        <h2 id="file-contents-heading" className="text-xs font-semibold uppercase tracking-widest text-stone-400">Contents</h2>
        {!itemCount ? (
          <p className="filing-empty">This file is empty. Create a note or deck above, or add an existing item below.</p>
        ) : (
          <ul className="space-y-2">
            {fileNotes.map((note) => (
              <li key={note.id} className="filing-item-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <span className="filing-kicker">NOTE</span>
                  <Link href={`/notes/${note.id}`} className="mt-1 block font-semibold">{note.title}</Link>
                </div>
                <FileItemMoveForm item={note} kind="note" files={files} returnTo={`/files/${file.id}`} />
              </li>
            ))}
            {fileDecks.map((deck) => (
              <li key={deck.id} className="filing-item-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <span className="filing-kicker">DECK</span>
                  <Link href={`/decks/${deck.id}`} className="mt-1 block font-semibold">{deck.title}</Link>
                </div>
                <FileItemMoveForm item={deck} kind="deck" files={files} returnTo={`/files/${file.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {(unfiledNotes.length > 0 || unfiledDecks.length > 0) && (
        <section className="filing-panel space-y-3" aria-labelledby="add-existing-heading">
          <div>
            <p className="filing-kicker">UNCATEGORISED</p>
            <h2 id="add-existing-heading" className="text-lg font-semibold">Add existing items</h2>
          </div>
          {atItemLimit && <p className="text-sm text-amber-200">This file has reached its item limit.</p>}
          <ul className="space-y-2">
            {unfiledNotes.map((note) => (
              <li key={note.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-3">
                <Link href={`/notes/${note.id}`} className="text-sm">{note.title}</Link>
                <FileItemMoveForm item={note} kind="note" files={files} returnTo={`/files/${file.id}`} targetFileId={file.id} />
              </li>
            ))}
            {unfiledDecks.map((deck) => (
              <li key={deck.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-3">
                <Link href={`/decks/${deck.id}`} className="text-sm">{deck.title}</Link>
                <FileItemMoveForm item={deck} kind="deck" files={files} returnTo={`/files/${file.id}`} targetFileId={file.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex justify-end border-t border-stone-800 pt-4">
        <form action={deleteFile}>
          <input type="hidden" name="file_id" value={file.id} />
          <button type="submit" className="text-xs text-stone-500 hover:text-red-300">Remove this file</button>
        </form>
      </footer>
      <p className="text-right text-xs text-stone-600">Removing a file leaves its notes and decks in your library, unfiled.</p>
    </div>
  );
}
