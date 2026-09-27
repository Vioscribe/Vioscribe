# Vioscribe — Pre-Launch Security Checklist

This is its own file (belongs in `docs/security/`) rather than part of either track's brief, since it's a distinct, self-contained pass rather than ordinary feature work. Go through every item below before calling launch done. Several overlap with work already done in `track-a-infrastructure-brief.md` (noted); the rest are new. Skip anything marked N/A, don't skip anything else.

## Checklist
   This is a consolidated list — go through every item below before calling launch done. Several overlap with steps 1–5 above (noted); the rest are new. Skip anything marked N/A, don't skip anything else.
   - **API keys hidden:** confirm `.env.local` is still gitignored, no key is hardcoded anywhere in the codebase, and Netlify's environment variables aren't printed in build logs.
   - **Git secrets purged:** do a final scan of the full commit history for anything sensitive (`git log -p | grep -i "supabase\|service_role\|secret\|password"`) — this should already be clean from when the repo went public, but confirm again now that more has been pushed since.
   - **Only the public/anon Supabase key ships to the browser:** grep the production build output for the service role key string to confirm it never appears client-side.
   - **RLS enabled everywhere:** covered by step 3 above.
   - **Sensitive data encrypted:** Supabase encrypts data at rest by default and handles password hashing itself — confirm no sensitive field (passwords, tokens) is ever stored outside Supabase Auth's own handling.
   - **Server-side enforcement, not just client-side:** confirm every plan-based limit (file count, items-per-file, deck count) is enforced in the database/API layer, not only hidden in the UI — a user editing requests directly shouldn't be able to bypass a limit the interface just hides.
   - **Record access locked down:** covered by step 3 above (RLS ownership checks).
   - **Field-level tampering blocked (new):** RLS controls *which rows* a user can touch, not *which columns* — confirm a user cannot set their own `is_developer`, `plan`, or badge fields directly through a normal table update. If nothing currently stops this, add column-level protection (revoke direct update grants on those specific columns, or move them to a table only the service role can write to).
   - **Session cookies secure:** confirm auth uses secure, httpOnly, sameSite cookies via Supabase's official Next.js SSR helpers, not tokens sitting in `localStorage`.
   - **Password hashing:** already handled entirely by Supabase Auth — no action needed.
   - **Login rate limiting:** confirm Supabase Auth's built-in rate limits are active; flag if they seem insufficient.
   - **Bot protection (new):** add a CAPTCHA (Cloudflare Turnstile has a free tier) on the signup form at minimum — check with me before adding it anywhere else, in case it affects UX somewhere unexpected.
   - **Parameterized queries:** confirm every database call goes through Supabase's query builder or RPC parameters — never raw string-concatenated SQL — especially in the friend-code and room-code lookup functions.
   - **Input validation:** covered by step 3 above, plus Track B's client-side forms — confirm it also covers room codes and friend codes, not just notes/decks.
   - **User content escaped/sanitized (new, coordinate with Track B):** TipTap's notes editor can produce arbitrary HTML — confirm it's sanitized (e.g. via DOMPurify or TipTap's own sanitization config) before being rendered anywhere, to prevent stored XSS. Check with Track B before changing anything in the notes editor itself, since that's their file.
   - **Uploads restricted:** N/A — Vioscribe has no upload feature by design (preset avatars only). Just confirm no upload endpoint accidentally exists.
   - **API responses trimmed (new):** audit queries that return other users' data (leaderboards, friends list, room presence) to confirm they only select the columns actually needed — not full rows that might include emails or other private fields.
   - **Security headers (new):** add standard headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security) via Netlify's `_headers` file or `next.config.js`.
   - **HTTPS forced:** Netlify does this automatically once the custom domain is attached — just confirm the http→https redirect is actually active once the domain's live.
   - **Dependencies scanned (new):** run `npm audit` and enable GitHub Dependabot alerts on the repo so known-vulnerable packages get flagged automatically going forward.

