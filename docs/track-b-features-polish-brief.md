# Vioscribe — Work Split: Track B (Features, Polish & Docs)


This is one of two parallel work streams splitting the remaining MVP work so two people/tools can build at the same time without colliding. Track A (email/auth, live database, RLS, deployment) is a separate brief — don't duplicate anything from it. Read `mvp-spec.md` in full first; it's still the canonical source of truth for every feature and rule.


## Why this split
Track B owns new features and everything front-end/content — the "what does the app do and look like" half. Track A owns auth, the live database, RLS, and deployment. Splitting this way means the two tracks rarely touch the same files.


## How to work through this
Build one item at a time, in the numbered order below — fully finish and report back on one before starting the next, rather than working on several in parallel or jumping ahead. This is deliberate: it keeps focus on one thing at a time and makes it much easier to review what changed and catch problems early, rather than untangling several half-finished features at once.


## Status
1. ~~Filing system~~ — **done.** `files` table + RLS, nullable `file_id` on `notes`/`decks`, the Filing Room UI, and the free/paid limits are all built.
2. ~~Badge scope decision~~ — **done.** Keep the existing badge system as built.
3. ~~Badge system fix~~ — **done.** The First 100 badge is now stored permanently at signup, so deleting a profile cannot change who earned it.
4. ~~Custom 404 page~~ — **done.** The branded 404 page includes the sad Sparky mascot and a link home.


## Your scope (work in this order)


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
