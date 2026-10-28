-- find the runners: run this once in the Supabase SQL editor.
-- Everything is public read + insert only; nothing can be edited or deleted from the site.
-- Reads are scoped to one group: the site sends the group code in an `x-group-code`
-- header, so someone without the link can't list other groups' runners or photos.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]{6,16}$'),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists runners (
  id uuid primary key default gen_random_uuid(),
  group_code text not null references groups (code) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 40),
  bib text check (bib ~ '^[0-9A-Za-z]{1,10}$'),
  gun_time timestamptz not null check (gun_time between '2026-11-01T05:00:00-05:00' and '2026-11-01T15:00:00-05:00'),
  corral_delay_min integer not null default 0 check (corral_delay_min between 0 and 60),
  pace_fast integer not null check (pace_fast between 180 and 1500),
  pace_goal integer not null check (pace_goal between 180 and 1500),
  pace_slow integer not null check (pace_slow between 180 and 1500),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (group_code, slug)
);

create table if not exists sightings (
  id uuid primary key default gen_random_uuid(),
  group_code text not null references groups (code) on delete cascade,
  runner_slug text not null check (runner_slug ~ '^[a-z0-9-]{1,40}$'),
  spot_id text not null check (char_length(spot_id) between 1 and 60),
  mile numeric not null check (mile >= 0 and mile <= 26.3),
  seen_at timestamptz not null,
  name text not null check (char_length(name) between 1 and 40),
  photo_url text check (char_length(photo_url) <= 500 and photo_url ~ '^https://'),
  created_at timestamptz not null default now(),
  foreign key (group_code, runner_slug) references runners (group_code, slug) on delete cascade
);

create index if not exists runners_group_idx on runners (group_code, created_at desc);
create index if not exists sightings_group_idx on sightings (group_code, created_at desc);

-- The group code the request was made for (empty when the header is missing).
create or replace function request_group_code() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-group-code', '')
$$;

alter table groups enable row level security;
alter table runners enable row level security;
alter table sightings enable row level security;

drop policy if exists "read own group" on groups;
drop policy if exists "create group" on groups;
drop policy if exists "read own group" on runners;
drop policy if exists "add runner" on runners;
drop policy if exists "read own group" on sightings;
drop policy if exists "add sighting" on sightings;

create policy "read own group" on groups for select using (code = request_group_code());
create policy "create group" on groups for insert with check (code = request_group_code());
create policy "read own group" on runners for select using (group_code = request_group_code());
create policy "add runner" on runners for insert with check (group_code = request_group_code());
create policy "read own group" on sightings for select using (group_code = request_group_code());
create policy "add sighting" on sightings for insert
  with check (group_code = request_group_code() and seen_at <= now() + interval '5 minutes');

grant select, insert on groups, runners, sightings to anon, authenticated;
revoke update, delete on groups, runners, sightings from anon, authenticated;

-- Photos: public read by URL, JPEG uploads up to 2 MB, filed under the group code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

drop policy if exists "upload jpeg photos" on storage.objects;
create policy "upload jpeg photos" on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = request_group_code()
    and lower(storage.extension(name)) = 'jpg'
  );
