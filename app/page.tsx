import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabase = configured ? await createClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-teal-800">Vioscribe</p>
      <h1 className="text-3xl font-semibold tracking-tight">Study in small slices.</h1>
      <p className="text-stone-600">
        Flashcards, a flip-card review, notes, and a daily streak. Sign in to start.
      </p>
      <Link
        href={user ? "/decks" : "/login"}
        className="inline-flex w-fit rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
      >
        {user ? "Open decks" : "Sign in"}
      </Link>
    </main>
  );
}
