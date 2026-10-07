import { csvCell } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to export this deck." }, { status: 401 });

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (deckError || !deck) return Response.json({ error: "Deck not found." }, { status: 404 });

  const { data: cards, error } = await supabase
    .from("cards")
    .select("front, back")
    .eq("deck_id", id)
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: "Could not export this deck." }, { status: 500 });

  const csv = [
    "front,back",
    ...(cards ?? []).map((card) => `${csvCell(card.front)},${csvCell(card.back)}`),
  ].join("\r\n");
  const filename = deck.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "deck";
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
