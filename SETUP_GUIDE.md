# ENCORE v1.7 — Step-by-step GitHub + Vercel update

This guide assumes you already have:
- GitHub repo `https://github.com/sharker-dem/Encore`
- GitHub Pages PWA `https://sharker-dem.github.io/Encore/`
- Vercel backend `https://encore-api-ochre.vercel.app`
- Ticketmaster / Parse.bot / setlist.fm (and optionally Spotify) credentials already stored in Vercel.

## 1 — Back up data FIRST

On each device that holds ENCORE concerts, open your existing ENCORE web app, go to **Settings → Export backup** and save the generated JSON file. It is especially important on iPhone because your phone and desktop may contain different local data. Do not delete the home-screen app or clear Safari website data.

## 2 — Upload the update to the existing GitHub repository

1. Extract `ENCORE-v1.7-official-event-links.zip` on your computer.
2. Open the `encore-v17` folder. Inside are `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icon.png`, `icon.svg`, the **api** folder, and markdown documentation.
3. Open `https://github.com/sharker-dem/Encore`, select the main branch (`main`), then choose **Add file → Upload files**.
4. Drag the **contents** of the extracted `encore-v17` directory onto the upload area. Keep the `api` folder structure intact, so its files are under `/api/*.mjs` and not under `/encore-v17/api/` or `/api/api/`.
5. Confirm GitHub is showing updates to `app.js`, `index.html`, `sw.js`, `/api/ticketmaster.mjs`, and the new `/api/import-event.mjs` and `/api/_event-import-parser.mjs` files.
6. Enter the commit message `ENCORE v1.7: official event links and better searches`, then commit directly to `main`.
7. Wait for GitHub **Actions → pages build and deployment** to finish. Your published PWA URL stays unchanged.

Important: the v1.7 package contains the latest repaired Ticketek API file; don't overwrite it with the older v1.6 file.

## 3 — Check Vercel

1. Sign in to Vercel and open your existing `encore-api` project (DO NOT create a second project).
2. Open **Deployments** and wait for the newest Production deployment created by your GitHub commit to show **Ready**. If it did not deploy automatically, check that the project is connected to the repository and `main` branch before trying redeploy.
3. Go to `https://encore-api-ochre.vercel.app/api/health`. It should say `"ok":true`, `"version":"1.7"`, and `"officialLinks":true` under providers.
4. **No new Environment Variables needed.** Keep your existing keys unchanged, including `PARSE_API_KEY`. The repaired scraper ID is already in the bundled backend. If you set `PARSE_TICKETEK_SCRAPER_ID` in Vercel, ensure it is `c6104e15-19a4-485c-8572-d57e7b1a187f`.

## 4 — Refresh ENCORE on Windows and iPhone

1. Open `https://sharker-dem.github.io/Encore/` in a desktop browser. Press Ctrl + Shift + R.
2. Go to Settings and confirm the footer says **ENCORE v1.7**. If not, verify GitHub Actions has completed and refresh again.
3. On iPhone, close ENCORE completely and reopen it; if the previous version is still cached, load the website in Safari and refresh there, then close/reopen your Home Screen ENCORE. Do not uninstall or clear website data until you've exported your records.
4. Your previous Vercel backend URL should still be saved in Settings. Select **Test connection** if necessary.

## 5 — Test Harry Styles (official Ticketmaster event)

**Option A — Search:** Add concert → Artist `Harry Styles` → City `Melbourne` → press Search Ticketmaster + Ticketek. The 27 Nov 2026 show at Marvel Stadium in Docklands should be prioritised **if Ticketmaster's Discovery API returns the show**. The API is not guaranteed to expose every publicly listed event.

**Option B — Exact link:** Add concert → Paste official event link:
`https://www.ticketmaster.com.au/harry-styles-together-together-docklands-27-11-2026/event/25006436CFC6E40D`
Then select **Import official event link**. Review date, venue and time and select Save concert. If an exact ID lookup fails on the API despite the public event listing existing, use manual entry and keep the link.

## 6 — Test Leon Bridges at QPAC/QTIX

Add concert → Paste official event link:
`https://www.qpac.com.au/whats-on/2027/on-the-banks-leon-bridges`
Then tap **Import official event link**. The importer will attempt to read the official page (and the corresponding QTIX page if QPAC blocks it). Review the date **28 February 2027**, venue **Cultural Forecourt, South Bank**, Standing GA and **gates 6pm**. The artist performance time is still TBA: don't treat gates-open as the artist's start time. Select Save concert. The experience is a best-effort page parser, not a guarantee; if blocked, select **Add this event manually instead**. The official URL will remain attached to the draft.

## 7 — Test other providers

Try an official event URL from QPAC, QTIX, Oztix, Moshtix, Eventbrite, Frontier Touring, Live Nation or On the Banks. Every imported field is editable. You should always review the date and venue. Different website formats may produce partial results. Ticketek links are routed to your repaired Parse.bot scraper, and Ticketmaster event links are routed to the official Discovery API.

## Troubleshooting

- **Vercel health still shows 1.6.1:** Backend deployment hasn't updated; review Vercel Deployments.
- **ENCORE Settings still shows 1.6:** GitHub Pages or the service worker is cached. Check GitHub Actions; refresh Safari/browser. Back up data before any storage reset.
- **Search doesn't find an event:** Use the exact official Ticketmaster URL or the provider's official link. Discovery API search results may not match website listings.
- **Importer says blocked/unavailable:** The provider's website may prohibit automated access, redirect or depend on JavaScript. The manual fallback preserves the original source link. Do not assume the site has no event.
- **Partial data:** Fill missing artist/date manually. Start time is optional. Verify venue and ticket type.
- **Parser key errors:** Existing Parse.bot `PARSE_API_KEY` should remain in Vercel, and the repaired scraper ID should not be replaced with the older marketplace ID.
- **Old saved concerts missing on phone:** ENCORE localStorage is per device and app/browser context. Do not clear data; import your previously exported backup if necessary.
