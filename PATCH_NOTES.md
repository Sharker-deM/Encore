# ENCORE 1.6.1 — Ticketek timeout and diagnostics

Ticketek parser searches are allowed up to 25 seconds instead of 8.5 seconds. The Ticketek Vercel function is configured with a 40-second execution limit. Errors now distinguish timeouts, network failures, non-JSON provider responses, and rejected credentials. This does not alter your concert data, keys, or app styling.

## Apply
Upload **all 15 original files plus this PATCH_NOTES file** into the root of your existing GitHub `Encore` repository, preserving the `api` folder and replacing matching files. Commit on `main`. Wait for Vercel's production deployment to complete.

You can also update just `api/_shared.mjs`, `api/ticketek.mjs`, and `api/health.mjs` if you are comfortable editing files through GitHub. This is a backend-only update; there is no need to delete/reinstall the iPhone home-screen app or clear browser data.

Test: https://encore-api-ochre.vercel.app/api/health (version should say 1.6.1), then https://encore-api-ochre.vercel.app/api/ticketek?mode=search&query=Coldplay. Do not share private API keys.

If it still errors, note the HTTP status and returned error; Vercel logs for /api/ticketek can reveal whether the function ended early or reached the provider. Parse.bot also lets you test `search_events` directly in its web marketplace Playground to isolate a provider-side issue.
