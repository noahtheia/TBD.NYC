# TBD.NYC — NYC Bars & Happy Hours

An interactive, two-pane map of curated New York City bars and happy hours.
Browse a scrollable list of venues on the left and an interactive Mapbox map on
the right — hover to highlight, click for full details. Filter by happy hour,
neighborhood, venue type, and reservation policy, or search by name.

Directionally inspired by Resy's "Restaurants near New York" view and The
Infatuation's neighborhood guides.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Mapbox GL** via **react-map-gl v8**

## Features

- Two-pane explore view (venue list + interactive map), responsive to a
  list/map toggle on mobile
- **Map ⇄ list sync**: hovering a card highlights its pin and vice-versa;
  clicking flies the map to the venue and opens its details
- **Filters**: happy hour, neighborhood, venue type, reservations vs walk-in —
  applied to both the list and the map
- **Search** across venue name, type, and neighborhood
- **Detail view**: a slide-over drawer plus a shareable, statically-generated
  `/venue/[id]` page (with booking, menu, website, Instagram, and directions links)
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
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Data

The venue data lives in `data/venues.json` and is **generated** from the source
spreadsheet — do not edit it by hand.

- `data/source/HH_Bar_Restaurant_Information.xlsx` — the original spreadsheet
- `data/source/bars.raw.json` — a parsed snapshot of the spreadsheet's Bars sheet
- `scripts/build-data.mjs` — normalizes the raw rows (types, reservations, happy
  hour, links) and **geocodes** each address via the Mapbox Geocoding API,
  writing `data/venues.json`
- `scripts/geocode-cache.json` — committed cache of geocoding results, so re-runs
  are stable and don't re-hit the API

Regenerate the data with:
```bash
npm run build:data   # node --env-file=.env.local scripts/build-data.mjs
```

### Current scope

Of the source spreadsheet, **97 bars have complete details including a street
address** and are mapped here. Names-only bars and the restaurants sheet (no
addresses) are out of scope until location data is available — the `Venue`
schema (`types/venue.ts`) leaves room to add them. The data has no cuisine,
price, rating, or photo columns, so filters are based on the available fields
(happy hour, neighborhood, type, reservations).

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
| `npm run build:data` | Regenerate `data/venues.json` from the spreadsheet (geocodes via Mapbox) |
