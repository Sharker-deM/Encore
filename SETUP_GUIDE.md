# ENCORE v1.8 — BEGINNER SETUP GUIDE

This version keeps the appearance and features of ENCORE v1.7, while adding an optional private cloud backup, scheduled event monitoring and iPhone push notifications.

**YOUR EXISTING LINKS**
- GitHub repository: https://github.com/sharker-dem/Encore
- iPhone app: https://sharker-dem.github.io/Encore/
- Vercel backend: https://encore-api-ochre.vercel.app

**What stays unchanged:** Your existing Ticketmaster, Ticketek Parse.bot, setlist.fm and Spotify keys in Vercel. Your current app URL and saved local concerts should also be preserved. Do not uninstall your app or clear browser data.

## A. Back up before changing anything

1. Open ENCORE on the iPhone or browser where your concerts are currently stored.
2. Settings → Export backup.
3. Keep that JSON download somewhere safe. **Do not skip this.**
4. If ENCORE is installed on multiple devices, make a backup from each one; v1.7 stored information locally per device.

## B. Set up a Supabase database (one-time)

This stores your concert records for the automatic scheduler. You do not need to write SQL yourself; the project provides a file containing the commands.

1. Visit https://supabase.com/dashboard and sign up (GitHub sign-in works).
2. Choose **New project**. Pick a descriptive name such as `encore-personal`.
3. Choose a strong **Database Password**, then save it somewhere secure. You do not paste that password into ENCORE or Vercel.
4. Pick an Australia region if available, leave the other defaults, and create the project. Wait for it to finish provisioning.
5. In Supabase's left menu, open **SQL Editor**, then click **New query**.
6. Open `SUPABASE_SETUP.sql` from the downloaded ENCORE ZIP using Notepad on Windows. Press Ctrl+A, Ctrl+C.
7. Paste the SQL into the SQL Editor and click **Run**. The SQL creates four tables and enables Row Level Security. Run this script only in your own project.
8. In Supabase open **Project Settings → API Keys**. Locate the **secret key**, which starts `sb_secret_`. Copy it securely. **Do not use the publishable key.**
9. Get your **Project URL** from the **Connect** dialog. It looks like `https://abc123.supabase.co`.
10. **Never share the secret key, database password or access code in chat or GitHub.** The secret key gives your Vercel backend database administrator access.

Supabase's 2026 API key guidance recommends `sb_secret_` for server-side access. ENCORE uses this new key type. Legacy `service_role` keys are also supported as a fallback but are being phased out.

## C. Generate private ENCORE access and push keys on Windows (one-time)

This requires **Node.js** on your computer only to create cryptographic keys; your iPhone app will not need Node.js.

1. If you don't have Node.js, download the **LTS** version from https://nodejs.org/en/download and install it normally.
2. Extract the ENCORE v1.8 ZIP to Downloads or Desktop.
3. Open the extracted `encore-v18` folder in Windows File Explorer.
4. Click the address bar at the top, type `powershell`, press Enter. This opens PowerShell in that folder.
5. Run `npm.cmd install` and wait for installation to finish. This downloads the `web-push` library and its dependencies.
6. Run `npm.cmd run generate-secrets`.
7. The screen will show five lines. Copy them into a **private password manager or secure note**, not into GitHub:
   - `ENCORE_SYNC_TOKEN` — access code for your personal ENCORE cloud.
   - `CRON_SECRET` — authorises Vercel scheduled jobs.
   - `VAPID_PUBLIC_KEY` — public encryption key for browser push registration.
   - `VAPID_PRIVATE_KEY` — private push signing key.
   - `VAPID_SUBJECT` — replace the example email with **your own real email address**, e.g. `mailto:you@example.com`.
8. Keep the two VAPID keys paired. Regenerating them later can invalidate existing push subscriptions; users then need to re-enable notifications.

**Important:** `ENCORE_SYNC_TOKEN` is a *long random secret*, not a PIN. Anyone who gets it can access your personal cloud data. It will be stored in Vercel and separately in ENCORE's local storage on any device you connect.

## D. Add 7 new environment variables to your existing Vercel project

1. Log in at https://vercel.com.
2. Open your existing `encore-api` project. **Do not create a second Vercel project.**
3. Navigate to **Settings → Environment Variables**.
4. For each variable, click **Add Environment Variable** (or **Add new variable**). Set the environment to **Production**, with these exact names:

