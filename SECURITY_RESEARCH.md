# ENCORE v1.9 security research and rationale

Research performed 21 October 2026. These are primary-source references and implementation notes; no security audit or formal penetration test has been performed.

## Supabase database and auth
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): enable RLS in exposed schemas, revoke overly broad grants, use `(select auth.uid())` in owner policies, test grants and rows. Implemented in SUPABASE_V19_SECURITY.sql for every table.
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): least privilege, deny by default, verify object ownership on every request. SQL policies ensure owner-only concerts; Vercel Auth endpoint independently verifies access tokens via Supabase Auth.
- [Supabase Auth client server guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client): don't use `getSession().user` as server-side proof; verify with getUser/getClaims. Our Vercel server calls `/auth/v1/user` with the actual Bearer access token, never trusts a JSON `userId` supplied by client.
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security): 12+ character policy and platform password settings; leaked password protection on paid tiers. [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): neutral auth errors and anti-enumeration.
- [Supabase email confirmations](https://supabase.com/docs/guides/auth/general-configuration): keep enabled.
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits): tune rate limits; do not depend on generic defaults for public launch.
- [Supabase CAPTCHA](https://supabase.com/features/auth-captcha-protection) and [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/): enable server-side verification and emit captcha tokens from the frontend.
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp): use trusted sender, verify SPF/DKIM/DMARC; default mail provider not intended for production emails to all friends.

## Avatars and privacy
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): extension, MIME, file signature, size validation, generated filenames, authorised storage. ENCORE checks format signature, re-encodes to JPEG, uses random UUID name, restricts size to 2MB and relies on RLS.
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control): bucket is private, path bound to user UUID and friend relation RLS for reads. Signed URLs last five minutes and are capability URLs while live.
- [Supabase Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals): photos are private, unlike public user-avatar examples. Location EXIF removed before upload.

## Additional guardrails and remaining work
- API keys remain exclusively in Vercel's server runtime; public `sb_publishable_` config is intentionally shareable. Service-role and SMTP credentials never appear in browser source.
- Authenticated provider proxy requests use per-user minute quotas enforced by an atomic SQL counter. Configure platform WAF/rate limits, budgets and upstream API quota alarms too.
- State updates use a SQL revision check to prevent a device from silently overwriting another device's saved concerts. No tested offline editing queue yet.
- Users must explicitly enable username discovery. Email stays in Supabase Auth; profile only exposes display name, @username, private avatar path, opt-in visibility.
- Legacy 1.8 shared cloud and Web Push tables remain for reversible migration. Once all data is restored, permanently disable token endpoints and old cron access. **Do not give friends the old shared token.**
- Missing before broad public release: security review of all imported concert content, distributed monitoring scheduler, formal RLS integration tests against real Supabase database, vulnerability/dependency scanning, deletion/privacy lifecycle and true HTTP security headers using a configurable host.
