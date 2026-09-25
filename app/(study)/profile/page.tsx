import { redirect } from "next/navigation";
import { saveClassroomBadgeColor } from "@/app/actions";
import { VerifiedTick } from "@/components/ProfileBadges";
import ProfileBadges from "@/components/ProfileBadges";
import { createClient } from "@/lib/supabase/server";

type ProfileSummary = {
  display_name: string;
  friend_code: string;
  current_streak: number;
  longest_streak: number;
  is_developer: boolean;
  is_first_100: boolean;
  classroom_badge_color: string;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("my_profile_badges");
  if (error) throw new Error(error.message);
  const profile = ((data ?? []) as ProfileSummary[])[0];
  if (!profile) return <p>Profile not found. Try signing out and back in.</p>;

  return (
    <div className="profile-page space-y-8">
      <header className="space-y-2">
        <p className="profile-kicker">~/ACCOUNT</p>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-stone-500">{profile.display_name} <span className="text-stone-400">· friend code {profile.friend_code}</span></p>
      </header>

      <section className="profile-streak-panel" aria-label="Study streak">
        <div className="profile-streak-flame" aria-hidden="true">✦</div>
        <div>
          <p className="profile-kicker">CURRENT STREAK</p>
          <p className="profile-streak-number">{profile.current_streak}<span> days</span></p>
          <p className="text-xs text-stone-500">Personal best: {profile.longest_streak} days</p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Badges</h2>
          <p className="text-xs text-stone-500">Streak awards are permanent and based on your best streak.</p>
        </div>
        <ProfileBadges
          isDeveloper={profile.is_developer}
          isFirst100={profile.is_first_100}
          longestStreak={profile.longest_streak}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Verified tick previews</h2>
          <p className="text-xs text-stone-500">Subscription tiers are not available yet. These are visual previews, not account entitlements.</p>
        </div>
        <div className="profile-tick-grid">
          <div className="profile-tick-card is-locked">
            <div className="flex items-center gap-2">
              <VerifiedTick color="#f97316" />
              <strong>Pro</strong>
              <span className="profile-badge-state">LOCKED</span>
            </div>
            <p>Warm orange pixel tick · unavailable until Pro launches.</p>
          </div>
          <div className="profile-tick-card">
            <div className="flex items-center gap-2">
              <VerifiedTick color={profile.classroom_badge_color} pulse />
              <strong>Classroom Pro</strong>
              <span className="profile-badge-state">PREVIEW</span>
            </div>
            <p>Choose a color for the future pulsing Classroom Pro tick.</p>
            <form action={saveClassroomBadgeColor} className="profile-color-form">
              <label htmlFor="classroom-badge-color">Tick color</label>
              <input
                id="classroom-badge-color"
                name="classroom_badge_color"
                type="color"
                defaultValue={profile.classroom_badge_color}
              />
              <button type="submit" className="profile-save-button">Save color</button>
            </form>
            {params.saved && <p role="status" className="text-xs text-emerald-300">Color saved.</p>}
            {params.error && <p role="alert" className="text-xs text-red-300">{params.error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
