import Link from "next/link";

export default function SiteFooter() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "vioscribe.support@gmail.com";

  return (
    <footer className="site-footer">
      <span className="site-footer-mark">[ Vioscribe ]</span>
      <nav aria-label="Legal and contact" className="site-footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </nav>
    </footer>
  );
}
