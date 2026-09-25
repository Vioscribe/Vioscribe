import Link from "next/link";
import CreateFileForm from "@/components/CreateFileForm";
import FileItemMoveForm from "@/components/FileItemMoveForm";
import { createClient } from "@/lib/supabase/server";

type Limits = { max_files: number | null; max_items_per_file: number | null };

function MigrationNotice() {
  return (
    <section className="filing-notice space-y-2" role="status">
      <p className="filing-kicker">MIGRATION NEEDED</p>
      <h1 className="text-xl font-semibold">The Filing Room is ready for its database update.</h1>
      <p className="text-sm text-stone-400">
        Apply <code>supabase/migrations/20260925050000_filing_room.sql</code> in Supabase, then reload this page.
        Your existing note text is preserved by the migration.
      </p>
    </section>
  );
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; created?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check the new table first so users see a clear message until its SQL is applied.
  const { error: filesError } = await supabase.from("files").select("id").limit(1);
  if (filesError) return <MigrationNotice />;

  const [filesResult, notesResult, decksResult, limitsResult] = await Promise.all([
    supabase.from("files").select("id, title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("notes").select("id, title, file_id, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("decks").select("id, title, file_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.rpc("get_my_filing_limits"),
  ]);

  if (notesResult.error || decksResult.error || filesResult.error || limitsResult.error) return <MigrationNotice />;

  const files = filesResult.data ?? [];
  const notes = notesResult.data ?? [];
  const decks = decksResult.data ?? [];
  const limitsData = limitsResult.data as Limits[] | null;
  const limits = limitsData?.[0] ?? { max_files: 3, max_items_per_file: 10 };
  const fileCountAtLimit = limits.max_files !== null && files.length >= limits.max_files;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="filing-kicker">INDEX / PERSONAL ARCHIVE</p>
        <h1 className="text-2xl font-semibold">Filing Room</h1>
        <p className="max-w-2xl text-sm leading-6 text-stone-400">
          Sort notes and decks into files. Unfiled items remain in your regular Notes and Decks lists.
        </p>
        <p className="text-xs text-stone-500">
          Files: {files.length}/{limits.max_files ?? "∞"} · Items per file: {limits.max_items_per_file ?? "∞"}
        </p>
      </header>

      {params?.error && <p className="filing-notice text-sm" role="alert">{params.error}</p>}
      {params?.created && <p className="text-sm text-emerald-300" role="status">File created.</p>}
      {params?.deleted && <p className="text-sm text-emerald-300" role="status">File removed. Its notes and decks are still available in their regular lists.</p>}

      <section className="filing-panel space-y-4" aria-labelledby="create-file-heading">
        <div>
          <p className="filing-kicker">NEW FOLDER</p>
          <h2 id="create-file-heading" className="text-lg font-semibold">Add a file</h2>
        </div>
        {fileCountAtLimit ? (
          <p className="text-sm text-stone-400">You’ve reached the Free plan’s {limits.max_files}-file limit.</p>
        ) : <CreateFileForm />}
      </section>

      <section className="space-y-3" aria-labelledby="files-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="files-heading" className="text-xs font-semibold uppercase tracking-widest text-stone-400">Cabinet drawers</h2>
          <span className="text-xs text-stone-600">{files.length} file{files.length === 1 ? "" : "s"}</span>
        </div>
        {!files.length ? (
          <p className="filing-empty">Your cabinet is empty. Add a file, then place notes and decks inside it.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {files.map((file) => {
              const itemCount = notes.filter((note) => note.file_id === file.id).length
                + decks.filter((deck) => deck.file_id === file.id).length;
              return (
                <li key={file.id}>
                  <Link href={`/files/${file.id}`} className="filing-drawer block p-4">
                    <span className="filing-drawer-label">FILE_{file.id.slice(0, 4).toUpperCase()}</span>
                    <span className="mt-2 block text-base font-semibold text-stone-100">{file.title}</span>
                    <span className="mt-1 block text-xs text-stone-500">
                      {itemCount}/{limits.max_items_per_file ?? "∞"} items · notes + decks
                    </span>
                    <span className="filing-drawer-handle" aria-hidden="true"><i /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="filing-panel space-y-4" aria-labelledby="uncategorised-heading">
        <div>
          <p className="filing-kicker">NO FILE / STILL IN YOUR LIBRARY</p>
          <h2 id="uncategorised-heading" className="text-lg font-semibold">Unfiled items</h2>
        </div>
        {!notes.some((note) => !note.file_id) && !decks.some((deck) => !deck.file_id) ? (
          <p className="text-sm text-stone-500">Everything is filed, or your library is empty.</p>
        ) : (
          <ul className="space-y-3">
            {notes.filter((note) => !note.file_id).map((note) => (
              <li key={note.id} className="filing-item-card flex flex-wrap items-center justify-between gap-3 p-3">
                <Link href={`/notes/${note.id}`} className="font-medium">{note.title}</Link>
                <FileItemMoveForm item={note} kind="note" files={files} returnTo="/files" />
              </li>
            ))}
            {decks.filter((deck) => !deck.file_id).map((deck) => (
              <li key={deck.id} className="filing-item-card flex flex-wrap items-center justify-between gap-3 p-3">
                <Link href={`/decks/${deck.id}`} className="font-medium">{deck.title}</Link>
                <FileItemMoveForm item={deck} kind="deck" files={files} returnTo="/files" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
