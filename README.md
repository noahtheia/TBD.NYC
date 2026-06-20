# TBD.NYC — NYC Bars & Happy Hours

An interactive, two-pane map of ~500 curated New York City bars and restaurants.
Browse a scrollable list of venues on the left and an interactive Mapbox map on
the right — hover to highlight, click for full details. Filter by open-now,
happy hour, open-late, category, neighborhood, type, price, and reservations, or
search by name.

Directionally inspired by Resy's "Restaurants near New York" view and The
Infatuation's neighborhood guides.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Mapbox GL** via **react-map-gl v8**

## Features

- Two-pane explore view (venue list + interactive map), responsive to a
  list/map toggle on mobile
- **Clustered map ⇄ list sync**: pins cluster at low zoom and expand on
  zoom-in; hovering a card highlights its pin and vice-versa; clicking flies the
  map to the venue and opens its details. Bars and restaurants use distinct pins.
- **Structured hours** (from Google Places): an **Open now** badge + filter, an
  **Open late** filter, a live "Open · until 2 AM / Closed · opens 5 PM" status,
  and a Mon–Sun hours table in the detail view
- **Happy-hour now** status from structured happy-hour windows
- **Ratings & price** (★ and $–$$$$) from Google, shown on cards and details
- **Multi-location venues**: a pin per location, with per-location hours
- **Filters**: open now, happy hour, open late, category (bars/restaurants),
  neighborhood, **cuisine**, type, price, reservations — applied to both list and
  map, with active filter chips and per-option counts
- **Sort & Near me**: sort by rating / price / distance, with browser geolocation
  ("near me") showing distances and a "you are here" marker
- **Search** across venue name, cuisine, type, and neighborhood
- Map auto-fits to filtered results; shared `?venue=` links open focused; a mobile
  bottom-sheet peek appears when tapping a pin
- An **Unverified** chip flags name-matched restaurants; a "data updated" stamp
- **Detail view**: a slide-over drawer plus a shareable, statically-generated
  `/venue/[id]` page (booking, menu, website, Instagram, directions)
- **Venue photos**: scraped from each site's Open Graph image at build time, with
  a graceful gradient fallback
- **Share button** + Open Graph metadata and a generated social image for nice
  link previews
- Filters/search/open-venue are mirrored to the URL for shareable links
- Graceful fallback when no Mapbox token is configured (list stays fully usable)

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add a Mapbox token. Copy `.env.example` to `.env.local` and set a public
   token (`pk.…`) from https://account.mapbox.com/access-tokens/:
   ```bash
   cp .env.example .env.local
   # then edit .env.local:
   # NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
   ```
   Tip: restrict the token to your domain(s) in the Mapbox dashboard.
   (Only the Mapbox token is needed to *run* the app — `data/venues.json` is
   already generated. `GOOGLE_PLACES_API_KEY` is only needed to regenerate data.)
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Data

The venue data lives in `data/venues.json` and is **generated** — do not edit it
by hand. It contains **~506 venues** (97 bars + 409 restaurants) enriched via the
Google Places API for standardized hours, location, rating, and price.

- `data/source/HH_Bar_Restaurant_Information.xlsx` — the original spreadsheet
- `data/source/bars.raw.json` / `restaurants.raw.json` — parsed snapshots of the
  two sheets
- `scripts/build-data.mjs` — the pipeline: parses the snapshots, resolves each
  venue via **Google Places (New) Text Search** (restricted to NYC), maps the
  structured `regularOpeningHours`, address, coordinates, rating, and price level,
  reverse-geocodes the **neighborhood** via Mapbox, parses **happy-hour windows**
  (`scripts/parse-happy-hour.mjs`), and scrapes each site's `og:image` for photos
- `scripts/places.mjs` — Google Places helper + converters
- `scripts/places-cache.json` / `geocode-cache.json` / `og-cache.json` — committed
  caches, so rebuilds are deterministic and don't re-hit the APIs

Regenerate the data (needs `GOOGLE_PLACES_API_KEY` + `NEXT_PUBLIC_MAPBOX_TOKEN`):
```bash
npm run build:data   # node --env-file=.env.local scripts/build-data.mjs
```
`GOOGLE_PLACES_API_KEY` is **build-time only** — results are baked into
`data/venues.json`, so the key is never shipped to the browser or committed.

### Notes

- Bars come from the curated spreadsheet (happy hour, reservations, booking, menu,
  Instagram) enriched with Google location/hours/rating/price.
- Restaurants are resolved from names via Google Places with a confidence gate;
  low-confidence matches are skipped (15 of 424). They have no happy-hour /
  reservation data.
- ~8 venues have multiple locations (e.g. Talea, Apotheke) — each is a pin.

## Project structure

```
app/                 # Next.js App Router (home + /venue/[id])
components/
  ExploreView.tsx    # client orchestrator: owns shared state + layout
  map/               # MapView (react-map-gl), markers, fallback
  list/              # VenueList, VenueCard
  filters/           # FilterBar, SearchBar
  detail/            # VenueDrawer + shared VenueDetailContent
  ui/                # MultiSelect dropdown
hooks/               # useExploreState (URL-backed), useDebouncedValue
lib/                 # filtering, facets, venues loader, url-state, map-config
types/venue.ts       # Venue / Facets / Filters
data/                # venues.json (generated) + source spreadsheet/snapshot
scripts/build-data.mjs
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the unit tests (vitest): hours, filtering, happy-hour parser |
| `npm run build:data` | Regenerate `data/venues.json` (Google Places + Mapbox) |
