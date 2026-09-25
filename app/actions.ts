"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyDayRollover, applyReview } from "@/lib/streak";
import { nextAfterGotIt, nextAfterMissed } from "@/lib/srs";
import type { Profile } from "@/lib/types";

function todayFromForm(formData: FormData) {
  // Browser sends local calendar date so streaks don't depend on UTC.
  return String(formData.get("today") || new Date().toISOString().slice(0, 10));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createDeck(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("decks")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not create deck");
  redirect(`/decks/${data.id}`);
}

export async function deleteDeck(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("decks").delete().eq("id", id);
  redirect("/decks");
}

export async function setDeckShareable(formData: FormData) {
  const id = String(formData.get("deck_id") || "");
  const shareable = String(formData.get("shareable") || "") === "true";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("decks")
    .update({
      is_shareable: shareable,
      share_slug: shareable ? randomUUID() : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect(`/decks/${id}`);
}

export async function copySharedDeck(formData: FormData) {
  const slug = String(formData.get("share_slug") || "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deckId, error } = await supabase.rpc("copy_shared_deck", {
    source_slug: slug,
  });
  if (error || !deckId) throw new Error(error?.message || "Could not copy shared deck");
  redirect(`/decks/${deckId}`);
}

export async function addFriendByCode(formData: FormData) {
  const code = String(formData.get("friend_code") || "").trim();
  if (!code) redirect("/friends?error=Enter%20a%20friend%20code");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("add_friend_by_code", { target_code: code });
  if (error) redirect(`/friends?error=${encodeURIComponent(error.message)}`);
  redirect("/friends?sent=1");
}

export async function respondToFriendRequest(formData: FormData) {
  const requestId = String(formData.get("request_id") || "");
  const accept = String(formData.get("accept") || "") === "true";
  if (!requestId) redirect("/friends?error=Friend%20request%20not%20found");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("respond_to_friend_request", {
    request_id: requestId,
    accept_request: accept,
  });
  if (error) redirect(`/friends?error=${encodeURIComponent(error.message)}`);
  redirect("/friends?updated=1");
}

export async function createStudyRoom() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("create_study_room").single();
  if (error || !data) redirect(`/rooms?error=${encodeURIComponent(error?.message || "Could not create room")}`);
  const room = data as { room_id: string };
  redirect(`/rooms/${room.room_id}`);
}

export async function joinStudyRoom(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  if (!code) redirect("/rooms?error=Enter%20a%20room%20code");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roomId, error } = await supabase.rpc("join_study_room", { room_code: code });
  if (error || !roomId) redirect(`/rooms?error=${encodeURIComponent(error?.message || "Could not join room")}`);
  redirect(`/rooms/${roomId}`);
}

export async function leaveStudyRoom(formData: FormData) {
  const roomId = String(formData.get("room_id") || "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("leave_study_room", { target_room_id: roomId });
  if (error) redirect(`/rooms/${roomId}?error=${encodeURIComponent(error.message)}`);
  redirect("/rooms?left=1");
}

export async function saveCard(formData: FormData) {
  const deckId = String(formData.get("deck_id") || "");
  const cardId = String(formData.get("card_id") || "");
  const front = String(formData.get("front") || "").trim();
  const back = String(formData.get("back") || "").trim();
  if (!front || !back) return;

  const supabase = await createClient();

  if (cardId) {
    await supabase.from("cards").update({ front, back }).eq("id", cardId);
  } else {
    await supabase.from("cards").insert({ deck_id: deckId, front, back });
  }

  redirect(`/decks/${deckId}`);
}

export async function deleteCard(formData: FormData) {
  const deckId = String(formData.get("deck_id") || "");
  const cardId = String(formData.get("card_id") || "");
  const supabase = await createClient();
  await supabase.from("cards").delete().eq("id", cardId);
  redirect(`/decks/${deckId}`);
}

export async function reviewCard(formData: FormData) {
  const cardId = String(formData.get("card_id") || "");
  const known = String(formData.get("result") || "") === "got_it";
  const roomId = String(formData.get("room_id") || "") || null;
  const today = todayFromForm(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: card } = await supabase
    .from("cards")
    .select("id, interval_minutes")
    .eq("id", cardId)
    .single();

  if (!card) return;

  const interval = known
    ? nextAfterGotIt(card.interval_minutes)
    : nextAfterMissed();
  const nextReview = new Date(Date.now() + interval * 60 * 1000).toISOString();

  await supabase
    .from("cards")
    .update({ interval_minutes: interval, next_review_at: nextReview })
    .eq("id", cardId);

  const { error: reviewLogError } = await supabase
    .from("study_reviews")
    .insert({ user_id: user.id, card_id: card.id, room_id: roomId });
  if (reviewLogError) throw new Error(reviewLogError.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, friend_code, daily_goal, reviews_today, reviews_date, current_streak, last_goal_date",
    )
    .eq("id", user.id)
    .single();

  if (profile) {
    const updated = applyReview(profile as Profile, today);
    await supabase
      .from("profiles")
      .update({
        reviews_today: updated.reviews_today,
        reviews_date: updated.reviews_date,
        current_streak: updated.current_streak,
        last_goal_date: updated.last_goal_date,
      })
      .eq("id", user.id);
  }
}

export async function saveNotes(content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
}

export async function saveDailyGoal(formData: FormData) {
  const goal = Math.max(1, Number(formData.get("daily_goal") || 10));
  const today = todayFromForm(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, friend_code, daily_goal, reviews_today, reviews_date, current_streak, last_goal_date",
    )
    .eq("id", user.id)
    .single();

  if (!profile) return;

  const rolled = applyDayRollover({ ...(profile as Profile), daily_goal: goal }, today);
  if (rolled.reviews_today >= goal && rolled.last_goal_date !== today) {
    rolled.current_streak += 1;
    rolled.last_goal_date = today;
  }
  await supabase
    .from("profiles")
    .update({
      daily_goal: goal,
      reviews_today: rolled.reviews_today,
      reviews_date: rolled.reviews_date,
      current_streak: rolled.current_streak,
      last_goal_date: rolled.last_goal_date,
    })
    .eq("id", user.id);
}

export async function saveClassroomBadgeColor(formData: FormData) {
  const color = String(formData.get("classroom_badge_color") || "");
  if (!/^#[\da-fA-F]{6}$/.test(color)) {
    redirect("/profile?error=Choose%20a%20valid%20badge%20color");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ classroom_badge_color: color })
    .eq("id", user.id);
  if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  redirect("/profile?saved=1");
}
