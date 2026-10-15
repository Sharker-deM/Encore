# ENCORE v1.7 — Official Event Links + Better Melbourne Search

This preserves ENCORE v1.5's interface and local concert storage, building on the working v1.6.1 backend and the repaired Ticketek scraper.

## What's new
- A single **Import official event link** field under **Add concert** supports exact Ticketmaster event URLs, Ticketek events, and best-effort public event pages from QPAC/QTIX, Oztix, Moshtix, Eventbrite, Frontier Touring, Live Nation and On the Banks.
- The importer fetches recognised sites on Vercel using a strict HTTPS host allowlist and no redirects. It extracts public schema.org Event metadata, event-page metadata and limited visible text. Unsupported, blocked and incomplete pages offer a manual entry fallback with the original link retained. **It is not a guaranteed universal scraper.**
- QPAC/QTIX best-effort parsing recognises date, gates-open time, images, an explicitly stated standing GA designation, and venue. Gates-open time is kept **separate from show start time**. If a QPAC page blocks access, the backend tries its corresponding official QTIX/QPAC listing.
- Ticketmaster searches now use Australia filtering and retry more broadly when exact city returns too few results. Venue suburbs including **Docklands** are prioritised for a **Melbourne** search. Exact Ticketmaster event-link import is a reliable alternative if search misses an event.
- Ticketek search cards now use available promotional images and show dates, while excluding waitlist-only listings that lack scheduled dates. The repaired Ticketek scraper ID `c6104e15-19a4-485c-8572-d57e7b1a187f` remains connected.
- Fixed metadata persistence: doors-open time, support acts, provider and source are retained after saving a concert imported from an official page.

## Important boundaries
- The importer **does not confirm that all ticket types, venue maps, or set times are complete**. Verify the event information using the official event page and your ticket before saving.
- A page may block bots, change its layout, lack machine-readable dates, or show several performances; the import can return partial results or fail. The manual-entry fallback is intentional.
- QPAC/other provider **background monitoring is not yet active**. Only existing Ticketmaster checks run when ENCORE is open.
- Concerts, savings and expenses still live in the browser's localStorage. Export a JSON backup before deployment. Hosting and Vercel do not sync user records.
- No extra API keys are needed. **Never place any API key or `.env` file in GitHub.**
- Vercel API endpoints are public and use your provider quota; the strict allowlist mitigates SSRF but does not replace authentication, caching and quotas for a multi-user product.

Follow `SETUP_GUIDE.md` for step-by-step installation and test links.
