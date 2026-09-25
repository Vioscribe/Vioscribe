import { notFound } from "next/navigation";
import ReviewSession from "@/components/ReviewSession";
import { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/types";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { id } = await params;
  const { room: roomId } = await searchParams;
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  // The room RLS policy permits this read only while the signed-in user belongs.
  if (roomId) {
    const { data: room } = await supabase.from("rooms").select("id").eq("id", roomId).single();
    if (!room) notFound();
  }

  // Load the deck once so the session can offer a voluntary full review pass.
  const [allCardsResult, dueCardsResult] = await Promise.all([
    supabase
      .from("cards")
      .select("id, deck_id, front, back, interval_minutes, next_review_at")
      .eq("deck_id", id)
      .order("next_review_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, deck_id, front, back, interval_minutes, next_review_at")
      .eq("deck_id", id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true }),
  ]);
  const allCards = (allCardsResult.data || []) as Card[];
  const dueCards = (dueCardsResult.data || []) as Card[];

  return (
    <ReviewSession
      deckId={deck.id}
      deckTitle={deck.title}
      roomId={roomId || null}
      initialCards={dueCards}
      allCards={allCards}
    />
  );
}
