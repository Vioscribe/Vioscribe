# Vioscribe

Vioscribe is a study app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## What Vioscribe includes

- Email/password and Google sign-in, user profiles, and friend codes.
- Decks and editable flashcards, with a review flow that brings missed cards back sooner.
- Notes with a rich-text editor and autosave.
- Daily review goals, streak tracking, and a study-activity heatmap.
- A Filing Room for organizing decks and notes, with plan-based limits.
- Friends, shareable decks, study rooms with live presence, and study leaderboards.
- Pixel-art campfire branding, Sparky, badges, and a custom 404 page.

The repository also includes draft Privacy and Terms pages. Their presence does not mean the service has completed legal or child-safety review.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create `.env.local` with the Supabase project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep `.env.local` private; it is ignored by Git.

## Database setup

This project uses Supabase for its database, auth, and Realtime features.

1. Create a Supabase project.
2. For a fresh install, run `supabase/schema.sql` against your project.
3. For an existing project, apply everything in `supabase/migrations/` in filename (timestamp) order — they're not auto-run, so this must be done manually via the Supabase SQL editor or CLI.

## Project docs

See [`docs/mvp-spec.md`](docs/mvp-spec.md) for the full feature spec, data model, and current build status. `docs/track-a-infrastructure-brief.md` and `docs/track-b-features-polish-brief.md` cover the work currently in progress.
For the latest repository review and open release checks, see [`docs/current-status-and-potential-issues.md`](docs/current-status-and-potential-issues.md).

The add/create-deck button has a user-reported issue when clicked rapidly; it has not yet been reproduced. See [`docs/issues/001-add-deck-button-feedback.md`](docs/issues/001-add-deck-button-feedback.md).

## Deploy on Netlify

1. Import the GitHub repository in the Netlify dashboard.
2. Let Netlify detect the Next.js framework. The standard build command is `next build` and the publish directory is `.next`; no Vercel-specific configuration or extra adapter dependency is needed.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app` in the Netlify site settings. The public contact address is configured in `lib/contact.ts`.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://your-site.netlify.app` and add both `https://your-site.netlify.app/auth/callback` and `http://localhost:3000/auth/callback` to **Redirect URLs**.
5. In Google Cloud, keep the app domains under **Authorized JavaScript origins**, but set **Authorized redirect URIs** to the Supabase callback URL shown in the Supabase Google provider settings: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.

Netlify supports the Next.js App Router and provisions its Next.js adapter automatically. See [Netlify's Next.js guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) for current deployment details.

## Legal and privacy review

Draft Privacy and Terms copy and the pre-launch review checklist are in [`docs/legal/`](docs/legal/). They are working drafts, not a statement that Vioscribe is legally compliant. Do not publish them until the controller identity/contact, operating address, provider locations and transfer safeguards, and child-safety assessments have been confirmed.

## Release status

Code being pushed to GitHub does not confirm that Netlify has deployed it or that production Supabase settings match the repository. Check [`docs/current-status-and-potential-issues.md`](docs/current-status-and-potential-issues.md) for items requiring live verification before launch.
