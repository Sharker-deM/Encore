# ENCORE — PWA starter

A functional local-first concert tracker with concert CRUD, archive, calendar, countdowns, expenses, adaptive savings suggestions, notification *preferences*, backup import/export and .ics calendar export.

## Quick test on a computer

From this folder, run:

```bash
python -m http.server 8000
```

Open http://localhost:8000 in your browser. Do not open index.html directly as a file: service workers require localhost or HTTPS.

## Publish for iPhone (free static hosting)

1. Sign in to GitHub and create a repository (e.g. `encore`).
2. Upload the files in this folder to the repository root (not the enclosing folder).
3. In the repository go to Settings → Pages → Build and deployment → Deploy from a branch → main / root → Save.
4. Wait for the Pages URL shown by GitHub. Open that HTTPS URL in iPhone Safari.
5. Tap Share → Add to Home Screen → Add.

GitHub Pages deployment menus may change. Another static HTTPS host works too.

## Important limits

- Data stays in localStorage on each browser/device. It does not sync. Export backups regularly.
- Reminder settings are saved but there is **no push notification delivery** yet.
- Artist lookup, automatic artist photos, event updates and setlists require API integrations and are not included yet.
- Calendar export creates an .ics file; it does not continuously sync changes.
- Savings are manually recorded, not moved between bank accounts. Savings calculations spread remaining target over remaining contribution periods, rounding up to cents.
- No payment credentials or API keys are required for this version.
