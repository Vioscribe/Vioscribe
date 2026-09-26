# Vioscribe — Work Split: Track A (Infrastructure & Release Readiness)

This is one of two parallel work streams splitting the remaining MVP work so two people/tools can build at the same time without colliding. Track B (filing system, badges, polish, legal/docs) is a separate brief — don't duplicate anything from it. Read `mvp-spec.md` in full first; it's still the canonical source of truth for every feature and rule.

## Why this split
Track A owns everything touching auth, the live database, RLS, and deployment — the "does this actually work in production" half. Track B owns new features and everything front-end/content — the "what does the app do and look like" half. Splitting this way means the two tracks rarely touch the same files.

## Your scope (work in this order)

1. **Email deliverability**
   - Diagnose why a second test account didn't get its signup confirmation email — check first whether it's Supabase's built-in email rate limit.
   - Set up a real SMTP provider (Resend, Postmark, or SendGrid) in Supabase Auth settings.
   - Confirm two separate real email addresses can sign up and get confirmation emails.
   - Verify Google OAuth against the actual dev callback URL (production comes later, once the domain exists).

2. **Confirm live Supabase migration state**
   - Connect to the actual production Supabase project and confirm every migration in `supabase/migrations/` has actually been applied there — don't assume from the migration files alone.
   - A recent log export showed old permission/missing-column errors that couldn't be confirmed as stale or current — resolve that ambiguity directly.

3. **RLS re-audit + input validation on the live database**
   - Re-verify RLS policies against production for: decks, cards, notes, friends/friend requests, rooms, room presence, shared decks, study sessions/timers.
   - Add database-level input validation where it's missing — sensible `CHECK` constraints and length limits (e.g. note/card content, titles, display names shouldn't be unbounded; friend codes should match an expected format). This is a genuine gap, not originally in the launch checklist — flag anything you fix here in your report.
   - Confirm the Supabase service role key is never exposed client-side.

4. **Two-account end-to-end testing**
   - Create two real test accounts and click through: friend request send/accept, friends leaderboard, shared deck preview + "save a copy," room join + presence, personal timer minutes correctly reaching both room and friends leaderboards.
   - Fix anything broken you find — don't just report it.
   - This step depends on steps 1–3 being solid first, since it's testing the auth/RLS work you just did.

5. **Netlify deployment**
   - Confirm the Netlify project deploys `main` correctly with all required production environment variables set.
   - I'll buy the domain myself (needs a payment method) — once I give you the domain name, update Supabase Auth Site URL/Redirect URLs, Google OAuth redirect URIs, and any hardcoded site URL in the codebase.
   - Tell me clearly when you need the domain name, then keep working on anything else in the meantime.

## Files/areas you own
`supabase/` (migrations, RLS policies), Supabase dashboard config, Netlify config/env vars, anything in the codebase that reads environment variables for auth redirects.

## Coordination rules — read before starting
- **Don't touch:** the filing system, badges, the 404 page, legal/contact pages, or `README.md` — that's Track B.
- If you need a new database migration, create a new timestamped file rather than editing an existing one or `schema.sql` directly — Track B will also be adding its own migration (for a new `files` table), so keep changes additive and separate to avoid conflicts.
- Pull `main` before starting each session, since Track B is committing in parallel.
- If a decision is genuinely mine to make (SMTP provider choice if there's a real tradeoff, the domain name, anything involving payment), ask clearly and specifically rather than guessing.
- Commit and push incrementally, not in one giant batch.
- Report back what you did and fixed at the end of each numbered step, plus anything still outstanding.
