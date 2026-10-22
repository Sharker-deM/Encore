# ENCORE v1.9 — Secure Accounts & ENCORE Together (beta source)

**START HERE: `START_HERE_V19.md`.**

This is a **development candidate, not a deployed production release**. It builds on ENCORE v1.8.1 while adding Supabase Auth accounts, independent cloud state, private profile photos, opt-in username discovery, friend requests/accept/remove/block, account-bound push notifications, server-side auth checks and provider rate limiting.

**IMPORTANT:** Existing personal v1.8 uses a single `ENCORE_SYNC_TOKEN` and single `encore_state` row. Never share that token or reuse that architecture for your friends. The v1.9 SQL adds NEW tables without dropping any old ones, and new legacy routes are disabled unless explicitly switched on for a controlled migration.

**Status:** JavaScript syntax and included Node tests run locally. No real Supabase SQL migration, cross-account penetration test, email delivery, photo storage or iPhone Web Push verification has happened yet. This is not security-audited; complete the checklist before inviting friends.

**New files:** `SUPABASE_V19_SECURITY.sql`, `account-config.js`, `account.js`, `api/v2/*`, `api/_multi-user.mjs`, `api/_push-v2.mjs`, `api/_monitor-v2.mjs`, and `SECURITY_RESEARCH.md`.

**Run tests on Windows:** install Node.js LTS; in extracted folder run `npm.cmd install` and `npm.cmd test`. Static tests do not replace live RLS integration testing. `web-push` is a backend npm dependency; on Vercel it is installed during deployment.

**Deliberately deferred:** concert-specific group sharing, automatic conflict merges, scalable batch pagination past 15 users, native widgets, and polished account deletion/self-service data portability. These need separate security and UX validation.
