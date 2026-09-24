import { redirect } from "next/navigation";
import { addFriendByCode, respondToFriendRequest } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

type FriendRow = { friend_id: string; display_name: string };
type LeaderboardRow = { user_id: string; display_name: string; cards_reviewed: number };
type RequestRow = {
  request_id: string;
  direction: "incoming" | "outgoing";
  friend_id: string;
  display_name: string;
  created_at: string;
};

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, friendsResult, requestsResult, leaderboardResult] = await Promise.all([
    supabase.from("profiles").select("friend_code").eq("id", user.id).single(),
    supabase.rpc("list_friends"),
    supabase.rpc("list_friend_requests"),
    supabase.rpc("weekly_friends_leaderboard"),
  ]);

  const queryError =
    profileResult.error || friendsResult.error || requestsResult.error || leaderboardResult.error;
  if (queryError) throw new Error(queryError.message);

  const friends = (friendsResult.data ?? []) as FriendRow[];
  const requests = (requestsResult.data ?? []) as RequestRow[];
  const leaderboard = (leaderboardResult.data ?? []) as LeaderboardRow[];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Friends</h1>
        <p className="text-sm text-stone-500">Share codes to connect and compare weekly study progress.</p>
      </header>

      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <h2 className="font-medium">Your friend code</h2>
          <p className="mt-1 font-mono text-lg tracking-wider text-amber-300">
            {profileResult.data.friend_code}
          </p>
        </div>
        <form action={addFriendByCode} className="flex flex-wrap gap-2">
          <input
            name="friend_code"
            required
            maxLength={32}
            placeholder="Enter a friend’s code"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
          >
            Send request
          </button>
        </form>
        {params.error && <p role="alert" className="text-sm text-orange-300">{params.error}</p>}
        {params.sent && <p role="status" className="text-sm text-stone-500">Friend request sent.</p>}
        {params.updated && <p role="status" className="text-sm text-stone-500">Friend request updated.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Friend requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-stone-500">No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li key={request.request_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
                <div>
                  <p className="font-medium">{request.display_name}</p>
                  <p className="text-xs text-stone-500">
                    {request.direction === "incoming" ? "Wants to be your friend" : "Request sent"}
                  </p>
                </div>
                {request.direction === "incoming" && (
                  <div className="flex gap-2">
                    <form action={respondToFriendRequest}>
                      <input type="hidden" name="request_id" value={request.request_id} />
                      <input type="hidden" name="accept" value="true" />
                      <button type="submit" className="rounded-lg bg-teal-800 px-3 py-2 text-sm text-white">Accept</button>
                    </form>
                    <form action={respondToFriendRequest}>
                      <input type="hidden" name="request_id" value={request.request_id} />
                      <input type="hidden" name="accept" value="false" />
                      <button type="submit" className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Decline</button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Friends list <span className="text-sm font-normal text-stone-500">({friends.length})</span></h2>
        {friends.length === 0 ? (
          <p className="text-sm text-stone-500">Accepted friends will appear here.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li key={friend.friend_id} className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
                {friend.display_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Weekly leaderboard</h2>
          <p className="text-xs text-stone-500">Cards reviewed since Monday 00:00 UTC. Each review, including a retry, counts.</p>
        </div>
        <ol className="space-y-2">
          {leaderboard.map((row, index) => (
            <li key={row.user_id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
              <span><span className="mr-3 text-stone-500">{index + 1}.</span>{row.display_name}{row.user_id === user.id ? " (you)" : ""}</span>
              <span className="font-mono text-amber-300">{row.cards_reviewed}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
