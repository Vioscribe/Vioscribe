import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions";
import ResponsiveNavLinks from "@/components/ResponsiveNavLinks";



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
        <ResponsiveNavLinks />
