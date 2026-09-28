import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="site-footer-mark">[ Vioscribe ]</span>
      <nav aria-label="Legal and contact" className="site-footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
      </nav>
    </footer>
  );
}
