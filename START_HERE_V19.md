# ENCORE v1.9 secure accounts — Windows-first setup (private beta)

**STATUS: DEVELOPMENT CANDIDATE — NOT LIVE OR PRODUCTION-SECURITY-VERIFIED.**
The code has automated unit/static checks. The SQL has **not** been run against your Supabase project, and the UI has **not** been acceptance-tested with two real users. Do **not** invite friends until all checks in section 8 succeed.

## What you get
- Email/password signup, verification, sign-in, password reset and logout through Supabase Auth.
- One private, revision-checked concert collection per account. Email, tickets, savings and concert budgets are not in public profile tables.
- Change your display name and @username; profile visibility is opt-in.
- Private profile photo (image signature checked, converted into a clean 512x512 JPEG to discard EXIF/location metadata).
- Permanent friend requests, accept, remove and block. Friends **do not** automatically see concerts; event-specific sharing comes later.
- User-bound browser push subscriptions and event alerts with a bounded per-user monitoring batch.
- Search quotas enforced on the backend via an atomic database counter when `ENCORE_MULTI_USER_ENABLED=true`.
- Old shared-token endpoints disabled by default in new deployment (`ENCORE_LEGACY_CLOUD_ENABLED` must explicitly be `true` to restore temporarily).

## Before touching the existing live app
1. Open the CURRENT ENCORE iPhone app at `https://sharker-dem.github.io/Encore/`.
2. Go to Settings > Export backup. Save the JSON file to Files/iCloud Drive and a second trusted location. Do not send it to friends; it can contain financial and ticket details.
3. In Supabase `encore-personal`, create a database backup/export as permitted by your plan. **Do not remove any of the four legacy tables.**
4. Save the existing GitHub `main` branch and Vercel `encore-api` Production deployment as your rollback point.
5. Do not disable the original PWA or overwrite `main` yet.

## 1 — Make a separate development branch
In GitHub `https://github.com/sharker-dem/Encore`, open branch selector `main` > type `secure-v19` > **Create branch: secure-v19 from main**. Upload *the contents* of this package to that branch (not an enclosing directory). Commit. Do not merge into `main`.

## 2 — Create a disposable beta Supabase project (strongly recommended)
In https://supabase.com/dashboard choose **New project**, name it `encore-beta`. This lets you test RLS without endangering the working `encore-personal` database. It will have different API keys and URL. Free-tier project limits are subject to your account and may change.

Open that beta project's **SQL Editor** > New query, paste **the entire** `SUPABASE_V19_SECURITY.sql` and click **Run**. Check the success message; if any error is shown, stop rather than partially guessing a fix. The script creates the new per-user, friends, avatar, usage and notification tables, RLS policies, invitation abuse audit, Auth trigger, and storage bucket. It is NOT a script to replace `SUPABASE_SETUP.sql`.

Look in Table Editor for `encore_profiles`, `encore_user_state`, `encore_friendships`, `encore_blocks`, `encore_user_subscriptions`, `encore_user_notification_log`, `encore_user_alerts`, `encore_api_usage`. All must have RLS enabled.

## 3 — Configure Supabase Authentication
In beta Supabase dashboard:
1. **Authentication > Providers > Email:** turn **Confirm email ON**. Do not disable it to make testing faster. Disable anonymous sign-ins unless explicitly required (they are not required here).
2. **Authentication > URL Configuration**: set Site URL to the exact HTTPS beta PWA URL after the beta Vercel project exists; add exactly that origin/path to Redirect URLs. Use `https://sharker-dem.github.io/Encore/` only when preparing the final production move. Avoid permissive wildcard redirect entries.
3. **Authentication > Attack Protection / CAPTCHA**: configure Cloudflare Turnstile (recommended before any public signups). Register the exact beta hostname with Cloudflare. Put the PUBLIC site key in `account-config.js`; put the PRIVATE Turnstile secret ONLY in Supabase Auth CAPTCHA settings, NEVER in GitHub.
4. **Authentication > Rate Limits:** review and conservatively limit sign-in, sign-up, recover and verification endpoints.
5. **Authentication > Password Security:** set a 12-character minimum. If your Supabase plan supports leaked password protection, enable it. Consider MFA for later releases.
6. **Custom SMTP:** Supabase's default mail delivery is limited and generally not suitable for sending confirmation emails to arbitrary friends. Configure a reputable SMTP sender (with SPF, DKIM, DMARC) and test signup, confirmation, reset, and delivery before launch. Keep SMTP password in Supabase settings, not frontend code.
7. Disable any unneeded auth providers.