| Key | Value source |
| --- | --- |
| `SUPABASE_URL` | Project URL from Supabase |
| `SUPABASE_SECRET_KEY` | New `sb_secret_` server key from Supabase |
| `ENCORE_SYNC_TOKEN` | Generated access token from Step C |
| `CRON_SECRET` | Generated cron secret from Step C |
| `VAPID_PUBLIC_KEY` | Generated public key from Step C |
| `VAPID_PRIVATE_KEY` | Generated private key from Step C |
| `VAPID_SUBJECT` | Your own email as `mailto:you@example.com` |

5. **Don't remove your existing** Ticketmaster, Ticketek, setlist.fm or Spotify variables.
6. Keep all keys in Vercel environment variables. Do not put them into `.env` files uploaded to GitHub, and don't share screenshots revealing their values.

## E. Upload the v1.8 code to GitHub

1. Extract the ENCORE v1.8 ZIP if you haven't already.
2. Visit https://github.com/sharker-dem/Encore and click the **Code** tab.
3. Select **Add file → Upload files**.
4. If Step C created a `node_modules` folder in your extracted project, **delete that folder first**. Vercel will reinstall dependencies; do not upload `node_modules`. Drag the **contents** of the `encore-v18` folder (not the parent folder itself) into the uploader. Keep folder structure: `api` at the root, `scripts` at the root, etc.
5. The repository root must contain `index.html`, `app.js`, `styles.css`, `sw.js`, `package.json`, `vercel.json`, and `api/`.
6. Do **not** upload any local `node_modules` directory created in Step C; it can contain many files and is unnecessary. If GitHub's browser upload exceeds limits, use GitHub Desktop (see below).
7. Select **Commit directly to the main branch** and commit with the message `ENCORE v1.8 background monitoring and push`.
8. GitHub Pages should redeploy your website; Vercel should automatically redeploy the API functions from this same GitHub repository.
9. Check the GitHub **Actions** tab and the Vercel **Deployments** tab until both show success. Vercel must install npm dependencies during its build.

### Easier alternative if GitHub's browser upload struggles with folders

- Install GitHub Desktop at https://desktop.github.com/.
- Sign in → File → Clone repository → select `Encore` → Choose a folder on your computer.
- Copy the v1.8 contents into the cloned folder, replacing old files (exclude `node_modules`).
- In GitHub Desktop, enter the commit message and click **Commit to main**, then **Push origin**.

## F. Verify your backend

Open https://encore-api-ochre.vercel.app/api/health . It should return:

```json
{
  "ok": true,
  "app": "ENCORE",
  "version": "1.8",
  "providers": {
    "ticketmaster": true,
    "ticketek": true,
    "setlistfm": true,
    "spotify": true,
    "officialLinks": true,
    "cloud": true,
    "push": true,
    "dailyMonitoring": true
  }
}
```

The booleans only show that configuration values are present; they do not prove successful push delivery or database queries. Do not test `/api/cron-monitor` in a browser tab — the job requires secret authentication.

### Verify the cron schedule

In Vercel open your project → **Settings → Cron Jobs** (or find Cron Jobs under project settings). You should see one job:

- Path: `/api/cron-monitor`
- Schedule: `0 22 * * *` (22:00 UTC = **approximately 8–9 AM next day in Brisbane** on Vercel Hobby)

If no cron is listed, check that `vercel.json` is in the repository root and the Vercel deployment succeeded.

## G. Connect the cloud in the ENCORE app

1. Open https://sharker-dem.github.io/Encore/ on your iPhone home-screen app.
2. Refresh the app. In Settings, the footer should read `ENCORE v1.8`.
3. Confirm your Vercel URL is still saved. If not, enter `https://encore-api-ochre.vercel.app` and click Save backend URL.
4. Go to **Settings → Cloud & notifications → Private cloud backup**.
5. Paste your *personal* `ENCORE_SYNC_TOKEN` (not the VAPID or Supabase key).
6. Tap **Connect cloud**. If cloud already has concerts, ENCORE will ask whether you want to restore its records or retain your local ones.
7. Select **Upload latest backup** and check for the success message. This is the data your scheduled Vercel job will monitor.

This first version of cloud backup is for your own personal account and uses a long access code, not an email/password login. Changes are automatically uploaded from a connected device, and you can restore a cloud backup manually. If you use two devices, don't edit the same concert on both simultaneously (last-write-wins, no conflict-resolution screen yet).

## H. Enable push notifications on your iPhone

