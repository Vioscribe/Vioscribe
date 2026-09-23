import { notFound } from "next/navigation";
import ReviewSession from "@/components/ReviewSession";
import { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/types";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  // Due cards first (including brand-new ones, whose next_review_at is "now")
  const { data: cards } = await supabase
    .from("cards")
    .select("id, deck_id, front, back, interval_minutes, next_review_at")
    .eq("deck_id", id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true });

  return (
    <ReviewSession
      deckId={deck.id}
      deckTitle={deck.title}
      initialCards={(cards || []) as Card[]}
    />
  );
}
