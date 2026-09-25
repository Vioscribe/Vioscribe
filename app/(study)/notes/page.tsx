import Link from "next/link";
import { createNote, deleteNote } from "@/app/actions";
import FileItemMoveForm from "@/components/FileItemMoveForm";
import NotesEditor from "@/components/NotesEditor";
import { createClient } from "@/lib/supabase/server";

export default async function NotesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: notes, error }, { data: files }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, file_id, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("files").select("id, title").order("title"),
  ]);

  if (error) {
    const { data: legacyNote } = await supabase
      .from("notes")
      .select("content")
      .eq("user_id", user.id)
      .maybeSingle();
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="text-sm text-stone-500">Your current note is still available while the Filing Room update is pending.</p>
        </header>
        <p className="filing-notice text-xs" role="status">
          Apply <code>supabase/migrations/20260925050000_filing_room.sql</code> in Supabase to create separate titled notes and use files.
        </p>
        <NotesEditor noteId="legacy" initialContent={legacyNote?.content || ""} />
      </div>
    );
  }

  const fileTitles = new Map((files ?? []).map((file) => [file.id, file.title]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="filing-kicker">PERSONAL NOTEBOOK</p>
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-sm text-stone-500">Create separate notes, then file them with related decks.</p>
      </header>

      {params?.error && <p className="filing-notice text-sm" role="alert">{params.error}</p>}
      {params?.deleted && <p className="text-sm text-emerald-300" role="status">Note deleted.</p>}

      <form action={createNote} className="flex flex-wrap gap-2">
        <label htmlFor="new-note-title" className="sr-only">New note title</label>
        <input
          id="new-note-title"
          name="title"
          type="text"
          required
          minLength={1}
          maxLength={80}
          pattern=".*\\S.*"
          placeholder="New note title"
          className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
          Create note
        </button>
      </form>

      <section aria-labelledby="notes-list-heading" className="space-y-3">
        <h2 id="notes-list-heading" className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Your notes <span className="text-orange-300">[{notes?.length ?? 0}]</span>
        </h2>
        {!notes?.length ? (
          <p className="rounded border border-dashed border-stone-700 p-5 text-sm text-stone-500">
            No notes yet. Create one above to start writing.
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="filing-item-card flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link href={`/notes/${note.id}`} className="font-semibold hover:underline">{note.title}</Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {note.file_id ? `Filed in ${fileTitles.get(note.file_id) ?? "a file"}` : "Unfiled"}
                    {note.updated_at ? ` · Updated ${new Date(note.updated_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <FileItemMoveForm
                    item={note}
                    kind="note"
                    files={files ?? []}
                    returnTo="/notes"
                  />
                  <form action={deleteNote}>
                    <input type="hidden" name="note_id" value={note.id} />
                    <button type="submit" className="text-xs text-stone-500 hover:text-red-300">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
