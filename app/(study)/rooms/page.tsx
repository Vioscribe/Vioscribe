import Link from "next/link";
import { redirect } from "next/navigation";
import { createStudyRoom, joinStudyRoom } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

type RoomRow = { id: string; code: string };

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; left?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", user.id)
    .is("left_at", null);
  if (membershipError) throw new Error(membershipError.message);

  const roomIds = (memberships ?? []).map((membership) => membership.room_id);
  const { data: rooms, error: roomsError } = roomIds.length
    ? await supabase.from("rooms").select("id, code").in("id", roomIds)
    : { data: [] as RoomRow[], error: null };
  if (roomsError) throw new Error(roomsError.message);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Study rooms</h1>
        <p className="text-sm text-stone-500">Start a room with friends or join one with its code. Rooms hold up to four members.</p>
      </header>

      {params.error && <p role="alert" className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">{params.error}</p>}
      {params.left && <p role="status" className="text-sm text-stone-500">You left the room.</p>}

      <section className="grid gap-4 sm:grid-cols-2">
        <form action={createStudyRoom} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Create a room</h2>
          <p className="text-sm text-stone-500">We’ll give you a short code to share.</p>
          <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">Create room</button>
        </form>

        <form action={joinStudyRoom} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Join a room</h2>
          <label className="block space-y-1 text-sm">
            <span>Room code</span>
            <input name="code" required maxLength={8} autoCapitalize="characters" className="w-full rounded-lg border border-stone-300 px-3 py-2" placeholder="A1B2C3" />
          </label>
          <button type="submit" className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100">Join room</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Your rooms</h2>
        {rooms?.length ? (
          <ul className="space-y-2">
            {(rooms as RoomRow[]).map((room) => (
              <li key={room.id}>
                <Link href={`/rooms/${room.id}`} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-400">
                  <span>Room <span className="font-mono tracking-wider">{room.code}</span></span>
                  <span className="text-xs text-stone-500">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-stone-500">You haven’t joined a room yet.</p>}
      </section>
    </div>
  );
}
