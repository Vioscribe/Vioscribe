import StreakView from "@/components/StreakView";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function StreakPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, friend_code, daily_goal, reviews_today, reviews_date, current_streak, last_goal_date",
    )
    .eq("id", user!.id)
    .single();

  if (!profile) return <p>Profile not found. Try signing out and back in.</p>;

  return <StreakView profile={profile as Profile} />;
}
