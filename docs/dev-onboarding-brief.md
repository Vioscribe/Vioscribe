# Vioscribe — New Developer Onboarding Brief

Give this alongside the current `mvp-spec.md` — that file is the canonical source of truth for every feature, data table, pricing detail, and rule. This document is just orientation: what the project is, where things stand, and how work here actually gets done.

## What this is
Vioscribe is a study web app for students: notes → flashcards → spaced-repetition review → daily streaks → social study features (friends, shared decks, study rooms with leaderboards). No AI features on any plan, ever — that's a firm, non-negotiable product decision, not a placeholder.

## Repo and stack
- GitHub repo: `Vioscribe/Vioscribe`, branch `main`. Use `git status` and the current branch head for the latest code; this brief was checked against `17bd3c8` on 29 September 2026.
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.
- Supabase: Postgres, Auth (email + Google), Realtime (Presence for rooms), Row Level Security on every table.
- TipTap for the notes editor.
- Production site: [https://vioscribe.netlify.app](https://vioscribe.netlify.app), hosted on Netlify.
- Secrets live in `.env.local` (gitignored) — ask the project owner for actual values, never hardcode or guess a key.
- The repo has its own `AGENTS.md` / `CLAUDE.md` files with tool-specific working instructions — read those too before making changes.

## Where things stand right now
The core product loop is built: auth, decks/cards, review with spaced repetition, notes, streaks, friends + friends leaderboard, shareable deck links, study rooms with a personal (not synced) timer whose minutes feed both room and friends leaderboards, a current-month heatmap, and full ember/campfire branding with a pixel-art mascot. A global platform-wide leaderboard exists only as a locked "Coming soon" placeholder — real ranking logic is a future paid-tier feature, not built yet.

This is **not launch-ready yet**. Check `mvp-spec.md` for current release gates. The live Netlify site is still on commit `12b74d2`: Netlify skipped the newer `main` commits because the team exhausted its production deploy credits for the current billing period (25 September–24 October 2026). The next period starts 25 October 2026. Do not assume a successful GitHub push means the production site was updated.

A badge system (streak milestones, a permanently recorded "First 100" badge, a developer badge, and locked Pro/Classroom Pro placeholders) is implemented and its scope was approved: keep it.

A **filing system** (user-created "files" that group notes and decks, browsed via a pixel-art "Filing Room" tab, with tiered file/item limits) is now built — `files` table with RLS, `file_id` on `notes`/`decks`, the Filing Room UI, and the tier limits are all in place.

## How work actually happens here
- Small, scoped briefs get handed to whichever AI coding tool (Cursor, Codex, Claude Code) has usage available at the time — this isn't one tool owning the whole project end to end.
- Every tool is expected to stop and ask before making a structural or product decision, rather than guessing or picking a default silently — see `mvp-spec.md`'s "Ask me when you need something" section for the exact norms (one thing at a time, tell me why, tell me where to find it).
- Commits should be small and incremental, not one giant batch at the end.
- Before building anything, check the actual codebase and Supabase project state rather than trusting a status report at face value — reports here have occasionally been ahead of (or behind) what's truly live.

## Non-negotiable constraints (don't relitigate these without the project owner)
- No AI features on any plan, ever.
- No payments/Stripe until explicitly scoped (gating hooks only for now).
- No photo uploads anywhere — preset avatars only, since the user base includes under-18s.
- Site-wide clean monospace/terminal typeface and warm ember/campfire branding — not a gimmicky "hacker" theme.
- Use `vioscribe.support@gmail.com` as the approved public support contact. Do not publish other personal contact details without the project owner’s approval.

## Getting started
1. Read `mvp-spec.md` in full, then this document.
2. Pull `main`, get the local environment running with your own `.env.local` (ask the project owner for the Supabase keys and any other secrets you need).
3. Check in with the project owner about which open work stream you're picking up before starting, so you don't collide with work already in flight (currently split into two tracks: Track A is infrastructure/release-readiness, Track B is remaining features/polish — the filing system, Track B's first item, is already done).
