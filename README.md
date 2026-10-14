# ENCORE v1.4 — Your Concert Companion

ENCORE is a mobile-first Progressive Web App (PWA) for recording concerts, counting down, planning savings, tracking spending, viewing event artwork, recording ticket details, consulting venue charts and checking linked events for updates.

## Publishing to your existing GitHub Pages website

1. **Back up your data first:** Open the current ENCORE app > **Settings > Export backup**. Keep the downloaded JSON somewhere safe. The upgrade normally preserves existing locally stored data, but a backup is important.
2. Extract `ENCORE-v1.4.zip` on your computer.
3. In your **sharker-dem/Encore** GitHub repository, open **Add file > Upload files**.
4. Upload the files *inside* the extracted ZIP directly into the repository root. The `index.html` file should appear at the top level of the repo (not inside a second nested folder).
5. Commit the changes to `main` and wait until **Actions** shows the Pages deployment succeeded.
6. Reload `https://sharker-dem.github.io/Encore/`. On a computer use Ctrl+Shift+R. On iPhone close and reopen the Home Screen app; if an old copy persists, refresh the Safari tab. Do not clear website data unless you have exported a backup.
7. If you need to restore data, open **Settings > Import backup**. This replaces the browser's existing records with those from the chosen backup, so choose carefully.

## Connect concert search (Ticketmaster)

1. Go to https://developer.ticketmaster.com/ and sign up or sign in.
2. Open **My Apps** in the developer portal. Find or create an app with **Discovery API** access.
3. Copy the **Consumer Key** (the Discovery API key). Do **not** use a Consumer Secret or an unrelated private credential.
4. In ENCORE, open **Settings > Concert lookup connection**, paste the Consumer Key, then tap **Save key on this device**.
5. Open **Add concert**, enter an **artist** and **city**. Suggestions will load after a short pause; you can also tap **Find concerts**.
6. Tap your exact event in the results. ENCORE fills the fields supplied by Ticketmaster: event name, date, optional time, venue, city, promo art, event link and seatmap (where provided). Check the details before saving.

Notes: This is a front-end-only personal prototype. The Consumer Key remains in local browser storage and is not committed to GitHub, but browser network requests expose it. The proper production design uses a protected server-side proxy and rate limiting. Not every event or provider appears on Ticketmaster. Without a key, manually entered events still work.

## Posters and images

- When selecting a matching Ticketmaster event, ENCORE automatically uses the best non-fallback promotional image returned by that provider.
- **A promotional image is not guaranteed to be the actual official tour poster.** If you want the exact tour poster, obtain it from the official event/artist/promoter and paste its HTTPS image URL, or upload a personal copy from your device in the concert editor.
- You can upload PNG, JPG, or WebP. ENCORE compresses it and stores it locally for the banner and concert cards. Large image collections can use significant browser storage; export backups and don't rely on it as permanent storage.
- Follow the image provider's reuse terms. ENCORE does not search arbitrary image sites or bypass copyrighted-image restrictions.

## Ticket types and seating maps

- Ticket type is selected **for each concert**, not inferred rigidly from the venue. Even Riverstage and the Fortitude Music Hall can offer different configurations.
- Choose **Standing / General Admission**, **Reserved seating**, or **Not sure yet**. With reserved seating, enter Section/Block, Row and Seat number(s).
- When Ticketmaster supplies an event-specific static seating map, ENCORE shows it in concert details. Otherwise you can add a seating chart's HTTPS image URL or upload an image.
- Use the **Zoom map** control and **tap your approximate position** to place a persistent marker. The marker is manual; provider chart images do not expose individual seat coordinates, so exact seats cannot be located or verified automatically in this version.
- If a map doesn't reflect your event's configuration, use your ticket seller's official live seating map.

## Event monitoring — current capabilities and limitations

- **Implemented:** For concerts linked to a Ticketmaster event ID, ENCORE compares the last saved provider details with new data when the app opens (no more than once per 12 hours) and when you tap **Event watch > Check now**. It looks for event date, time, venue, city, official notes, seatmap image and status changes (e.g. cancelled or postponed). It shows proposed updates with source links; you choose **Apply updates** or **Dismiss**. Changes are logged.
- **Not yet implemented:** Scheduled background checks while the app is closed; reliable push notifications; automatic setlist fetching and comparison; automatic extraction of confirmed doors/support/headliner set times. These need more providers and a backend scheduler. ENCORE has **Setlists & show times** with manual time fields, notes and web searches for checking official announcements or setlist.fm.
- Event monitoring only reflects the ticket provider's supplied data; it cannot guarantee detection of all announcements.

## Storage and privacy

- Concerts, expenses, savings, venue maps and annotations are stored in this browser's `localStorage` under `encore-v1` (preserving ENCORE v1.3 records).
- The Ticketmaster key is separately stored under `encore-ticketmaster-consumer-key` and **not exported** in backups.
- Your records don't sync across devices yet. Clearing web app data or reinstalling may erase records, so use **Export backup** regularly.

## Test checklist

- Save a date-only event and a dated/timed event.
- Edit a concert; select reserved seating and enter block, row and seat.
- Add an official poster image and check its home card and details banner.
- Attach a map and tap to save a marker.
- Save doors/support/headliner times and setlist notes.
- If you connected the Discovery Consumer Key, select a search result and use **Event watch > Check now**.
- Check that savings, expenses, calendar export and Archive still work.

This version was tested in Chromium with simulated Ticketmaster API responses. Live lookup depends on a valid key, network access, vendor coverage and provider response formats. iPhone-specific testing remains to be done.
