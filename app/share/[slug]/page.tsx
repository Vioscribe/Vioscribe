import { notFound } from "next/navigation";
import Link from "next/link";
import CopySharedDeckForm from "@/components/CopySharedDeckForm";
import { createClient } from "@/lib/supabase/server";

export default async function SharedDeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: deck }, { data: auth }] = await Promise.all([
    supabase
      .from("decks")
      .select("id, title, share_slug, is_shareable")
      .eq("share_slug", slug)
      .eq("is_shareable", true)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!deck) notFound();

  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, front, back")
    .eq("deck_id", deck.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <main className="shared-deck-page mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:underline">Vioscribe</Link>
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-amber-300">Shared deck · read only</p>
        <h1 className="text-2xl font-semibold">{deck.title}</h1>
        <p className="text-sm text-stone-500">{cards?.length ?? 0} cards</p>
      </header>

      <CopySharedDeckForm slug={slug} signedIn={Boolean(auth.user)} />

      <ol className="space-y-3">
        {(cards ?? []).map((card, index) => (
          <li key={card.id} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Front · {index + 1}</p>
              <p className="whitespace-pre-wrap">{card.front}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Back</p>
              <p className="whitespace-pre-wrap">{card.back}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
