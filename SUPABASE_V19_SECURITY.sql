-- ENCORE 1.9 SECURE MULTI-USER BETA - SQL FIX 1 (2026-10-21)
-- Run ONLY in the separate encore-beta project in Supabase SQL Editor.
-- For a production migration, use a separate reviewed rollout and backup.
-- NON-DESTRUCTIVE: The legacy encore_state, encore_subscriptions, encore_alerts,
-- and encore_notification_log tables remain untouched for controlled migration.
-- Emails/passwords stay in Supabase Auth, NOT in these app tables.

create schema if not exists private;

create table if not exists public.encore_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'ENCORE listener',
  avatar_path text,
  discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  constraint encore_username_format check (username ~ '^[a-z][a-z0-9_]{2,27}$'),
  constraint encore_display_name_length check (char_length(display_name) between 1 and 60),
  constraint encore_avatar_owner check (avatar_path is null or (
    split_part(avatar_path, '/', 1) = id::text
    and avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ))
);

create table if not exists public.encore_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"concerts":[],"settings":{}}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint encore_payload_shape check (
    jsonb_typeof(payload) = 'object'
    and jsonb_typeof(payload -> 'concerts') = 'array'
    and jsonb_typeof(payload -> 'settings') = 'object'
    and jsonb_array_length(payload -> 'concerts') <= 150
    and octet_length(payload::text) < 1500000
  )
);

-- Canonical pair: low_id < high_id prevents duplicates in either direction.
create table if not exists public.encore_friendships (
  low_id uuid not null references auth.users(id) on delete cascade,
  high_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (low_id, high_id),
  constraint encore_pair_order check (low_id < high_id),
  constraint encore_inviter_participant check (requested_by in (low_id, high_id)),
  constraint encore_friend_status check (status in ('pending','accepted'))
);
create index if not exists encore_friends_high_idx on public.encore_friendships(high_id);
create index if not exists encore_friends_requested_idx on public.encore_friendships(requested_by, created_at desc);

create table if not exists public.encore_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,blocked_id),
  constraint encore_cannot_block_self check (user_id <> blocked_id)
);

-- A helper in an UNEXPOSED schema, with locked search_path, used by the RLS policies.
create or replace function private.encore_pair_blocked(a uuid,b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.encore_blocks
    where (user_id=a and blocked_id=b) or (user_id=b and blocked_id=a)
  );
