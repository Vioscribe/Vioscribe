import Link from "next/link";
import HomeMascot from "@/components/HomeMascot";
import LandingBrand from "@/components/LandingBrand";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabase = configured ? await createClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <main className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <LandingBrand />
          <span className="landing-header-tag">[ STUDY / READY ]</span>
        </header>

        <section className="landing-hero">
          <p className="landing-eyebrow">A SMALLER WAY TO STUDY</p>
          <h1>
            Keep the spark. <span
              className="landing-slogan-highlight"
              onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - bounds.left) / bounds.width) * 100;
                const y = ((event.clientY - bounds.top) / bounds.height) * 100;
                event.currentTarget.style.setProperty("--shimmer-x", `${x}%`);
                event.currentTarget.style.setProperty("--shimmer-y", `${y}%`);
              }}
            >
              Don’t burn out.
            </span>
          </h1>
          <p className="landing-summary">
            Make a deck, add what you need to remember, then review at a pace that sticks.
          </p>
          <Link href={user ? "/decks" : "/login"} className="landing-cta">
            <span>{user ? "Open your decks" : "Sign in to start"}</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>

        <section className="landing-how" aria-labelledby="landing-how-title">
          <h2 id="landing-how-title" className="landing-section-label">~/HOW_IT_WORKS</h2>
          <ol className="landing-steps">
            <li>
              <span className="landing-step-index">01</span>
              <span><strong>Build a deck</strong><small>Pick one topic to focus on.</small></span>
            </li>
            <li>
              <span className="landing-step-index">02</span>
              <span><strong>Add your cards</strong><small>Question on the front, answer on the back.</small></span>
            </li>
            <li>
              <span className="landing-step-index">03</span>
              <span><strong>Review and repeat</strong><small>Missed cards come back sooner.</small></span>
            </li>
          </ol>
        </section>

        <section className="landing-tools" aria-label="More study tools">
          <span>notes <i>{"// capture ideas"}</i></span>
          <span>streaks <i>{"// keep a rhythm"}</i></span>
          <span>friends + rooms <i>{"// study together"}</i></span>
        </section>
      </div>
      <HomeMascot />
    </main>
  );
}
