import Link from "next/link";
import LeaderboardTabs from "@/components/LeaderboardTabs";

export default function GlobalLeaderboardPage() {
  return (
    <div className="space-y-6">
      <LeaderboardTabs active="global" />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Global leaderboard</h1>
        <p className="text-sm text-stone-500">A worldwide ranking isn’t available yet. Your study time is being recorded for future leaderboards.</p>
      </header>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="font-medium text-amber-700">Coming soon</p>
        <p className="mt-2 text-sm text-stone-500">For now, compare progress with your friends or the people in a study room.</p>
        <Link href="/friends" className="mt-4 inline-flex text-sm text-amber-700 underline">View friends leaderboard</Link>
      </div>
    </div>
  );
}
