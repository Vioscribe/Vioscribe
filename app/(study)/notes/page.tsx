import NotesEditor from "@/components/NotesEditor";
import { createClient } from "@/lib/supabase/server";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: note } = await supabase
    .from("notes")
    .select("content")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-sm text-stone-500">Headings and bullets. Saved to your account.</p>
      </div>
      <NotesEditor initialContent={note?.content || ""} />
    </div>
  );
}
