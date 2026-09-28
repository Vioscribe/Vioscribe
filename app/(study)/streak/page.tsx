import StreakView from "@/components/StreakView";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function StreakPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const userId = await requireUserId();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, friend_code, daily_goal, reviews_today, reviews_date, current_streak, last_goal_date",
    )
    .eq("id", userId)
    .single();

  if (!profile) return <p>Profile not found. Try signing out and back in.</p>;

  const result = params.saved === "1"
    ? "saved"
    : params.error === "invalid"
      ? "invalid"
      : params.error === "save"
        ? "error"
        : undefined;

  return <StreakView key={params.saved ?? params.error ?? "current"} profile={profile as Profile} result={result} />;
}
