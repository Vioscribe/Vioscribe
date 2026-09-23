"use server";

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
  await supabase
    .from("profiles")
    .update({
      daily_goal: goal,
      reviews_today: rolled.reviews_today,
      reviews_date: rolled.reviews_date,
      current_streak: rolled.current_streak,
    })
    .eq("id", user.id);
}
