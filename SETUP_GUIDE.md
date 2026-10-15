# ENCORE v1.6 — First-time Vercel setup (Windows + GitHub + iPhone)

## Keep your current ENCORE website
You are not changing the URL of your iPhone app. The frontend stays at https://sharker-dem.github.io/Encore/ and your app design remains the same. The Vercel website will only be used for the event and setlist API routes.

## 1. Back up before upgrading
On the existing live ENCORE website, open Settings → Export backup, then save the JSON to your computer. If you have concerts on your iPhone, back them up **from the iPhone** as well; those records are stored separately from your computer's browser.

## 2. Upload the new code to GitHub
1. Download and unzip this package.
2. Open https://github.com/sharker-dem/Encore
3. Open Code, then Add file → Upload files.
4. Drag the eight root files (`index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icon.png`, `icon.svg`, `README.md`), the `SETUP_GUIDE.md`, and the entire `api` folder (including its internal `.mjs` files). Do not upload the ZIP itself. Do not upload the parent `encore-v16` folder.
5. Scroll down and commit directly to branch `main` with message `ENCORE v1.6 backend integration`.
6. After GitHub Pages publishes, open https://sharker-dem.github.io/Encore/ → Settings. At the bottom it should say ENCORE v1.6.
7. If it still says v1.5, verify deployment under GitHub Actions and refresh (Ctrl+Shift+R on Windows; close/reopen Safari or the Home Screen app on iPhone).

## 3. Create Vercel account
1. Visit https://vercel.com/signup.
2. Sign up with GitHub (simplest because your ENCORE repository is already there).
3. Approve the GitHub connection. If asked which repositories Vercel may access, choose Only select repositories and allow `Sharker-deM/Encore`.
4. On the dashboard select Add New → Project (or New Project).
5. Find `Sharker-deM/Encore` and click Import. If missing, select Adjust GitHub App Permissions, grant Encore, then retry.
6. Project name: `encore-api` (or another unique name). Framework Preset: `Other`. Root Directory: `./` (repository root). No build command is necessary.
7. Deploy. Vercel will produce a production URL such as `https://encore-api-unique.vercel.app`. Your actual URL will be different. Keep it handy.

## 4. Add API keys securely to Vercel
1. In Vercel dashboard, open your new project.
2. Choose Settings → Environment Variables (occasionally labelled Environment Variables in the project settings sidebar).
3. For each variable below, enter the **name exactly** in the left field and paste its corresponding secret in the value field.

Required for each provider:
- `TICKETMASTER_API_KEY` — Ticketmaster Discovery Consumer Key.
- `PARSE_API_KEY` — Parse.bot API key from your account dashboard (the Ticketek parser uses this via `X-API-Key`).
- `SETLISTFM_API_KEY` — setlist.fm API key, already created.

Optional for Spotify Web API track lookup later:
- `SPOTIFY_CLIENT_ID` — Spotify developer app Client ID.
- `SPOTIFY_CLIENT_SECRET` — Spotify developer app Client Secret. Never share this or paste it into GitHub.

For now, configure Production. You may also enable Preview if you test preview deployments. Then choose Save. Environment variables only apply to deployments created **after** they're set, so go to Deployments → latest production deployment → `...` → Redeploy. If the UI labels vary, make a new GitHub commit to trigger a fresh production deployment.

## 5. Confirm backend online
Open your real Vercel address followed by `/api/health` in your browser, e.g.:
`https://YOUR-VERCEL-ADDRESS.vercel.app/api/health`
Expected shape: `{ "ok": true, "app": "ENCORE", "version": "1.6", "providers": { "ticketmaster": true, "ticketek": true, "setlistfm": true, "spotify": true/false } }`.
If you see 404, confirm the `api/` folder is in repository root and the last Vercel deployment succeeded. If provider flags are false, check the environment variable names and redeploy.

## 6. Connect ENCORE to the backend
1. Open https://sharker-dem.github.io/Encore/.
2. Open Settings → ENCORE Vercel backend.
3. Paste only your real Vercel site URL, e.g. `https://encore-api-unique.vercel.app`, WITHOUT `/api/health`.
4. Tap Save backend URL, then Test connection.
5. When connected, Add Concert → enter an artist and city. Ticketmaster suggestions appear as you type; press Search Ticketmaster + Ticketek to include Ticketek results. Selecting a Ticketek result will fetch the exact performance details. Alternately paste an official Ticketek event URL.
6. Save your concert. In its Show info tab, tap Browse recent setlists to view setlist.fm reported concerts and Spotify song-search links.

## Spotify developer choices
Choose **Web API only**. Do not choose Ads API or iOS. Web Playback SDK is not needed for linking to Spotify; it would be an optional future phase involving Premium-user authentication and a playback interface. Current Spotify Web API Development Mode requires the developer to have Spotify Premium. You do NOT need Spotify keys just to open songs in the Spotify app.

## Important current limitations
- QPAC / QTIX direct extraction has not been implemented. Add those events manually and save a link to the official listing.
- Ticketek parser is third-party, not official; outputs/credits/terms may change.
- No background checks, automatic push notifications, iPhone notification permission prompts, synced database or exact seat highlighting.
- Automatic event-change checks currently work only for Ticketmaster while ENCORE is open. Ticketek events are imported on demand. Setlist.fm is fetched when you click its button.
- Your Vercel API URLs are publicly reachable and can spend your provider credits if abused. This personal prototype is NOT suitable for distributing widely without access control, quotas and rate limiting.
- The GitHub repository is public. Only put source code there, never API keys.

## Troubleshooting
- **ENCORE v1.5 still appears:** GitHub Pages has cached an old service worker. Check GitHub Actions, refresh the Safari version; do not delete local storage to troubleshoot without a backup.
- **Vercel 404:** Root directory or API folder placement is incorrect. Check `api/health.mjs` exists directly in root `api/` directory.
- **Vercel 500/502:** Open Vercel project → Logs or Deployment → Functions logs. Check credentials and provider status.
- **API key invalid:** Verify variable names and copy the correct *key* rather than an unrelated secret. Redeploy after fixing environment variables.
- **Search has no results:** Providers have different coverage. Ticketek may not include an event. Use a paste-in Ticketek URL or manual entry.
- **QPAC concert:** Use Add manually and add its official event URL; don't confuse QPAC's Cultural Forecourt with its seated Concert Hall.
- **Don't post keys/screenshots showing keys in chat.** You can share an error message or a screenshot with secrets hidden.
