-- Add structured happy-hour deals (item + price list) to venues.
-- Time windows continue to use the existing happy_hour_windows jsonb column.
alter table public.venues
  add column if not exists happy_hour_menu jsonb;
