# Vioscribe: Current Status and Potential Issues

**Repository review:** 2 October 2026  
**Code snapshot reviewed:** `e013f66` (before this documentation update)

This is a repository review, not a live production, security, or legal audit. Code and repository documents were inspected; the current Netlify deployment, Supabase project configuration, and support inbox were not checked during this review. Items described as open or potential need confirmation against those systems before launch.

## Recent repository changes

- The landing headline uses one text tone, retains its typewriter reveal, and adds a subtle hover glow (`e013f66`).
- The daily goal editor, Filing Room, badges, and custom 404 are recorded as implemented in the Track B brief and MVP spec.
- Vioscribe's current code is on GitHub `main`; verify the published deployment separately because a push does not confirm a production deploy.

## Potential issues and release checks

| Area | What is known | What still needs checking |
| --- | --- | --- |
| Production deployment | The last recorded Netlify check, on 29 September, said the published site was at `12b74d2` and newer commits had been skipped after deploy credits ran out. | Check the actual active deploy and current billing/deploy status in Netlify. Confirm the latest `main` build, environment variables, and production auth redirects. |
| Supabase schema and access | The owner confirmed the daily-goal range migration was applied. The repository includes schema and migrations. | Compare every migration with the production database and re-audit production RLS; the daily-goal migration confirmation does not verify the rest. |
| Authentication | Email/password and Google sign-in are implemented in the repository. | Verify signup email delivery, Google OAuth callback URLs, and sign-in flows in the deployed configuration. |
| Multi-user flows | Friend requests, sharing, study rooms, and leaderboards are implemented in code. | Complete the two-account end-to-end checks listed in `track-a-infrastructure-brief.md`, including room presence and recorded timer minutes. |
| Legal and child safety | Draft Privacy and Terms pages and a readiness checklist exist. The owner asked to keep the public address as a launch blocker and does not want a home address published. | Keep the legal pages as drafts until the controller details, suitable public address, provider/transfer facts, mailbox process, child-focused assessment, and applicable online-safety duties are verified. Do not invent these facts. |
| Account rights | The readiness checklist records that the UI has no self-service account deletion or data export flow. | Confirm and document how deletion, access, correction, export, and erasure requests are actually fulfilled, including provider backups and shared links. |
| Safety features | Report/block and age-appropriate access measures are deferred in the Track B/MVP documents. | Decide and scope them before treating Vioscribe as ready for student launch; do not silently mark the deferral as resolved. |
| Automated checks | `package.json` defines lint and build commands, but no test script is configured. | Add focused automated coverage for high-risk flows when those features are next changed; complete the existing security checklist before launch. |
| Local setup | `.env.local` is intentionally ignored and was not present in the reviewed checkout. | A local authenticated preview needs the Supabase project URL and anon key configured locally. Never commit `.env.local` or a service-role key. |

## Recommended next steps

1. Track A verifies the live deploy, Supabase migration/RLS state, auth callbacks, and two-account flows.
2. Complete the security review in `security/security-checklist.md` against both code and production configuration.
3. Resolve the documented legal and child-safety launch blockers with verified operator/provider facts and an appropriate legal review.
4. Recheck this document after those external checks; update each row with evidence and a date rather than inferring success from a GitHub commit.

## Related documents

- [`mvp-spec.md`](mvp-spec.md) — feature and release-gate source of truth.
- [`track-a-infrastructure-brief.md`](track-a-infrastructure-brief.md) — live infrastructure and release verification.
- [`track-b-features-polish-brief.md`](track-b-features-polish-brief.md) — Track B progress and scope.
- [`legal/compliance-readiness.md`](legal/compliance-readiness.md) — legal/privacy and child-safety prerequisites.
- [`security/security-checklist.md`](security/security-checklist.md) — pre-launch security review.
