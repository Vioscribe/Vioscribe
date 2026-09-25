import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-flame" aria-hidden="true">
        <span> ░ </span>
        <span>▒█▒</span>
        <span>▓██▓</span>
        <span> ▄▄ </span>
      </div>
      <p className="legal-kicker">404 / PATH_NOT_FOUND</p>
      <h1>This trail went cold.</h1>
      <p>That page isn’t here. Let’s head back to the campfire.</p>
      <Link href="/" className="landing-cta">Back to Vioscribe <span aria-hidden="true">-&gt;</span></Link>
    </main>
  );
}
