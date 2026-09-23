import Link from "next/link";
import { signOut } from "@/app/actions";

const links = [
  { href: "/decks", label: "Decks" },
  { href: "/notes", label: "Notes" },
  { href: "/streak", label: "Streak" },
];

export default function Nav({ displayName }: { displayName: string }) {
  return (
    <header className="border-b border-stone-200 bg-white/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/decks" className="text-sm font-semibold tracking-wide text-teal-800">
          Vioscribe
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-stone-600 hover:text-stone-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-stone-500 sm:inline">{displayName}</span>
          <form action={signOut}>
            <button type="submit" className="text-stone-500 hover:text-stone-800">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