1. Your phone needs **iOS 16.4 or later**. Apple only supports web push for iPhone PWAs installed on the Home Screen.
2. Ensure ENCORE was installed by Safari → Share → Add to Home Screen. **Open ENCORE via its Home Screen icon**, not an ordinary Safari tab.
3. Open **Settings → Cloud & notifications → iPhone push notifications**.
4. Tap **Enable notifications**. When iOS asks for permission, tap **Allow**.
5. Once enabled, tap **Send test**.
6. You should receive a test alert such as “ENCORE notifications are working ✨”. Keep notifications enabled in iPhone Settings and ensure no Focus mode is suppressing alerts.
7. Tap **Check events now** to run the secured event monitor immediately (limited to one manual run per six-hour interval; this may use Ticketek credits). Afterwards, open a linked concert to review any detected changes.
8. To stop notifications for that specific device, use **Turn off on this device** in ENCORE. You can also revoke permission in iPhone Settings.

Apple doesn't require a paid Apple Developer account for Home Screen Web Push.

## I. Set reminders per concert

1. Open a saved concert.
2. Find its reminder preferences (existing **Countdown reminders** control).
3. Select:
   - **Once** + `3` days before — send just one countdown reminder.
   - **Every day** + `14` days before — start daily reminders two weeks before the show.
   - **Weekly** + `28` days before — send weekly reminders (and on show day).
   - **Off** — no countdown reminders.
4. Tick **Event changes** if you want cancellation, venue, date and show-time changes to trigger notifications.
5. Tick **Savings reminders** if you'd also like deposit reminders for that concert.
6. Press Save. That also queues a cloud backup.

Note: On **Vercel Hobby**, notifications are evaluated **once daily around 8–9 AM Brisbane time**. The preferred clock-time field remains stored for a future scheduler upgrade; it does **not** control exact push delivery in v1.8.

## J. How background event monitoring behaves

Each daily cron run reads your saved cloud concerts and queries supported event sources:

- Ticketmaster by exact event ID.
- Ticketek via your repaired Parse.bot event parser (may consume provider credits). To conserve credits, ENCORE checks approximately weekly when the concert is over 30 days away, every three days between 8 and 30 days, and daily in the last week.
- QPAC, QTIX and other supported official event links using available publicly readable event-page information.

ENCORE checks date, announced start time, venue, city, status, doors-open time, headliner time and support acts **when the source actually publishes them**. It never treats a missing web listing as proof of cancellation and never overwrites original concert details until you accept an update. It creates an in-app review notice regardless of whether push delivery was enabled; event-change push itself is opt-out per concert.

It cannot promise every provider will allow scraping or publish updates promptly. Setlist.fm song-list changes and exact seat-map change detection are not included in the scheduled monitor yet; setlists remain accessible through Show info on demand. Monitor run errors can be reviewed in Vercel cron logs.

## Common errors

**App still says v1.7:** Wait for GitHub Pages; close and reopen the iPhone app. Its old service worker may cache earlier assets; try opening the website in Safari then relaunch the Home Screen app. Do not clear website data until you have backed up your concerts.

**`/api/health` says `cloud: false`:** Check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are added to **Production**, then redeploy Vercel.

**Cloud connect fails (401):** `ENCORE_SYNC_TOKEN` in ENCORE doesn't exactly match Vercel. Use the long random token; don't paste a Spotify, Ticketmaster or Supabase key.

**Cloud connect fails (503):** Check the Supabase URL, **secret** key and that the four SQL tables were created. Check runtime logs; share the error message only, not secret values.

**No notification permission prompt on iPhone:** Ensure you're opening an installed Home Screen app on iOS 16.4+. If you previously denied permission, allow it in iPhone Settings → Notifications → ENCORE (label and placement may vary).

**Test says no device subscription:** Tap Enable Notifications first. Check VAPID keys in Vercel, redeploy and retry.

**No reminder at exactly the preferred time:** Expected on Hobby. The one daily cron runs in a ~one-hour window around 8 AM Brisbane. Event sources can also be delayed.

**Ticketek returns a provider error:** Your repaired Parse.bot scraper may fail or hit credit limits. Other providers and saving concerts should continue working.

**GitHub upload accidentally includes `node_modules`:** Stop and remove it from the upload selection. Do not commit it.

**Vercel build says `Cannot find package 'web-push'`:** Ensure `package.json` was uploaded to your repository root, and redeploy. Vercel installs that dependency automatically.
