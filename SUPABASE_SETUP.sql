-- ENCORE v1.8 personal cloud + push monitoring. Run once in Supabase SQL Editor.
-- Access is only through your Vercel backend using a service role secret.
-- RLS deliberately blocks browser anon/authenticated roles.
create table if not exists public.encore_state (
  id text primary key,
  payload jsonb not null default '{"concerts":[],"settings":{}}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint encore_state_single check (id = 'primary')
);
create table if not exists public.encore_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.encore_alerts (
  concert_id text primary key,
  fingerprint text not null,
  changes jsonb not null,
  latest jsonb not null,
  noticed_at timestamptz not null default now(),
  acknowledged boolean not null default false
);
create table if not exists public.encore_notification_log (
  notification_key text primary key,
  kind text not null,
  sent_at timestamptz not null default now()
);
-- Explicitly enable RLS on every table. There are intentionally no anon policies.
alter table public.encore_state enable row level security;
alter table public.encore_subscriptions enable row level security;
alter table public.encore_alerts enable row level security;
alter table public.encore_notification_log enable row level security;
revoke all on public.encore_state from anon, authenticated;
revoke all on public.encore_subscriptions from anon, authenticated;
revoke all on public.encore_alerts from anon, authenticated;
revoke all on public.encore_notification_log from anon, authenticated;
