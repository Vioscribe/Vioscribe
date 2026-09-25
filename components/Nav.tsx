import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions";

const links = [
  { href: "/decks", label: "Decks" },
  { href: "/notes", label: "Notes" },
  { href: "/streak", label: "Streak" },
  { href: "/friends", label: "Friends" },
  { href: "/rooms", label: "Rooms" },
  { href: "/heatmap", label: "Activity" },
];

export default function Nav({ displayName }: { displayName: string }) {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/decks" aria-label="Vioscribe home" className="site-nav-brand">
          <Image
            className="site-nav-logo"
            src="/vioscribe-logo.png"
            alt="[ Vioscribe ]"
            width={162}
            height={50}
            priority
          />
        </Link>
        <nav className="site-nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="site-nav-account">
          <span className="site-nav-name">{displayName}</span>
          <form action={signOut}>
            <button type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