**Supabase project URL and publishable key**: Settings > API Keys (or Connect/API Keys, depending on dashboard). Copy ONLY your project's `https://...supabase.co` Project URL and `sb_publishable_...` publishable key. For older projects, the public `anon` key can also work. Never copy `sb_secret_...` or `service_role` into browser code.

## 4 — Configure public frontend values
Open `account-config.js`, replace:
- `PASTE_SUPABASE_PROJECT_URL_HERE` with your beta Supabase Project URL;
- `PASTE_SUPABASE_PUBLISHABLE_KEY_HERE` with the beta publishable key;
- `turnstileSiteKey: ''` with the **public** Cloudflare Turnstile site key.

The backend URL is automatically the origin of a non-GitHub-Pages hosting environment, which enables a separate staging Vercel project. This file is public by design. A publishable key is NOT a password. RLS is what separates users.

## 5 — Create a separate Vercel beta project
In https://vercel.com/dashboard > Add New > Project > import `sharker-dem/Encore` again, as a SECOND project called e.g. `encore-beta`. Its Production Branch should be `secure-v19` (Settings > Git). Do NOT change your existing `encore-api` project/branch. Leave framework preset as Other and Root Directory as repository root.

Add beta project Environment Variables from the **BETA** Supabase project:
- `SUPABASE_URL`: beta project URL
- `SUPABASE_SECRET_KEY`: beta `sb_secret_...` key (server-only; alternatively `SUPABASE_SERVICE_ROLE_KEY`)
- `SUPABASE_PUBLISHABLE_KEY`: beta `sb_publishable_...` key (used by Vercel for token verification)
- `ENCORE_MULTI_USER_ENABLED`: `true`
- `ENCORE_LEGACY_CLOUD_ENABLED`: `false`
- `ENCORE_ALLOWED_ORIGINS`: exact beta Vercel URL, e.g. `https://encore-beta-xxxxx.vercel.app`
- `ENCORE_APP_URL`: exact beta app URL, e.g. `https://encore-beta-xxxxx.vercel.app/` (ensures push notifications open the beta, not your existing live personal app)
- Existing provider secrets used in the beta backend: `TICKETMASTER_API_KEY`, `PARSE_API_KEY`, `SETLISTFM_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, if you want those beta features enabled.
- To test push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (server-only private key, keep VAPID keys consistent with the frontend using that backend).
- `CRON_SECRET`: create a NEW random strong secret for the beta project. Never publish it.

Your production preview URL will appear under Project > Domains. Update `ENCORE_ALLOWED_ORIGINS` and Supabase Redirect URLs to match it exactly. **Do not commit any Vercel secret values.**

Note: because the beta frontend and beta API are served from the same Vercel host, the app automatically uses that host's `/api/*` routes. Do not configure the beta to call the old personal `encore-api` backend.

## 6 — Create accounts and migrate your concerts safely
1. Open the beta URL in a PRIVATE/incognito browser tab on Windows. You should see ENCORE sign-in, never a stranger's concert data.
2. Register **Account A** (your email), complete Turnstile, verify your email via the link, then sign in.
3. In ENCORE Settings, change the autogenerated username and display name. Toggle "Let people find my username" only if desired.
4. Import the JSON file you exported from the OLD live app (Settings > Import backup). Watch the cloud sync status until "Saved securely".
5. Sign out, then sign in again. Verify EVERY concert is present, along with budgets and savings, before doing anything to the old PWA.
6. Create **Account B** with an entirely separate email in another browser/private window. It must begin with **zero concerts**. Do not copy Account A's JSON backup into Account B.
7. From B, try to access A's backup by modifying the Supabase client REST `user_id` filter to A's ID; RLS must return nothing. A remote request with B's user token must NOT reveal A's data.
8. Change A's profile discovery to ON. From B's Friends tab, request A by @username. A accepts. They should see each other's name/photo; neither should see the other's concerts, tickets, budgets or notification subscriptions.
9. Block/unfriend, and verify private photos stop being downloadable after their 5-minute signed links expire.
10. If you can't demonstrate this isolation reliably, do not invite others.

## 7 — Push and automatic monitoring
For beta, after login use Settings > Enable notifications > Send test. Confirm it reaches ONLY that logged-in account's subscribed devices. Test another friend account separately. Confirm logout removes that device's push subscription. Event monitors run daily via Vercel Cron; v1.9's beta monitor is deliberately bounded to the FIRST **15** users and TWO provider lookups per user per day. That is for a small beta ONLY. Before a wider rollout, implement pagination/cursors and backpressure so nobody is skipped.

## 8 — Release readiness / security checklist (must be checked)
- [ ] SQL migration runs in beta without errors; all new tables show RLS enabled.
- [ ] Email confirmation, 12+ character passwords, password reset and Turnstile all work.
- [ ] Auth emails reach a second real mailbox via configured SMTP.
- [ ] Two-user isolation tested for state, budgets, friends, avatar photos, alerts and notification devices.
- [ ] Sign out clears the previous account's data from the screen (and push registration) on a shared device.
- [ ] Conflicting changes on two devices produce an explicit warning; users can export before restoring.
- [ ] GitHub does NOT contain `sb_secret_`, service_role, Cron, VAPID private, SMTP or provider secrets.
- [ ] No current-user data stored in the legacy global `encore-v1` localStorage key.
- [ ] Provider search rate limits work with an authenticated user and reject unauthenticated requests.
- [ ] Vercel account-level rate-limit/WAF settings checked to protect paid provider/API quotas.
- [ ] Privacy notice/contact and deletion process completed before inviting friends.
- [ ] Two iPhones tested with actual Web Push (one must not receive the other's reminders).
- [ ] Existing personal backup safely restored to the NEW production account before old shared token/legacy subscription shutdown.

## Production cutover — ONLY after beta passes
1. Export current live data AGAIN. Back up production Supabase.
2. Apply `SUPABASE_V19_SECURITY.sql` to the existing `encore-personal` project only after successful beta security testing.
3. Change the frontend's `account-config.js` publishable key/URL to `encore-personal`, and prepare the production Vercel environment with `SUPABASE_PUBLISHABLE_KEY`, `ENCORE_MULTI_USER_ENABLED=true`, `ENCORE_LEGACY_CLOUD_ENABLED=false`.
4. Deploy the matching backend and frontend together in a controlled maintenance window. Old v1.8 cloud endpoint is deliberately disabled by default in v1.9. The new app should require login.
5. Sign into your production account; import your old JSON; wait until its synced state is saved; sign out and restore to verify.
6. Unregister the old v1.8 Web Push subscriptions on the old device (or revoke old legacy access). Rotate/remove the now-unneeded `ENCORE_SYNC_TOKEN` and prevent any remaining v1 routes from serving personal data.
7. Keep your v1.8 backup and GitHub/Vercel rollback points until end-to-end tests pass.

**Known limitations**: JavaScript SDK and email system rely on an online connection; no fully tested offline write queue. The static PWA on GitHub Pages cannot set every HTTP security header (notably a response-level `frame-ancestors` policy) without moving hosting to a configurable server. The supplied meta CSP provides partial mitigation. SQL RLS policies, OAuth email and browser push behaviour require real environment testing; automated static tests cannot prove them secure. No feature or system is guaranteed breach-proof.

References: `SECURITY_RESEARCH.md` and `PRIVACY_NOTICE_DRAFT.md`.
