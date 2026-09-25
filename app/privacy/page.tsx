import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy | Vioscribe" };

export default function PrivacyPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <main className="legal-page">
      <p className="legal-kicker">~/PRIVACY</p>
      <h1>Privacy policy</h1>
      <p className="legal-updated">Last updated: 25 September 2026</p>

      <section>
        <h2>What Vioscribe stores</h2>
        <p>
          Vioscribe stores your account email and profile details, including your display name and friend code. It also stores the
          notes, decks, and flashcards you create; friend requests and accepted connections; and study activity such as reviews,
          timer sessions, and streak progress.
        </p>
      </section>

      <section>
        <h2>How we use and store it</h2>
        <p>
          We use this information to provide sign-in, save your study materials, calculate progress, and support the friend and
          study-room features you choose to use. Vioscribe uses Supabase for authentication, database storage, and real-time
          features. Access controls are used to keep private account data scoped to its owner.
        </p>
        <p>
          Your browser also stores the sign-in session and a small preference indicating whether the landing-page introduction
          has already played. These are used for the app experience, not ad tracking.
        </p>
      </section>

      <section>
        <h2>AI and advertising</h2>
        <p>Vioscribe does not use AI to process your study content and does not use ad tracking.</p>
      </section>

      <section>
        <h2>Your choices and questions</h2>
        <p>
          Do not put information in notes or cards that you would not want stored with your account. For privacy questions or a
          request about your account data, contact us{contactEmail ? <> at <a href={`mailto:${contactEmail}`}>{contactEmail}</a></> : " (the public contact email will be added before launch)."}
        </p>
      </section>
    </main>
  );
}
