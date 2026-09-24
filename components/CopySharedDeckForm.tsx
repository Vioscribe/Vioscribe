import Link from "next/link";
import { copySharedDeck } from "@/app/actions";

export default function CopySharedDeckForm({
  slug,
  signedIn,
}: {
  slug: string;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <p className="text-sm text-stone-500">
        <Link href="/login" className="text-amber-300 underline">Sign in</Link> to save a copy to your decks.
      </p>
    );
  }

  return (
    <form action={copySharedDeck}>
      <input type="hidden" name="share_slug" value={slug} />
      <button
        type="submit"
        className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
      >
        Save a copy to my decks
      </button>
    </form>
  );
}
