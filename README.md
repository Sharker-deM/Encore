# ENCORE v1.8 — Background monitoring & Web Push

ENCORE is a personal concert-tracking PWA. v1.8 preserves the established v1.5-v1.7 interface while adding:

- Optional private Supabase cloud backup via a long personal access token.
- Daily Vercel cron monitoring of saved Ticketmaster, Ticketek and supported official event-link concerts.
- Browser Web Push using VAPID (supported on iOS 16.4+ when installed as a Home Screen app).
- Once/daily/weekly/off countdown reminders, opt-in savings reminders and event change alerts.
- Provider changes are recorded for review — not silently applied to local concert records.

**START HERE:** `SETUP_GUIDE.md` has beginner instructions for Supabase, keys, GitHub, Vercel and iPhone.

**SECURITY:** Do not commit your Vercel environment variables, `ENCORE_SYNC_TOKEN`, `VAPID_PRIVATE_KEY`, or `SUPABASE_SECRET_KEY`. `SUPABASE_SETUP.sql` is safe to commit. The new Supabase secret keys begin with `sb_secret_` and should only be used by Vercel.

**LIMITS:** Vercel Hobby cron = daily; roughly one-hour execution window. No precise per-concert time scheduling. Device data is local-first with a last-write-wins cloud copy; the app is single-person and does not yet have user-account sign-in. This isn't intended as a public multi-user SaaS.

**Tests:** `npm.cmd install`, then `npm.cmd test` on Windows. Current test suite uses Node's built-in test runner. No personal credentials required for those tests.
