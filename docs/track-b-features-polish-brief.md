# Vioscribe — Work Split: Track B (Features, Polish & Docs)


This is one of two parallel work streams splitting the remaining MVP work so two people/tools can build at the same time without colliding. Track A (email/auth, live database, RLS, deployment) is a separate brief — don't duplicate anything from it. Read `mvp-spec.md` in full first; it's still the canonical source of truth for every feature and rule.


## Why this split
Track B owns new features and everything front-end/content — the "what does the app do and look like" half. Track A owns auth, the live database, RLS, and deployment. Splitting this way means the two tracks rarely touch the same files.


## How to work through this
Build one item at a time, in the numbered order below — fully finish and report back on one before starting the next, rather than working on several in parallel or jumping ahead. This is deliberate: it keeps focus on one thing at a time and makes it much easier to review what changed and catch problems early, rather than untangling several half-finished features at once.


## Status (2 October 2026)

**Completed:**
- Filing system — `files` table + RLS, nullable `file_id` on `notes`/`decks`, Filing Room UI, and the free/paid limits.
- Badge scope decision — keep the existing badge system as built.
- Badge system fix — the First 100 badge is stored permanently at signup.
- Custom 404 page — branded page with the sad Sparky mascot and a link home.
- README and setup/deploy documentation — present in the repository.
- Landing hero polish — one text tone, typewriter reveal, and subtle hover glow.

**Current focus:** Legal, contact, and readiness documentation are drafted. They are not launch-cleared; see `docs/legal/compliance-readiness.md` and `docs/current-status-and-potential-issues.md`. The operator's public address remains an explicit blocker at their request.


## Your scope (work in this order)


4. **Legal, contact, and docs — in progress**
   - Draft privacy and terms copy plus the UK legal/privacy readiness checklist are in `docs/legal/`.
   - The Privacy and Terms contact addresses now use `vioscribe.support@gmail.com`; the rest of the public-page copy remains unchanged. The operator’s public identity/address, monitored-mailbox process, processor locations/transfers, and child-safety assessments remain unresolved. Do not mark complete or publish the drafts until those facts are verified.
   - ~~Replace the default starter README with Vioscribe setup and deploy instructions; link the existing Privacy and Terms pages from the footer.~~ **done.**
   - Resolve the launch blockers in `docs/legal/compliance-readiness.md`, confirm the support inbox is monitored, then replace the remaining public Privacy and Terms copy with the reviewed drafts.


## Stop here once items 1–4 are done — do not start these without asking
Two items from the original `mvp-spec.md` were never confirmed as built and aren't part of this brief's core scope. **Do not build either of these until items 1–4 above are fully complete and I've explicitly told you to proceed.** Once you reach this point, stop and ask me directly whether to continue into them — don't assume yes and don't start planning them early.


5. **Notes → card auto-creation** (original Core feature #5): highlighting a note line to turn it into a flashcard, or `term :: definition` lines auto-creating cards. First check whether this already exists in the codebase before treating it as new work — it may have been built quietly alongside the notes editor and just never reported.
6. **Safety section items:** report and block buttons on profiles and shared decks, plus age confirmation at signup. Given the app's under-18 user base, these matter — but they're still new scope, not something to start without a go-ahead.