$$;
revoke all on function private.encore_pair_blocked(uuid,uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.encore_pair_blocked(uuid,uuid) to authenticated;

-- Immutable abuse-prevention trail. Unlike the friendship row itself, this cannot
-- be deleted by cancelling an invitation. Unexposed/private schema; no client grants.
create table if not exists private.encore_friend_request_audit (
  requester uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
create index if not exists encore_friend_audit_limit_idx
  on private.encore_friend_request_audit(requester,requested_at desc);

-- A server-independent, database-enforced invitation rate cap.
create or replace function private.encore_can_request(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select (select auth.uid()) is not null
  and target <> (select auth.uid())
  and not private.encore_pair_blocked((select auth.uid()), target)
  and exists (select 1 from public.encore_profiles where id=target and discoverable=true)
  and (select count(*) from private.encore_friend_request_audit where requester=(select auth.uid())
       and requested_at > now()-interval '1 hour') < 10;
$$;
revoke all on function private.encore_can_request(uuid) from public, anon;
grant execute on function private.encore_can_request(uuid) to authenticated;

-- New profile and empty state are created server-side. Metadata cannot specify other users.
create or replace function private.encore_initialize_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.encore_profiles (id, username, display_name)
 values (new.id, 'listener_' || substr(replace(new.id::text,'-',''),1,16), 'ENCORE listener');
 insert into public.encore_user_state(user_id) values (new.id);
 return new;
end;
$$;
drop trigger if exists encore_auth_user_created on auth.users;
create trigger encore_auth_user_created after insert on auth.users
for each row execute function private.encore_initialize_user();

-- If this script runs on a project with existing Auth users, initialise those too.
-- (The trigger above automatically handles all future signups.)
insert into public.encore_profiles(id,username,display_name)
select id,'listener_' || substr(replace(id::text,'-',''),1,16),'ENCORE listener'
from auth.users on conflict (id) do nothing;
insert into public.encore_user_state(user_id)
select id from auth.users on conflict (user_id) do nothing;

-- Enable and explicitly scope RLS/grants. No anon access to ANY user data.
alter table public.encore_profiles enable row level security;
alter table public.encore_user_state enable row level security;
alter table public.encore_friendships enable row level security;
alter table public.encore_blocks enable row level security;
revoke all on public.encore_profiles,public.encore_user_state,public.encore_friendships,public.encore_blocks from anon,authenticated;
grant select on public.encore_profiles to authenticated;
grant update (username,display_name,avatar_path,discoverable) on public.encore_profiles to authenticated;
grant select on public.encore_user_state to authenticated;
grant update (payload,version,updated_at) on public.encore_user_state to authenticated;
grant select,insert,delete on public.encore_friendships to authenticated;
grant update (status) on public.encore_friendships to authenticated;
grant select,insert,delete on public.encore_blocks to authenticated;

drop policy if exists "profile visible only to self, discoverable members or accepted friends" on public.encore_profiles;
create policy "profile visible only to self, discoverable members or accepted friends"
on public.encore_profiles for select to authenticated
using (id = (select auth.uid()) or (not private.encore_pair_blocked(id,(select auth.uid())) and (discoverable or exists (
 select 1 from public.encore_friendships f
 where f.status='accepted' and
 ((f.low_id=id and f.high_id=(select auth.uid())) or
  (f.high_id=id and f.low_id=(select auth.uid())))
))));
drop policy if exists "profile editable only by owner" on public.encore_profiles;
create policy "profile editable only by owner" on public.encore_profiles
for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));

drop policy if exists "concert backup readable only by owner" on public.encore_user_state;
create policy "concert backup readable only by owner" on public.encore_user_state
for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "concert backup editable only by owner" on public.encore_user_state;
create policy "concert backup editable only by owner" on public.encore_user_state
for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop policy if exists "friend relation visible only to participants" on public.encore_friendships;
create policy "friend relation visible only to participants" on public.encore_friendships
for select to authenticated using (
 (select auth.uid()) in (low_id,high_id)
);
drop policy if exists "send limited invitations to discoverable users" on public.encore_friendships;
create policy "send limited invitations to discoverable users" on public.encore_friendships
for insert to authenticated with check (
 status='pending' and requested_by=(select auth.uid()) and
 (select auth.uid()) in (low_id,high_id) and
 private.encore_can_request(case when low_id=(select auth.uid()) then high_id else low_id end)
);
-- Record every successfully inserted friend request, including ones later removed.
create or replace function private.encore_audit_friend_request()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 insert into private.encore_friend_request_audit(requester,recipient)
 values (new.requested_by, case when new.requested_by=new.low_id then new.high_id else new.low_id end);
 return new;
end;
$$;
drop trigger if exists encore_friend_request_audit_trigger on public.encore_friendships;
create trigger encore_friend_request_audit_trigger after insert on public.encore_friendships
for each row execute function private.encore_audit_friend_request();

drop policy if exists "only receiver may accept pending request" on public.encore_friendships;
create policy "only receiver may accept pending request" on public.encore_friendships
for update to authenticated
using (status='pending' and requested_by<>(select auth.uid()) and (select auth.uid()) in (low_id,high_id)
  and not private.encore_pair_blocked(low_id,high_id))
with check (status='accepted' and requested_by<>(select auth.uid()) and (select auth.uid()) in (low_id,high_id)
  and not private.encore_pair_blocked(low_id,high_id));
drop policy if exists "participant can unfriend or decline request" on public.encore_friendships;
create policy "participant can unfriend or decline request" on public.encore_friendships
for delete to authenticated using ((select auth.uid()) in (low_id,high_id));

drop policy if exists "block list private to owner" on public.encore_blocks;
create policy "block list private to owner" on public.encore_blocks
for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "owner can block" on public.encore_blocks;
create policy "owner can block" on public.encore_blocks
for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "owner can unblock" on public.encore_blocks;
create policy "owner can unblock" on public.encore_blocks
for delete to authenticated using (user_id=(select auth.uid()));

-- Private avatars, max 2 MiB. Do not allow SVG/HTML or public buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('encore-avatars','encore-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,
 allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "ENCORE avatars upload only to own folder" on storage.objects;
create policy "ENCORE avatars upload only to own folder" on storage.objects
for insert to authenticated with check (
 bucket_id='encore-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);
drop policy if exists "ENCORE avatar fetch only owner or accepted friends" on storage.objects;
create policy "ENCORE avatar fetch only owner or accepted friends" on storage.objects
for select to authenticated using (
 bucket_id='encore-avatars' and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or exists (
   select 1 from public.encore_friendships f
   where f.status='accepted' and
   ((f.low_id::text=(storage.foldername(name))[1] and f.high_id=(select auth.uid())) or
    (f.high_id::text=(storage.foldername(name))[1] and f.low_id=(select auth.uid())))
  )
 )
);
drop policy if exists "ENCORE avatar delete only owner" on storage.objects;
create policy "ENCORE avatar delete only owner" on storage.objects
for delete to authenticated using (
 bucket_id='encore-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- Web Push: only the trusted Vercel backend has write access, after verifying
-- the user's real Supabase Auth access token (NOT a self-declared userId).
create table if not exists public.encore_user_subscriptions (
 endpoint text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 subscription jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint encore_endpoint_length check (char_length(endpoint) between 30 and 1000)
);
create index if not exists encore_user_sub_user_idx on public.encore_user_subscriptions(user_id);
create table if not exists public.encore_user_notification_log (
 user_id uuid not null references auth.users(id) on delete cascade,
 notification_key text not null,
 kind text not null,
 sent_at timestamptz not null default now(),
 primary key (user_id,notification_key)
);
create table if not exists public.encore_user_alerts (
 user_id uuid not null references auth.users(id) on delete cascade,
 concert_id text not null,
 fingerprint text not null,
 changes jsonb not null,
 latest jsonb not null,
 noticed_at timestamptz not null default now(),
 acknowledged boolean not null default false,
 primary key (user_id,concert_id)
);
create index if not exists encore_alerts_owner_idx on public.encore_user_alerts(user_id,acknowledged);
alter table public.encore_user_subscriptions enable row level security;
alter table public.encore_user_notification_log enable row level security;
alter table public.encore_user_alerts enable row level security;
revoke all on public.encore_user_subscriptions,public.encore_user_notification_log,public.encore_user_alerts from anon,authenticated;
grant select on public.encore_user_alerts to authenticated;
grant update (acknowledged) on public.encore_user_alerts to authenticated;
drop policy if exists "user reads only own concert alerts" on public.encore_user_alerts;
create policy "user reads only own concert alerts" on public.encore_user_alerts
for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "user acknowledges only own concert alerts" on public.encore_user_alerts;
create policy "user acknowledges only own concert alerts" on public.encore_user_alerts
for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

-- Revision-checked user updates. Direct updates are still owner-scoped by RLS.
-- This function prevents silent last-write-wins overwrites across devices.
create or replace function public.encore_save_state(expected_version integer,new_payload jsonb)
returns integer language plpgsql security invoker set search_path = ''
as $$
declare v integer;
begin
 if (select auth.uid()) is null then raise exception 'Not signed in' using errcode='28000'; end if;
 if new_payload is null or jsonb_typeof(new_payload) <> 'object'
   or jsonb_typeof(new_payload->'concerts') <> 'array'
   or jsonb_typeof(new_payload->'settings') <> 'object'
   or jsonb_array_length(new_payload->'concerts') > 150
   or octet_length(new_payload::text) >= 1500000
 then raise exception 'Invalid or oversized backup' using errcode='22023'; end if;
 update public.encore_user_state
 set payload=new_payload, version=version+1, updated_at=now()
 where user_id=(select auth.uid()) and version=expected_version
 returning version into v;
 if v is null then raise exception 'Another device has updated your concerts. Reload before saving.' using errcode='P0001'; end if;
 return v;
end;
$$;
revoke all on function public.encore_save_state(integer,jsonb) from public,anon;
grant execute on function public.encore_save_state(integer,jsonb) to authenticated;

-- Legacy 1.8 tables deliberately unchanged. Disable old token-protected endpoints
-- AFTER you have safely migrated and tested your own records.

-- Server-only per-user quota accounting for provider-backed API calls.
-- Atomic UPSERT avoids the unreliable per-instance counters of serverless functions.
create table if not exists public.encore_api_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  endpoint text not null,
  hits integer not null default 1 check(hits between 1 and 10000),
  primary key(user_id,window_start,endpoint)
);
alter table public.encore_api_usage enable row level security;
revoke all on public.encore_api_usage from anon,authenticated;
grant select,insert,update,delete on public.encore_api_usage to service_role;
create or replace function public.encore_reserve_api_call(p_uid uuid,p_kind text,p_limit integer)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare n integer;
begin
 if p_uid is null or p_limit not between 1 and 60
   or p_kind not in ('ticketek','ticketmaster','setlists','import-event','spotify-track')
 then return false; end if;
 insert into public.encore_api_usage(user_id,window_start,endpoint,hits)
 values(p_uid,date_trunc('minute',now()),p_kind,1)
 on conflict(user_id,window_start,endpoint) do update
 set hits=public.encore_api_usage.hits+1
 where public.encore_api_usage.hits < p_limit
 returning hits into n;
 return n is not null;
end;
$$;
revoke all on function public.encore_reserve_api_call(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.encore_reserve_api_call(uuid,text,integer) to service_role;
