/* PUBLIC configuration only. These values may safely appear in GitHub.
   NEVER place a Supabase secret/service-role key, CRON_SECRET, ENCORE_SYNC_TOKEN,
   or provider API key in this file. */
window.ENCORE_PUBLIC_CONFIG = Object.freeze({
  supabaseUrl: 'PASTE_SUPABASE_PROJECT_URL_HERE',
  supabasePublishableKey: 'PASTE_SUPABASE_PUBLISHABLE_KEY_HERE',
  backendUrl: location.hostname === 'sharker-dem.github.io'
    ? 'https://encore-api-ochre.vercel.app'
    : location.origin,
  turnstileSiteKey: '' // public site key; REQUIRED before inviting friends
});
