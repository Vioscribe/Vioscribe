# Study Platform MVP Spec — Vioscribe

## Goal
A study web app where students make notes and flashcards, review them daily, keep streaks, share decks with friends, and study together in a shared timer room. The product has no AI features on any plan. The goal is to test whether students come back daily.

## Before starting (read this first)
This is not a fresh project — there's an existing codebase and GitHub repo already in place, and it may have been worked on by more than one tool/session. Before doing anything else:
1. Look through the existing codebase (routes, components, database schema, migrations/RLS policies) to see what's actually implemented — don't assume anything about progress.
2. Run the app locally and click through it to confirm what currently works end-to-end (including things like signup, deck creation, etc. — not just that a page renders).
3. Report back a quick summary of what's done, what's partially done, and what's missing from the "Core features" list below, before continuing to build.
4. Continue building whatever's missing from Phase 1 first (review mode, streaks, notes, etc., if not already done) before moving on to anything else in this spec (friends, study rooms, leaderboards, etc.).

## Branding
- **Name:** Vioscribe.
- **Logo:** a finished combined lockup — a pixel-art campfire icon (yellow/orange/red flame on brown pixel logs) next to the monospace bracket wordmark `[ Vioscribe ]`, with the wordmark colours matched to the flame palette (cream/yellow text, orange brackets) for readability against the dark background. Supplied as an image asset (`vioscribe-logo-combined.png`) — use this file for the header and favicon rather than generating new artwork.
- **Wordmark colour:** use a light/cream text colour (not dark brown or black) for "Vioscribe" and the brackets when placed against the dark campfire background, so the text stays readable. On light backgrounds elsewhere in the app, standard dark text is fine.
- **Theme tie-in:** the campfire motif connects to the streak feature (see the ASCII theme system in Profile customisation, post-MVP) — flames and warm tones are the brand's visual signature.
- **Future idea — interactive/animated logo (post-MVP, not needed now, just keep in mind):** the campfire and the "Vioscribe" letters could eventually react and animate like real (but still pixelated) fire — e.g. subtle flickering, colour shifting, or the letters themselves taking on a fire-like animated texture. This is a nice-to-have polish item for later, not part of the MVP build.
- **Site-wide typeface:** use a clean coding/monospace font (e.g. JetBrains Mono, IBM Plex Mono, or Fira Code) as the primary typeface across the entire site — headings, body text, buttons, everything — not just the logo. The whole UI should feel like it belongs to the same terminal/coding aesthetic as the name and logo, while still staying clean and easy to read (not a gimmicky "hacker" overload). Keep layouts simple and uncluttered so the monospace font stays legible at normal reading sizes.

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres database, Auth (email + Google), Realtime (for study rooms and presence)
- TipTap for the notes editor
- Deploy on Netlify
- Row Level Security on every table so users can only access their own data or data shared with them

## Current build status (code snapshot: 17bd3c8, checked 29 September 2026)
This section records verified project status. The current `main` branch is at `17bd3c8`; the live Netlify site was last published from `12b74d2` because later production deploys were skipped after the team exhausted its available deploy credits. See the deployment note below.

**Implemented in code:**
- Core study loop: auth (email/password + Google), profile creation with friend code, decks/cards CRUD, flashcard review with spaced repetition, TipTap notes editor with autosave, daily goal + streak tracking (now also tracking `longest_streak`).
- Daily goal editing: users can choose 2–30 reviews per day; Sparky’s message changes with the selected goal. The daily-goal range migration was applied in Supabase, as confirmed by the project owner. Goal-editor copy and controls use explicit high-contrast colors, and the goal messages avoid em dashes.
- Friends and sharing: add-by-code friend requests, friends list, weekly friends leaderboard (minutes/cards toggle), shareable deck links with logged-out preview and "save a copy."
- Rooms and activity: create/join rooms by code (4-member cap), live presence (via Realtime Presence, not Postgres Changes), personal (not room-synced) Pomodoro timer whose minutes feed room + friends leaderboards, room leaderboard, current-month heatmap, streak display, global leaderboard as a locked "Coming soon" placeholder.
- UI/branding: ember/campfire palette and monospace styling site-wide, one-time reduced-motion-aware campfire ignition on first landing visit, pixel-art mascot ("Sparky") with cursor-tracking eyes and click interactions.
- Filing system: `files` table with RLS, nullable `file_id` on `notes` and `decks`, a pixel-art Filing Room tab for browsing files and their contents, and the free/paid file-count and items-per-file limits enforced in one central place.
- A Realtime bug in the personal timer (an invalid `user_id` filter) was found and fixed in `bb6d962` — code-only fix, no migration needed; Supabase logs showed clean (0 errors) after the fix.
- **Badge scope decision made:** keep the existing badge system. The "First 100" award is stored permanently at signup; see the Track B status and the badge implementation notes below. Streak-milestone and developer badges, plus locked Pro/Classroom Pro placeholders, are also implemented.

