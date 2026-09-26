# Vioscribe — Work Split: Track B (Features, Polish & Docs)

This is one of two parallel work streams splitting the remaining MVP work so two people/tools can build at the same time without colliding. Track A (email/auth, live database, RLS, deployment) is a separate brief — don't duplicate anything from it. Read `mvp-spec.md` in full first; it's still the canonical source of truth for every feature and rule.

## Why this split
Track B owns new features and everything front-end/content — the "what does the app do and look like" half. Track A owns auth, the live database, RLS, and deployment. Splitting this way means the two tracks rarely touch the same files.

## How to work through this
Build one item at a time, in the numbered order below — fully finish and report back on one before starting the next, rather than working on several in parallel or jumping ahead. This is deliberate: it keeps focus on one thing at a time and makes it much easier to review what changed and catch problems early, rather than untangling several half-finished features at once.

## Status
1. ~~Filing system~~ — **done.** `files` table + RLS, nullable `file_id` on `notes`/`decks`, the Filing Room UI, and the free/paid limits are all built. Start with item 2 below.

## Your scope (work in this order)

2. **Badge system scope decision + fix**
   - This was built ahead of the original spec (streak-milestone badges, "First 100," developer badge, locked Pro/Classroom Pro placeholders). Confirm with me whether to keep all of it, trim any part, or just fix the known issue below — don't decide this alone.
   - Known issue either way: the "First 100" badge is currently computed by sorting `profiles` by `created_at`/id rather than stored as a permanent flag, so deleting a test account could shift who counts. If the badge is being kept, store it as an immutable flag set at signup time instead.

3. **Custom 404 page**
   - Branded to match the site (ember palette, monospace, campfire motif), a short friendly message, and a link home. Keep it simple — this is polish, not a core flow.

4. **Legal, contact, and docs**
   - A short plain-language Privacy Policy: what's collected (email, study activity, friend connections), that there's no AI processing and no ad tracking, and roughly where data lives (Supabase).
   - A short Terms/acceptable use page.
   - A real contact method (replace the current "Contact email pending" placeholder with the GitHub noreply address I've already given you for anything public-facing).
   - Link both pages from the site footer.
   - Replace the default Next.js starter `README.md` with real setup instructions: how to run the project locally, `.env.local` variable names (never actual values), migration order, and run commands.

## Stop here once items 1–4 are done — do not start these without asking
Two items from the original `mvp-spec.md` were never confirmed as built and aren't part of this brief's core scope. **Do not build either of these until items 1–4 above are fully complete and I've explicitly told you to proceed.** Once you reach this point, stop and ask me directly whether to continue into them — don't assume yes and don't start planning them early.

5. **Notes → card auto-creation** (original Core feature #5): highlighting a note line to turn it into a flashcard, or `term :: definition` lines auto-creating cards. First check whether this already exists in the codebase before treating it as new work — it may have been built quietly alongside the notes editor and just never reported.
6. **Safety section items:** report and block buttons on profiles and shared decks, plus age confirmation at signup. Given the app's under-18 user base, these matter — but they're still new scope, not something to start without a go-ahead.

## Files/areas you own
New `files`/Filing Room feature code and its own migration file, badge-related components, the 404 page, legal/contact pages and footer links, `README.md`, client-side form validation on anything you build.

## Coordination rules — read before starting
- **Don't touch:** Supabase Auth/SMTP settings, existing RLS policies on decks/cards/notes/friends/rooms, Netlify deployment config, or database-level constraints on existing tables — that's Track A.
- Add your database changes as a new, separate migration file — Track A may also be adding constraints to existing tables in parallel, so keep your changes additive and self-contained.
- Pull `main` before starting each session, since Track A is committing in parallel.
- If a decision is genuinely mine to make (the badge system scope decision above, or anything not already spelled out in `mvp-spec.md`), ask clearly and specifically rather than guessing.
- Commit and push incrementally, not in one giant batch.
- Report back what you did at the end of each numbered step, plus anything still outstanding.
- Work through items 1–4 strictly one at a time — don't start item 2 before item 1 is finished and reported on, and so on. Do not touch items 5–6 at all until told to.
