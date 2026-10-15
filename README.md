# ENCORE v1.6 — Connected Concerts (GitHub Pages + Vercel)

ENCORE v1.6 keeps the v1.5 interface and all local concert data. It adds a small Vercel backend for information retrieval. **No database, automatic push notifications or closed-app monitoring is included.**

## What's new
- Back-end API key storage (Vercel environment variables) for Ticketmaster, Parse.bot Ticketek, setlist.fm and optional Spotify.
- Ticketmaster suggestions while typing; the Search button additionally searches Ticketek (one parser credit per request), so credits are not spent for each keystroke. Ticketek search yields summary listings; selecting one calls `get_event` to obtain an actual date/venue and image, when available.
- Paste an official Ticketek event link and import the extracted details.
- Show Info → Browse recent setlists. Fan-reported setlists are explicitly attributed to setlist.fm; each track has a Spotify search link (which doesn't require Spotify API access). Optional server-side Spotify lookup endpoint included for a future precise-link integration.
- ENCORE Settings → Vercel backend URL and Test connection; backend `/api/health` shows connected API sources without revealing keys.

## Install carefully
1. In existing ENCORE on the SAME device, go to Settings → Export backup; download its JSON.
2. In the existing `Sharker-deM/Encore` GitHub repo upload **all files from this directory** to the repository root, including the complete `api` folder (not inside another `encore-v16` folder). Don't upload `.env` files or real keys. GitHub Pages continues to serve the `index.html` / `app.js` / `styles.css` files.
3. Create a Vercel account with GitHub and import the **same** repository as a Vercel project. Use the root (`./`) as root directory, Framework Preset `Other`, and no build command. Both GitHub Pages and Vercel deploy automatically from the same repository; keep your iPhone shortcut pointed at the familiar GitHub Pages URL.
4. On Vercel: Project → Settings → Environment Variables. Add **TICKETMASTER_API_KEY**, **PARSE_API_KEY**, **SETLISTFM_API_KEY**, and optionally **SPOTIFY_CLIENT_ID** and **SPOTIFY_CLIENT_SECRET**. Select Production (and Preview if you test previews). Redeploy your project after adding or changing environment variables.
5. Open `https://YOUR-VERCEL-SUBDOMAIN.vercel.app/api/health`; confirm JSON with `"ok":true`. For each configured provider, its flag should be true.
6. Open `https://sharker-dem.github.io/Encore/` and Settings → ENCORE Vercel backend; paste ONLY your Vercel domain (no `/api/health`), save and use Test connection. Now try a concert search by artist and city, Ticketek import, and Show info → Browse recent setlists.
7. The Settings footer should say `ENCORE v1.6`. On iPhone close/reopen the home-screen app if an old service worker is still loaded; refresh the Safari URL if necessary.

## Secrets and safety
**Never commit actual API keys, Spotify client secrets, `.env` files, or personal tokens into GitHub.** Store server-side in Vercel Environment Variables. Vercel backend public endpoints still use your keys on the server and consume provider quotas when anyone calls them. This is suitable as an experimental personal project, **not a publicly scaled API**. Add authentication, request throttling, caching, quota limits and monitoring before distributing publicly. Front-end data (concerts, budgets, photos) still lives in browser localStorage (`encore-v1`), **not on Vercel**. Existing local data remains on the same website/browser when updating code.

## Provider specifics
- Ticketmaster discovery API returns event metadata and images. Dates/times/seating types still require ticket verification.
- Ticketek Parse.bot **independent** API (not affiliated with Ticketek) currently publishes `search_events` (one credit) and `get_event` (three credits). It is Australia-only. City is a free-text part of the search query rather than a strict region filter, so review results. Linked Ticketek show data can change, but *automatic Ticketek changes monitoring is not yet enabled*.
- QPAC/QTIX is not directly integrated yet. Use manual entry and link the official event page; don't assume seated tickets based on venue alone.
- setlist.fm results are community-reported prior performances; not verified future setlists. Exact show times should come from official concert/venue/promoter listings.
- Spotify button opens a track search in Spotify (no account connection needed). `/api/spotify-track` supports optional Web API-based exact track searches using client credentials for future work, subject to Spotify's current API restrictions. No in-app streaming/chorus playback.
- Vercel backend is **on-demand**; it cannot notify you when the app is closed until a database, scheduled job and web push are added. The only auto-check while open remains Ticketmaster.

## Quick backend tests
- `/api/health`: JSON status and configured services, without secrets.
- `/api/ticketmaster?artist=Leon%20Bridges&city=Brisbane`: API event search; requires Ticketmaster key.
- `/api/ticketek?mode=search&query=Leon%20Bridges`: Ticketek artist search; requires Parse key.
- `/api/ticketek?mode=event&url=<encoded official Ticketek show URL>`: exact performance import.
- `/api/setlists?artist=Leon%20Bridges`: community-reported setlists.

All server-side routes are read-only. The Ticketek endpoint only accepts official Ticketek URLs; URLs are sent to Parse.bot, never downloaded arbitrarily by Vercel. Browser calls are cross-origin permitted only for `https://sharker-dem.github.io`.
