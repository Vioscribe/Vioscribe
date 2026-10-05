import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportRow = Record<string, unknown>;
type PageResult = {
  data: ExportRow[] | null;
  error: { message: string } | null;
};

async function fetchAllRows(
  loadPage: (from: number, to: number) => PromiseLike<PageResult>,
) {
  const rows: ExportRow[] = [];
  const pageSize = 500;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Sign in to export your account data." }, { status: 401 });
  }

  const [profile, files, decks, notes, friendRequests, reviews, memberships, timers, sessions, rooms] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      fetchAllRows((from, to) => supabase.from("files").select("*").eq("user_id", user.id).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("decks").select("*").eq("user_id", user.id).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("notes").select("*").eq("user_id", user.id).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("friend_requests").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("study_reviews").select("*").eq("user_id", user.id).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("room_members").select("*").eq("user_id", user.id).order("id").range(from, to)),
      supabase.from("personal_timers").select("*").eq("user_id", user.id).maybeSingle(),
      fetchAllRows((from, to) => supabase.from("study_sessions").select("*").eq("user_id", user.id).order("id").range(from, to)),
      fetchAllRows((from, to) => supabase.from("rooms").select("*").eq("owner_id", user.id).order("id").range(from, to)),
    ]);

  const results = [profile, files, decks, notes, friendRequests, reviews, memberships, timers, sessions, rooms];
  if (results.some((result) => result.error)) {
    return Response.json({ error: "Your data export could not be prepared. Please try again." }, { status: 500 });
  }

  const deckIds = (decks.data ?? []).map((deck) => String(deck.id));
  const cards = deckIds.length
    ? await fetchAllRows((from, to) => supabase.from("cards").select("*").in("deck_id", deckIds).order("id").range(from, to))
    : { data: [], error: null };

  if (cards.error) {
    return Response.json({ error: "Your data export could not be prepared. Please try again." }, { status: 500 });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
    },
    profile: profile.data,
    files: files.data,
    decks: decks.data,
    cards: cards.data,
    notes: notes.data,
    friend_requests: friendRequests.data,
    study_reviews: reviews.data,
    room_memberships: memberships.data,
    personal_timer: timers.data,
    study_sessions: sessions.data,
    rooms_created: rooms.data,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vioscribe-data-${date}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
