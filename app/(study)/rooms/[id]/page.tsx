import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { leaveStudyRoom } from "@/app/actions";
import Leaderboard from "@/components/Leaderboard";
import LeaderboardTabs from "@/components/LeaderboardTabs";
import PersonalTimer from "@/components/PersonalTimer";
import RoomPresence from "@/components/RoomPresence";
import { createClient } from "@/lib/supabase/server";

type BoardRow = { user_id: string; display_name: string; minutes_studied: number; cards_reviewed: number };

export default async function StudyRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [roomResult, profileResult, decksResult, timerResult, boardResult] = await Promise.all([
    supabase.from("rooms").select("id, code").eq("id", id).single(),
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("decks").select("id, title").order("created_at", { ascending: false }),
    supabase.from("personal_timers").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("room_leaderboard", { target_room_id: id }),
  ]);
  if (roomResult.error || !roomResult.data) notFound();
  if (timerResult.error) throw new Error(timerResult.error.message);
  if (boardResult.error) throw new Error(boardResult.error.message);

  const room = roomResult.data;
  const board = (boardResult.data ?? []) as BoardRow[];

  return (
    <div className="space-y-8">
      <LeaderboardTabs active="room" roomId={id} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/rooms" className="text-sm text-stone-500 hover:underline">← All rooms</Link>
          <h1 className="text-2xl font-semibold">Study room</h1>
          <p className="text-sm text-stone-500">Share code <span className="ml-1 rounded bg-stone-100 px-2 py-1 font-mono tracking-widest text-stone-900">{room.code}</span></p>
        </div>
        <form action={leaveStudyRoom}>
          <input type="hidden" name="room_id" value={id} />
          <button type="submit" className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100">Leave room</button>
        </form>
      </header>

      {query.error && <p role="alert" className="text-sm text-red-700">{query.error}</p>}

      <RoomPresence roomId={room.id} userId={user.id} displayName={profileResult.data?.display_name ?? "Student"} />
      <PersonalTimer initialTimer={timerResult.data} userId={user.id} roomId={room.id} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Study from a deck</h2>
        <p className="text-sm text-stone-500">Your timer stays personal. Study time is added to this room and your weekly friends total.</p>
        {decksResult.data?.length ? (
          <ul className="space-y-2">
            {decksResult.data.map((deck) => (
              <li key={deck.id}>
                <Link href={`/decks/${deck.id}/review?room=${room.id}`} className="block rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm hover:border-amber-400">Review {deck.title} in this room →</Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-stone-500">Create a deck before reviewing cards.</p>}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Room leaderboard</h2>
          <p className="text-xs text-stone-500">Today in this room · UTC</p>
        </div>
        <Leaderboard entries={board} currentUserId={user.id} period="today" roomId={room.id} />
      </section>
    </div>
  );
}
