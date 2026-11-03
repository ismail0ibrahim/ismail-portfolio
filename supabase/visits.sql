-- Run once in the Supabase SQL editor.
-- Reads require a signed-in user with this exact email.
-- The public anon key can add a visit, and cannot read, edit, or delete visits.

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  country text not null default '',
  country_code text not null default '',
  city text not null default '',
  region text not null default '',
  referrer text not null default '',
  page text not null default '',
  language text not null default '',
  device text not null default '',
  browser text not null default '',
  visitor_key text not null default '',
  constraint visits_country_len check (char_length(country) <= 80),
  constraint visits_country_code check (country_code = '' or country_code ~ '^[A-Z]{2}$'),
  constraint visits_city_len check (char_length(city) <= 80),
  constraint visits_region_len check (char_length(region) <= 80),
  constraint visits_referrer check (referrer = '' or referrer ~ '^https?://[a-z0-9.-]{1,253}$'),
  constraint visits_page check (char_length(page) <= 120 and page ~ '^/[A-Za-z0-9._/-]*$' and position('..' in page) = 0),
  constraint visits_language check (language in ('en', 'de', 'es', 'it', 'tr', 'ru', 'zh', 'ar')),
  constraint visits_device check (device in ('Mobile', 'Desktop')),
  constraint visits_browser check (browser in ('Edge', 'Chrome', 'Firefox', 'Safari', 'Other')),
  constraint visits_visitor_key check (visitor_key ~ '^[a-f0-9]{12}$')
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);

alter table public.visits enable row level security;

revoke all on table public.visits from public, anon, authenticated;
grant insert on table public.visits to anon;
grant select on table public.visits to authenticated;

do $$
declare
  seq text;
begin
  seq := pg_get_serial_sequence('public.visits', 'id');
  if seq is not null then
    execute format('revoke all on sequence %s from public, anon, authenticated', seq);
    execute format('grant usage, select on sequence %s to anon', seq);
  end if;
end
$$;

drop policy if exists visits_insert on public.visits;
create policy visits_insert on public.visits
  for insert
  to anon
  with check (true);

drop policy if exists visits_select on public.visits;
create policy visits_select on public.visits
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'ismailofficialibrahim@gmail.com');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon;

create or replace function private.guard_visit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recent_count integer;
begin
  new.created_at := now();

  if exists (
    select 1
    from public.visits
    where visitor_key = new.visitor_key
      and created_at > now() - interval '30 minutes'
  ) then
    return null;
  end if;

  select count(*)
    into recent_count
  from public.visits
  where created_at > now() - interval '1 minute';

  if recent_count >= 8 then
    raise exception 'visit rate limited'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_visit() from public, anon, authenticated;
grant execute on function private.guard_visit() to anon;

drop function if exists public.guard_visit();

drop trigger if exists visits_guard on public.visits;
create trigger visits_guard
  before insert on public.visits
  for each row
  execute function private.guard_visit();
