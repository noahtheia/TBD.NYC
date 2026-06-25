-- TBD.NYC — blog posts + editor's picks.
-- Apply once via the Supabase Studio SQL editor (after 0001_init.sql).

-- ---------------------------------------------------------------------------
-- posts (admin-authored blog articles)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id text primary key,                       -- slug, used as the /blog/[slug] route
  title text not null,
  excerpt text,
  body text not null,                        -- markdown
  cover_image_url text,
  tags text[] not null default '{}',
  author text,
  published boolean not null default false,
  published_at timestamptz,
  related_venue_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (published, published_at desc);

-- ---------------------------------------------------------------------------
-- editor_picks (curated, ordered venue highlights for the homepage)
-- ---------------------------------------------------------------------------
create table if not exists public.editor_picks (
  id text primary key,
  venue_id text not null references public.venues(id) on delete cascade,
  headline text,
  blurb text,
  position int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editor_picks_position_idx on public.editor_picks (position);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse public.set_updated_at() from 0001_init.sql)
-- ---------------------------------------------------------------------------
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists editor_picks_set_updated_at on public.editor_picks;
create trigger editor_picks_set_updated_at
  before update on public.editor_picks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: public reads published/visible rows; writes via service role.
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.editor_picks enable row level security;

drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts for select using (published = true);

drop policy if exists "public read visible picks" on public.editor_picks;
create policy "public read visible picks" on public.editor_picks for select using (visible = true);
