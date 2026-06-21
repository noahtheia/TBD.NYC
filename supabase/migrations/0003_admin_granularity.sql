-- Admin granularity: structured amenities + a photo gallery on venues.
-- Editorial fields managed in the admin — never overwritten by the seed pipeline.
-- (Per-location hours/extra locations need no new columns: venue_locations
--  already has hours jsonb, approx_location, place_id and position.)
alter table public.venues
  add column if not exists amenities text[] not null default '{}';

alter table public.venues
  add column if not exists photos jsonb; -- gallery: {url, caption?}[]
