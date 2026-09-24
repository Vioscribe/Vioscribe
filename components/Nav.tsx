import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions";

const links = [
  { href: "/decks", label: "Decks" },
  { href: "/notes", label: "Notes" },
  { href: "/streak", label: "Streak" },
  { href: "/friends", label: "Friends" },
];

export default function Nav({ displayName }: { displayName: string }) {
  return (
    <header className="border-b border-stone-200 bg-black">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 py-3 pl-0 pr-4">
        <Link href="/decks" aria-label="Vioscribe home" className="shrink-0">
          <Image src="/vioscribe-logo.png" alt="[ Vioscribe ]" width={162} height={50} priority />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-stone-600 hover:text-amber-300">
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
