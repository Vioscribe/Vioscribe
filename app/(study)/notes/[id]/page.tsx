import Link from "next/link";
import { notFound } from "next/navigation";
import { renameNote } from "@/app/actions";
import FileItemMoveForm from "@/components/FileItemMoveForm";
import NotesEditor from "@/components/NotesEditor";
import { createClient } from "@/lib/supabase/server";

export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: note, error }, { data: files }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, content, file_id, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("files").select("id, title").order("title"),
  ]);

  if (error) {
    return (
      <section className="filing-notice" role="status">
        <p className="filing-kicker">MIGRATION NEEDED</p>
        <h1 className="text-xl font-semibold">Notes are waiting for the Filing Room update.</h1>
        <p className="text-sm text-stone-400">
          Apply <code>supabase/migrations/20260925050000_filing_room.sql</code> in Supabase, then reload this page.
        </p>
      </section>
    );
  }
  if (!note) notFound();

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <Link href="/notes" className="text-xs text-stone-500 hover:text-yellow-200">← All notes</Link>
        <p className="filing-kicker">NOTE / {note.id.slice(0, 8).toUpperCase()}</p>
        <h1 className="text-2xl font-semibold">{note.title}</h1>
        {query?.error && <p className="text-sm text-red-300" role="alert">{query.error}</p>}
        {query?.saved && <p className="text-xs text-emerald-300" role="status">Title saved.</p>}
        <form action={renameNote} className="flex flex-wrap gap-2">
          <input type="hidden" name="note_id" value={note.id} />
          <label htmlFor="note-title" className="sr-only">Rename note</label>
          <input id="note-title" name="title" defaultValue={note.title} required maxLength={80} pattern=".*\\S.*" className="min-w-0 rounded border border-stone-700 px-2 py-1 text-xs" />
          <button type="submit" className="text-xs text-orange-300">Save title</button>
        </form>
        <FileItemMoveForm item={note} kind="note" files={files ?? []} returnTo={`/notes/${note.id}`} />
      </header>
      <NotesEditor key={note.id} noteId={note.id} initialContent={note.content || ""} />
      <p className="text-xs text-stone-600">Changes autosave to your account.</p>
    </div>
  );
}
