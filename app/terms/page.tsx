import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms | Vioscribe" };

export default function TermsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "vioscribe.support@gmail.com";

  return (
    <main className="legal-page">
      <p className="legal-kicker">~/TERMS</p>
      <h1>Terms of use</h1>
      <p className="legal-updated">Last updated: 25 September 2026</p>

      <section>
        <h2>Using Vioscribe</h2>
        <p>
          Vioscribe is a study tool for creating notes and flashcards, reviewing decks, tracking study activity, and studying
          with friends. You are responsible for keeping your account credentials secure and for activity carried out through
          your account.
        </p>
      </section>

      <section>
        <h2>Your content and sharing</h2>
        <p>
          You keep responsibility for the notes, decks, and cards you add. Only mark a deck shareable when you are comfortable
          with anyone who has its public link being able to read it. Do not use Vioscribe to break the law, harass others, or
          interfere with the service or other users’ accounts.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          We work to keep Vioscribe available and your study data protected, but the service may occasionally be interrupted or
          changed. Vioscribe is provided without a promise that it will be uninterrupted or suitable for every purpose. We may
          restrict access when needed to protect users or the service.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Contact us{contactEmail ? <> at <a href={`mailto:${contactEmail}`}>{contactEmail}</a></> : " (the public contact email will be added before launch)."}
        </p>
      </section>
    </main>
  );
}
