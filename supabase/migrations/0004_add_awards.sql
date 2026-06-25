-- Awards / recognitions filter: a curated, faceted, admin-editable venue field
-- (Michelin Star/Bib Gourmand/Guide, World's & North America's 50 Best Bars,
--  James Beard Award, Eater 38). See lib/awards.ts for the canonical vocabulary.
-- Editorial — managed in the admin, never overwritten by the seed pipeline.
-- Untagged venues fall back to the committed data/awards.json overlay.
alter table public.venues
  add column if not exists awards text[] not null default '{}';