**Current production deployment:** Vioscribe is live at [vioscribe.netlify.app](https://vioscribe.netlify.app/). Netlify reports that production deploys are paused because the team used all available credits for the current billing period (25 September–24 October 2026). The billing page shows the next period beginning 25 October 2026. Commits `70e7735` and `17bd3c8` are on GitHub `main` but were skipped by Netlify, so the live site is still on `12b74d2`. Netlify says published sites remain live while production deploys are paused. Track A owns restoring deployment after credits reset or the project owner changes the plan.

**Remaining launch gates (checked 29 September 2026):**
1. Confirm signup email delivery and Google OAuth against the configured development and production callback URLs.
2. Complete two-account end-to-end verification for friend requests, friends leaderboard, shared-deck preview/copy, room join/presence, and timer minutes flowing to the room and friends leaderboards.
3. Confirm the full live Supabase migration state and re-audit production RLS. The daily-goal range migration was applied and confirmed by the project owner; that does not verify every migration or policy.
4. Deploy the latest `main` to production once Netlify allows production deploys again; verify production environment variables and auth redirects.
5. Resolve the legal and child-safety launch blockers in `docs/legal/compliance-readiness.md`. The public Privacy and Terms pages and contact address exist, but their factual/legal review is incomplete. The operator’s public address remains an explicit launch blocker at the owner’s request.
6. Complete the security review in `docs/security/security-checklist.md`, including checks against the production configuration.
7. Decide and scope the deferred safety features (report/block and age-appropriate signup/access measures) before treating the service as ready for students.

The checklist above replaces earlier launch-status notes that incorrectly described the live deployment, legal pages, custom 404, and README as absent.

## Pages
1. **Landing / login:** short pitch, sign up, log in.
2. **Dashboard:** current streak, today's daily goal progress, decks due for review, friends' activity.
3. **Notes:** list of notes plus a TipTap-based text editor (headings and bullets). Autosave.
4. **Decks:** list of decks, deck detail page, add/edit/delete cards.
5. **Review:** flip-card screen. Buttons: "Got it" / "Not yet". Simple spaced repetition: missed cards return sooner, known cards return later.
6. **Friends:** add by friend code, see their streak and weekly study time.
7. **Study room:** shared Pomodoro timer (25/5) with a live list of who's in the room.
8. **Leaderboard:** friends-only weekly ranking (minutes studied / cards reviewed) and a room-wide ranking for whoever is in a study room together — both built and working in the MVP for all users. The platform-wide global leaderboard (all users, with rank badges) is a separate, bigger feature — show that specific view as locked with a "Coming soon" message and an upgrade prompt for now.
9. **Shared deck page:** open a deck link, preview it, "Save a copy to my decks".
10. **Filing Room:** a pixel-art filing-cabinet-styled tab where notes and decks can be organised into user-created "files" (e.g. "Maths Notes"), each holding any mix of notes and decks. Purely organisational — a note or deck doesn't have to live in a file, and still shows up in the regular Notes/Decks lists either way.

## Core features (build in this order)
1. Auth and user profile (display name, friend code)
2. Decks and cards (manual create, edit, delete)
3. Review mode with simple spaced repetition
4. Streaks and daily goal (streak increases when the daily goal is met, resets after a missed day)
5. Notes editor; users can highlight a line and turn it into a card, or use `term :: definition` lines to auto-create cards
6. Shared deck links (public read-only link, copy to own account)
7. Friends via friend code and a weekly friends-only leaderboard
8. Study room with a synced timer, a live presence list, and a room-wide leaderboard for whoever is in the room (Supabase Realtime)
9. Study heatmap: a calendar grid (like a GitHub contribution graph) colored by daily study activity from `study_sessions` and `reviews`. Free users see the current month and streak number only; Pro users see full year view, monthly view, and a breakdown by deck.
10. Global (platform-wide) leaderboard page as a locked "Coming soon" placeholder — this is the bigger Pro/Classroom Pro feature with rank badges; build the real ranking logic once payments exist.
11. Filing system: user-created "files" that group notes and decks together, browsed via the Filing Room tab (pixel-art filing-cabinet visual — drawers/folders, not a plain list). Free/Pro/Classroom Pro differ by how many files a user can create and how many items (notes + decks combined) each file can hold.

## Data model (tables)
- `profiles`: id, display_name, friend_code, plan, tick_colour, created_at, avatar_id (post-MVP), pet_id (post-MVP)
- `notes`: id, user_id, title, content, updated_at, file_id (nullable, references `files`)
- `decks`: id, user_id, title, share_slug (nullable), created_at, file_id (nullable, references `files`)
- `files`: id, user_id, title, created_at (a user-created folder that groups notes and decks; a note/deck with a null `file_id` is just uncategorised, not an error)
- `cards`: id, deck_id, front, back, next_review_at, interval_days
- `reviews`: id, card_id, user_id, result, reviewed_at
- `study_sessions`: id, user_id, minutes, date (feeds streaks and leaderboards)
- `friendships`: user_id, friend_id, status
- `rooms`: id, code, owner_id, timer_state, classroom_size_enabled
- `leaderboard_badges`: id, user_id, metric (`minutes` / `cards`), rank, tier (`top100`/`top50`/`top25`/`top10`/`first`), month (e.g. `2026-09`), created_at

## Free vs Pro vs Classroom Pro (build the gating hooks now, wire up payments later)
No AI features on any plan. All paid perks are social features, customisation, and group tools, not AI.

**Pricing (subject to change once you've validated demand):**
- Free: £0
- Pro: £4.99/month or £39/year — for individual students
- Classroom Pro: £14.99/month or £120/year — one person (a class rep, tutor, or friend-group organiser) pays; they can toggle individual rooms up to a 30-person size

**Feature breakdown:**
| Feature | Free | Pro | Classroom Pro |
|---|---|---|---|
| Decks | Up to 5 | Unlimited | Unlimited |
| Files (filing system) | Up to 3 | Unlimited | Unlimited |
| Items per file (notes + decks combined) | Up to 10 | Unlimited | Unlimited |
| Friends list | Small cap | Larger cap | Larger cap |
| Room size (default) | Up to 4 | Up to 10 | Up to 10 (see toggle below) |
| Per-room size toggle | No | No | Yes — owner can flip any one of their rooms up to 30 people, so not every room has to be classroom-sized |
| Room-wide leaderboard | Yes | Yes | Yes |
| Friends leaderboard | Yes | Yes | Yes |
| Global leaderboard (all users, platform-wide) | No — locked, "Coming soon" | Yes | Yes |
| Rank badges (top 100/50/25/10/#1, permanent, earned monthly, per metric) | No | Yes | Yes |
| Subscriber tick next to name | No | Yes, fixed orange | Yes, recolourable |
| Themes | Default | ASCII animated themes | ASCII animated themes |
| Streak freezes | No | Yes | Yes |
| Study heatmap | Current month + streak number only | Full year view + per-deck breakdown | Full year view + per-deck breakdown |
| Exports | No | Yes | Yes |
| Profile photo (preset avatars only, no uploads) | Small default set | Expanded avatar set | Expanded avatar set |
| ASCII pet companion | No | Cat or dog (animated) | Wider selection (e.g. cat, dog, monkey, fish, and more) |
| Room analytics (attendance, activity) | No | No | Yes |
| Assign a deck to the whole room | No | No | Yes |

**Global (platform-wide) leaderboard and badges (Pro and Classroom Pro only):**
- Separate from the friends and room-wide leaderboards above: this ranks every user on the platform, not just friends or a room.
- Ranked by weekly or all-time study minutes/cards reviewed (decide which when building), visible only to Pro and Classroom Pro users.
- Reaching top 100, top 50, top 25, top 10, or #1 in the world unlocks a badge shown on the user's profile. Badges are earned by rank among eligible (Pro+) users, and are separate from the subscriber tick.
- Free users see this specific view locked with a "Coming soon" label and an upgrade prompt. Friends and room-wide leaderboards remain open to everyone.

**Subscriber tick badge:**
- A small tick icon next to a user's display name anywhere their name appears (leaderboards, friends list, study rooms).
- Pro: fixed orange tick. Classroom Pro: same tick, but the user can pick its colour in settings.

**Room size toggle (Classroom Pro only):**
- Each room a Classroom Pro user owns has a toggle: "Classroom size (up to 30)" on or off. Off keeps the room at the normal Pro size (10). This lets one Classroom Pro user run both a small friend-group room and a large class room without upgrading everyone or creating multiple accounts.

- Add a `plan` field on `profiles` (`free` / `pro` / `classroom_pro`) and check it in one central place so limits are easy to change — this same check should gate deck count, file count, and items-per-file.
- Add a `classroom_size_enabled` boolean on `rooms`, only settable by the owner if their plan is `classroom_pro`.
- Show upsell boxes in the UI (e.g. dashboard and settings) for both Pro and Classroom Pro, listing their perks from the table above, but with the "Upgrade" button showing "Coming soon" instead of a working checkout, since Stripe isn't built yet.

## Leaderboard details
All three leaderboards (friends, room-wide, global) use the same two ranking metrics and let the user toggle between them — they are not combined into one score:
- **By minutes studied** (from `study_sessions`)
- **By cards reviewed** (from `reviews`)

**Friends leaderboard:** scope is the user's friends list; resets weekly. Shows rank, display name, subscriber tick (if any), current streak, and the metric value for whichever toggle is selected.

**Room-wide leaderboard:** scope is whoever is (or has been) in that specific room; resets per session (today's activity in that room). Shows rank, display name, tick, and the room-specific metric value.

**Global leaderboard (Pro/Classroom Pro only):** scope is every eligible user platform-wide. There are two separate boards per metric: a **monthly board** (resets at the start of each calendar month) and an **all-time board** (never resets). Both are viewable, but only the monthly board grants badges. Shows rank, display name, tick, badge(s), and the metric value.

**Monthly badges (permanent, collectible):**
- At the end of each month, whoever finished in the top 100, top 50, top 25, top 10, or #1 for that month (per metric) permanently earns a badge recording that result — it is not overwritten by future months, so a user can collect multiple badges over time (a "trophy case" on their profile).
- Badge label format: rank + month earned, e.g. **"#1, Sep26"** or **"#57, Sep26"**.
- Badges are earned separately per metric (minutes vs cards), so a user could hold "#1 minutes, Sep26" and "#57 cards, Sep26" independently.
- Tier styling (ASCII-themed, ties into the ASCII theme system):
  - Top 100 — grey/bronze ASCII border
  - Top 50 — silver ASCII border
  - Top 25 — gold ASCII border
  - Top 10 — platinum/cyan ASCII border with a slight glow
  - #1 — animated rainbow-cycling ASCII border (the standout badge)
- Badges stay visible on a user's profile permanently, even if they later downgrade from Pro — they were earned; downgrading just stops new badges and hides the live global leaderboard.

**Separate from the above — streak-milestone and "First 100" badges (already built, not originally in this spec):**
- Streak-milestone badges at 10/25/50/100/250/500/1000+ days, awarded automatically from `longest_streak`.
- The "First 100" badge is stored as a permanent flag at signup, so deleting a profile does not shift the award. The project owner chose to keep the badge system.
- A developer badge tied to an `is_developer` flag on `profiles`, currently the only way Pro/Classroom Pro badges show as available (in approved developer builds) — normal MVP accounts see Pro/Classroom Pro badges as locked in the profile menu, not forced next to usernames elsewhere in the app.

## Profile customisation (post-MVP — good to build once the core loop is validated, not needed for launch)
No photo uploads on any plan — this avoids moderation issues since many users will be under 18. Instead, all profile images are preset avatars chosen from a built-in library, with more choices unlocked at higher tiers.

**Avatars:**
- Free: a small default set of preset avatars.
- Pro and Classroom Pro: an expanded avatar set (more style/colour options), still preset — no custom uploads at any tier.

**ASCII pet companion:**
- Free: none.
- Pro: choose one animated ASCII pet — a cat or a dog — shown on the profile/dashboard.
- Classroom Pro: a wider selection of animated ASCII pets (e.g. cat, dog, monkey, fish, and others to be designed).
- Pets are cosmetic only — no gameplay effect, just personalisation and another reason to upgrade.

## Developer/team perks (post-MVP, optional — not committed, just keep the door open)
An idea to revisit once there's a team: a way to mark certain accounts (you, and any future developers) with a `role` field on `profiles` (e.g. `dev`), which would:
- Show a distinct developer/team badge next to their name — visually separate from the earned rank badges and the subscriber tick, so it reads as "built this" rather than "earned this."
- Grant them Classroom Pro (or whatever the top tier is) for free, bypassing the plan/billing check rather than actually subscribing through Stripe.
- This only needs one extra field and a check like "if role is dev, treat plan as classroom_pro" — cheap to add whenever it's actually needed, so no rush to build it now.

## Safety (many users will be under 18)
- No direct messages and no free-text chat in the MVP.
- Display names only, no real names or photos required. Friends only via friend code.
- Report and block buttons on profiles and shared decks.
- Age confirmation at sign-up, plus a privacy policy and terms page (get these checked for your region before launch).

## Out of scope for the MVP
AI features of any kind (on any plan), mindmaps, payments, native mobile apps, tutor/teacher dashboards, a marketplace, notifications, profile customisation (tiered avatars, ASCII pets), developer/team badges or free access, and an interactive/animated fire logo.

## Definition of done
- A new user can sign up, create a deck, review cards, and see their streak update.
- Two users can be friends, see each other on a friends leaderboard, and join the same study room with a synced timer and room leaderboard. The global platform-wide leaderboard shows a locked "Coming soon" state.
- Data is protected with RLS, the app is responsive on mobile, and it is deployed on a live URL.

## Instructions for whichever AI coding tool is building this
Build one feature at a time in the order above. After each feature, run the app, fix errors, and summarise what works before moving on. Keep the code simple and commented, and keep secrets in environment variables.

### Ask me when you need something
I'm a beginner and will handle accounts and credentials myself. Whenever you need a link, key, account, setting or decision from me, stop and ask instead of guessing, skipping it, or using placeholder values.
- Tell me exactly what you need, why you need it, and where to find it (for example, "Supabase dashboard > Project Settings > API > Project URL"), with simple step-by-step directions.
- Ask for one thing at a time, then wait for my reply before continuing.
- Examples of things you may need: the Supabase project URL and keys, the GitHub repo link, Netlify environment variables, and my domain name. (Stripe keys and price IDs are not needed yet — payments are out of scope for the MVP, see below — but keep the code structured so Stripe can be added later without a rebuild.)
- Put every secret in `.env.local` (and tell me to add the same variables in Netlify). Make sure `.env.local` is in `.gitignore` so it is never committed to GitHub. Never hardcode a key in the code.
- Tell me which keys are public and which must stay private. Never expose a secret key (Supabase service-role key, Stripe secret key) to the browser.
- If you're unsure about a choice (for example a name, a limit, or how a feature should behave), ask me rather than deciding silently.
- **Privacy — public email:** use `vioscribe.support@gmail.com` for the Privacy Policy, Terms, footer, and support contact as requested by the project owner. For other public GitHub metadata that needs an email address, use `332547611+Turbulentmonk@users.noreply.github.com` rather than a personal email.
