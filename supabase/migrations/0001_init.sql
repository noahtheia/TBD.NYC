-- TBD.NYC — Supabase schema (Postgres + PostGIS).
-- Apply once via the Supabase Studio SQL editor (or `supabase db push`).

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- venues
-- ---------------------------------------------------------------------------
create table if not exists public.venues (
  id text primary key,
  name text not null,
  category text not null check (category in ('bar', 'restaurant')),
  types text[] not null default '{}',
  cuisines text[] not null default '{}',
  neighborhood text,
  rating numeric,
  user_rating_count int,
  price_level int check (price_level between 1 and 4),
  happy_hour boolean,
  happy_hour_details text,
  happy_hour_windows jsonb,
  reservation_policy text not null default 'unknown',
  reservation_raw text,
  booking jsonb,
  menu_url text,
  website text,
  instagram text,
  google_maps_uri text,
  photo_url text,
  other_info text,
  unverified boolean not null default false,
  -- Editorial / manual fields — never overwritten by the seed pipeline.
  editorial_note text,
  featured boolean not null default false,
  source text not null default 'sync', -- 'sync' | 'manual'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- venue_locations (1..n per venue)
-- ---------------------------------------------------------------------------
create table if not exists public.venue_locations (
  id bigint generated always as identity primary key,
  venue_id text not null references public.venues(id) on delete cascade,
  position int not null default 0,
  address text not null,
  neighborhood text,
  borough text,
  lat double precision not null,
  lng double precision not null,
  geog geography(Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  place_id text,
  hours jsonb,
  approx_location boolean not null default false
);

create index if not exists venue_locations_venue_id_idx on public.venue_locations (venue_id);
create index if not exists venue_locations_geog_idx on public.venue_locations using gist (geog);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: public read; writes only via service role (bypasses RLS).
-- ---------------------------------------------------------------------------
alter table public.venues enable row level security;
alter table public.venue_locations enable row level security;

drop policy if exists "public read venues" on public.venues;
create policy "public read venues" on public.venues for select using (true);

drop policy if exists "public read venue_locations" on public.venue_locations;
create policy "public read venue_locations" on public.venue_locations for select using (true);
