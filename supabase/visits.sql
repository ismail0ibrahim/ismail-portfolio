-- Safe to run again. New columns are added without deleting old visits.
-- Reads require a signed-in user with this exact email.
-- The public anon key can add a visit, and cannot read, edit, or delete visits.
-- Browsers do not expose a MAC address, so it is not collected.

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
  ip text not null default '',
  latitude numeric,
  longitude numeric,
  timezone text not null default '',
  isp text not null default '',
  asn text not null default '',
  accuracy_km integer,
  os text not null default '',
  os_version text not null default '',
  architecture text not null default '',
  model text not null default '',
  screen text not null default '',
  browser_version text not null default '',
  browser_language text not null default '',
  constraint visits_country_len check (char_length(country) <= 80),
  constraint visits_country_code check (country_code = '' or country_code ~ '^[A-Z]{2}$'),
  constraint visits_city_len check (char_length(city) <= 80),
  constraint visits_region_len check (char_length(region) <= 80),
  constraint visits_referrer check (referrer = '' or referrer ~ '^https?://[a-z0-9.-]{1,253}$'),
  constraint visits_page check (char_length(page) <= 120 and page ~ '^/[A-Za-z0-9._/-]*$' and position('..' in page) = 0),
  constraint visits_language check (language in ('en', 'de', 'es', 'it', 'tr', 'ru', 'zh', 'ar')),
  constraint visits_device check (device in ('Mobile', 'Desktop')),
  constraint visits_browser check (browser in ('Edge', 'Chrome', 'Firefox', 'Safari', 'Other')),
  constraint visits_visitor_key check (visitor_key ~ '^[a-f0-9]{12}$'),
  constraint visits_ip_check check (
    ip = ''
    or (
      char_length(ip) <= 45
      and (
        ip ~ '^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$'
        or (position(':' in ip) > 0 and ip ~ '^[0-9a-f:.]{2,45}$' and position('..' in ip) = 0)
      )
    )
  ),
  constraint visits_latitude_check check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint visits_longitude_check check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint visits_timezone_check check (
    timezone = ''
    or timezone ~ '^[A-Za-z][A-Za-z0-9_+-]{0,63}(/[A-Za-z0-9_+-]{1,64}){0,2}$'
  ),
  constraint visits_isp_len check (char_length(isp) <= 120),
  constraint visits_asn_check check (asn = '' or asn ~ '^[0-9]{1,10}$'),
  constraint visits_accuracy_check check (accuracy_km is null or (accuracy_km >= 0 and accuracy_km <= 20000)),
  constraint visits_os_check check (os in ('', 'Windows', 'macOS', 'Android', 'iOS', 'Linux', 'ChromeOS', 'Other')),
  constraint visits_os_version_check check (os_version = '' or os_version ~ '^[A-Za-z0-9._+-]{1,40}$'),
  constraint visits_architecture_check check (architecture in ('', 'x86', 'arm', 'arm64')),
  constraint visits_model_len check (char_length(model) <= 80),
  constraint visits_screen_check check (screen = '' or screen ~ '^[0-9]{2,5}x[0-9]{2,5}$'),
  constraint visits_browser_version_check check (
    browser_version = ''
    or (char_length(browser_version) <= 20 and browser_version ~ '^[0-9]+(\.[0-9]+){0,3}$')
  ),
  constraint visits_browser_language_check check (
    browser_language = ''
    or browser_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$'
  )
);

alter table public.visits
  add column if not exists ip text not null default '',
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists timezone text not null default '',
  add column if not exists isp text not null default '',
  add column if not exists asn text not null default '',
  add column if not exists accuracy_km integer,
  add column if not exists os text not null default '',
  add column if not exists os_version text not null default '',
  add column if not exists architecture text not null default '',
  add column if not exists model text not null default '',
  add column if not exists screen text not null default '',
  add column if not exists browser_version text not null default '',
  add column if not exists browser_language text not null default '';

alter table public.visits drop constraint if exists visits_ip_check;
alter table public.visits add constraint visits_ip_check check (
  ip = ''
  or (
    char_length(ip) <= 45
    and (
      ip ~ '^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$'
      or (position(':' in ip) > 0 and ip ~ '^[0-9a-f:.]{2,45}$' and position('..' in ip) = 0)
    )
  )
);
alter table public.visits drop constraint if exists visits_latitude_check;
alter table public.visits add constraint visits_latitude_check check (latitude is null or (latitude >= -90 and latitude <= 90));
alter table public.visits drop constraint if exists visits_longitude_check;
alter table public.visits add constraint visits_longitude_check check (longitude is null or (longitude >= -180 and longitude <= 180));
alter table public.visits drop constraint if exists visits_timezone_check;
alter table public.visits add constraint visits_timezone_check check (
  timezone = ''
  or timezone ~ '^[A-Za-z][A-Za-z0-9_+-]{0,63}(/[A-Za-z0-9_+-]{1,64}){0,2}$'
);
alter table public.visits drop constraint if exists visits_isp_len;
alter table public.visits add constraint visits_isp_len check (char_length(isp) <= 120);
alter table public.visits drop constraint if exists visits_asn_check;
alter table public.visits add constraint visits_asn_check check (asn = '' or asn ~ '^[0-9]{1,10}$');
alter table public.visits drop constraint if exists visits_accuracy_check;
alter table public.visits add constraint visits_accuracy_check check (accuracy_km is null or (accuracy_km >= 0 and accuracy_km <= 20000));
alter table public.visits drop constraint if exists visits_os_check;
alter table public.visits add constraint visits_os_check check (os in ('', 'Windows', 'macOS', 'Android', 'iOS', 'Linux', 'ChromeOS', 'Other'));
alter table public.visits drop constraint if exists visits_os_version_check;
alter table public.visits add constraint visits_os_version_check check (os_version = '' or os_version ~ '^[A-Za-z0-9._+-]{1,40}$');
alter table public.visits drop constraint if exists visits_architecture_check;
alter table public.visits add constraint visits_architecture_check check (architecture in ('', 'x86', 'arm', 'arm64'));
alter table public.visits drop constraint if exists visits_model_len;
alter table public.visits add constraint visits_model_len check (char_length(model) <= 80);
alter table public.visits drop constraint if exists visits_screen_check;
alter table public.visits add constraint visits_screen_check check (screen = '' or screen ~ '^[0-9]{2,5}x[0-9]{2,5}$');
alter table public.visits drop constraint if exists visits_browser_version_check;
alter table public.visits add constraint visits_browser_version_check check (
  browser_version = ''
  or (char_length(browser_version) <= 20 and browser_version ~ '^[0-9]+(\.[0-9]+){0,3}$')
);
alter table public.visits drop constraint if exists visits_browser_language_check;
alter table public.visits add constraint visits_browser_language_check check (
  browser_language = ''
  or browser_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$'
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
