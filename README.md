# ENCORE v1.5 — Interface redesign

**ENCORE** is a personal, mobile-first concert-tracking PWA for GitHub Pages. It is intentionally static: no npm install or build process is needed.

## What changed since v1.4

- New, more polished mobile-first home screen with a next-concert hero card, countdown, event cards and summary cards.
- A much shorter **two-step add flow**: Find your show -> Review & Save. Only artist and date are required; time is optional.
- With a Ticketmaster Discovery API Consumer Key, entering an artist automatically searches for events. Selecting an event fills the available date, time, venue, city, promotional image and seatmap.
- Event-specific ticket type: Standing/GA, Reserved seat (section/row/seat), or Not sure.
- Optional sections for artwork, map, status and notes, instead of forcing users through these for every concert.
- Cleaner concert detail screen with Overview, Budget and Show info tabs.
- Savings targets, automatic contribution recalculation, deposits, and itemised spending.
- An optional seating map display with manual approximate-position pin and zoom. Automatic exact seat lookup is **not** available.
- Manual show times/setlist notes, links to setlist.fm, and foreground Ticketmaster event-change checks.
- Date-only calendar downloads, calendar view, automatic past-concert archive, manual archive, permanent delete, JSON export/import.
- Fixed form submission handling and delayed search event race conditions.

## Updating your current GitHub Pages project

**IMPORTANT: Back up your data first.** In your existing app, open Settings -> Export backup. Keep that JSON file somewhere safe. ENCORE continues using the `encore-v1` storage key, so existing records should remain on the same browser and website.

1. Unzip `ENCORE-v1.5-redesign.zip` on your computer.
2. Open https://github.com/Sharker-deM/Encore and go to the repository's main Code page.
3. Click **Add file** -> **Upload files**.
4. Upload these eight files **directly into the repository root** (not a new folder, and not the ZIP file): `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icon.png`, `icon.svg`, `README.md`.
5. GitHub will identify files with the same names. Scroll to **Commit changes**, use the message `ENCORE v1.5 intuitive redesign`, and commit to `main`.
6. Open the repository **Actions** tab and wait for the GitHub Pages deployment to succeed.
7. Open https://sharker-dem.github.io/Encore/ and refresh. On a computer use Ctrl+Shift+R. On iPhone, close and reopen the Home Screen app; you may need to open the Safari site and refresh once for the new service worker to update.
8. **Verify the upgrade:** Settings page should show `ENCORE v1.5` near the bottom. If it still shows the old interface, look for an incomplete deployment or old cached files. **Don't delete app data** to fix a cache problem unless you've already exported a backup.

## Optional concert lookup integration

The app remains functional without any API key. To enable online event lookup:

1. Sign in or register at https://developer.ticketmaster.com/.
2. Open your developer app and copy the **Discovery API Consumer Key** (not the Consumer Secret).
3. In ENCORE -> Settings -> Concert discovery, paste and save the key.
4. Tap Add, type an artist and optionally a city. Matches appear automatically after a brief pause, or tap Search concerts.
5. Select the *correct* event. Review the autofilled date, venue and event-specific ticket layout against your actual ticket before saving.

Not all artists or concerts are on Ticketmaster. The promotional event image may *not* be the exact tour poster. Upload an official poster image yourself if necessary. Venue standing/seating configurations are event-specific, and Ticketmaster's API does not guarantee enough information to choose your ticket category accurately; ENCORE asks you.

### API key security

The Consumer Key is saved in your browser's local storage and is not embedded in repository source files. However, browser-side API calls expose it to someone inspecting traffic; this design is a **personal prototype**, not secure server-side key storage. A production app should use a protected backend proxy with rate limiting.

## Event-change monitoring scope

For Ticketmaster-linked concerts, the app checks provider details while open (at most once per 12 hours automatically, and on demand). It looks for changes in date, time, venue, city, status and some event notes. It shows a suggested update for your review and does not silently overwrite your information.

**Not implemented:** background updates while ENCORE is closed; real push notification delivery; automatic monitoring of setlists, announced set times, support acts or individual exact seats. Reminder preferences are stored only. Confirm urgent changes with the official promoter/venue/ticket seller. A backend plus additional authorised data sources are required for reliable background monitoring.

## Storage, privacy and backups

Concerts, spending, savings, images and marker locations are saved locally on the current device under browser localStorage key `encore-v1`; they are **not synced** between iPhone and desktop. Uploading the code to GitHub does not upload your personal concert data. Clearing your app/browser website data can delete saved concerts; export backups regularly. Image uploads are compressed but many images can fill local storage; export backups before major updates.

## Testing

Source checked with `node --check`; browser interaction tests in Chromium (with mocked provider data) covered saving an optional-time concert, editing its time, adding seating details, saving a goal/deposit/expense, show times, archiving, selecting a looked-up event and reviewing a cancellation/date/venue update. These tests do not establish whether Ticketmaster will return a particular real concert or whether iPhone Safari works identically. Test with one concert after deployment.

ENCORE v1.5 · Personal PWA proof of concept
