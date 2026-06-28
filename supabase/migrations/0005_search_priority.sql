-- TBD.NYC — home-search suggestion priority.
-- Apply once via the Supabase Studio SQL editor (after 0002_posts_picks.sql).

-- ---------------------------------------------------------------------------
-- search_priority (admin-configured order + on/off for hero-search groups)
-- One row per "kind": Filter, Category, Neighborhood, Cuisine, Award, Type,
-- Bar, Restaurant. The known set lives in code (lib/search-kinds.ts); this
-- table only stores position/enabled overrides and is merged with the defaults
-- on read, so it may be empty or partial.
-- ---------------------------------------------------------------------------
create table if not exists public.search_priority (
  kind text primary key,                     -- one of the known SearchKind values
  position int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_priority_position_idx on public.search_priority (position);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuse public.set_updated_at() from 0001_init.sql)
-- ---------------------------------------------------------------------------
drop trigger if exists search_priority_set_updated_at on public.search_priority;
create trigger search_priority_set_updated_at
  before update on public.search_priority
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: public may read all rows; writes go via the service role.
-- ---------------------------------------------------------------------------
alter table public.search_priority enable row level security;

drop policy if exists "public read search priority" on public.search_priority;
create policy "public read search priority" on public.search_priority for select using (true);
