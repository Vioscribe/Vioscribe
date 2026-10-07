import Link from "next/link";
import { copySharedDeck, reportSharedDeck } from "@/app/actions";

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
    <div className="flex flex-wrap items-end gap-4">
      <form action={copySharedDeck}>
        <input type="hidden" name="share_slug" value={slug} />
        <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900">
          Save a copy to my decks
        </button>
      </form>
      <details className="text-sm">
        <summary className="cursor-pointer text-stone-600 underline">Report this deck</summary>
        <form action={reportSharedDeck} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="share_slug" value={slug} />
          <label className="sr-only" htmlFor="deck-report-reason">Report reason</label>
          <select id="deck-report-reason" name="reason" required className="rounded border border-stone-300 bg-white px-2 py-1">
            <option value="">Choose a reason</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="bullying">Bullying or harassment</option>
            <option value="personal_information">Personal information</option>
            <option value="other">Other concern</option>
          </select>
          <button type="submit" className="rounded border border-stone-300 px-3 py-1">Send report</button>
        </form>
      </details>
    </div>
  );
}
