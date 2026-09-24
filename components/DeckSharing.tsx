import Link from "next/link";
import { setDeckShareable } from "@/app/actions";

export default function DeckSharing({
  deckId,
  shareable,
  shareSlug,
}: {
  deckId: string;
  shareable: boolean;
  shareSlug: string | null;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-medium">Share this deck</h2>
        <p className="mt-1 text-sm text-stone-500">
          {shareable
            ? "Anyone with the link can view the cards."
            : "Create a read-only link that anyone can open."}
        </p>
      </div>

      {shareable && shareSlug && (
        <p className="break-all text-sm">
          Public link: {" "}
          <Link href={`/share/${shareSlug}`} target="_blank" className="text-amber-300 underline">
            /share/{shareSlug}
          </Link>
        </p>
      )}

      <form action={setDeckShareable}>
        <input type="hidden" name="deck_id" value={deckId} />
        <input type="hidden" name="shareable" value={String(!shareable)} />
        <button
          type="submit"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100"
        >
          {shareable ? "Turn sharing off" : "Create public link"}
        </button>
      </form>
    </section>
  );
}
