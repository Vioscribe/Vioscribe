# Vioscribe

Vioscribe is a study app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

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
NEXT_PUBLIC_CONTACT_EMAIL=your-public-contact-email
```

Keep `.env.local` private; it is ignored by Git.

## Database setup

This project uses Supabase for its database, auth, and Realtime features.

1. Create a Supabase project.
2. For a fresh install, run `supabase/schema.sql` against your project.
3. For an existing project, apply everything in `supabase/migrations/` in filename (timestamp) order — they're not auto-run, so this must be done manually via the Supabase SQL editor or CLI.

## Project docs

See [`docs/mvp-spec.md`](docs/mvp-spec.md) for the full feature spec, data model, and current build status. `docs/track-a-infrastructure-brief.md` and `docs/track-b-features-polish-brief.md` cover the work currently in progress.

## Deploy on Netlify

1. Import the GitHub repository in the Netlify dashboard.
2. Let Netlify detect the Next.js framework. The standard build command is `next build` and the publish directory is `.next`; no Vercel-specific configuration or extra adapter dependency is needed.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (if configured) `NEXT_PUBLIC_CONTACT_EMAIL` environment variables in the Netlify site settings.
4. After Netlify assigns the site URL, add `https://your-site.netlify.app/auth/callback` to the Supabase Auth redirect URL allowlist and set the production site URL in Supabase Auth. If Google sign-in is enabled, keep the Google OAuth redirect URI set to the Supabase callback URL shown in the Supabase provider settings.

Netlify supports the Next.js App Router and provisions its Next.js adapter automatically. See [Netlify's Next.js guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) for current deployment details.

## Legal and privacy review

Draft Privacy and Terms copy and the pre-launch review checklist are in [`docs/legal/`](docs/legal/). They are working drafts, not a statement that Vioscribe is legally compliant. Do not publish them until the controller identity/contact, operating address, provider locations and transfer safeguards, and child-safety assessments have been confirmed.
