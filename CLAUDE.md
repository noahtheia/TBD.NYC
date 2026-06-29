# CLAUDE.md

Working notes for this repo (TBD.NYC — an interactive map of NYC bars & happy hours).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · Mapbox GL
(react-map-gl) + supercluster · Supabase (optional) with a `data/venues.json` fallback.

## Verify loop (run before every commit)

```bash
npm run lint        # eslint (flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest (pure-logic units)
npm run build       # next build (no secrets needed — falls back to data/venues.json)
```

CI (`.github/workflows/ci.yml`) runs all four on push + PR.

### Runtime smoke testing gotcha

`npm start` spawns a detached `next-server` child. `kill`-ing the `npm`/`next start`
wrapper does **not** stop it, so a stale build can keep serving on :3000 and silently
poison your next test (same ETag across runs is the tell). Kill the actual process:

```bash
kill "$(ps -eo pid,args | grep next-server | grep -v grep | awk '{print $1}' | head -1)"
```

## Architecture

- `app/` — routes. Home (`/`) renders the client `ExploreView`. SSR/SSG: `/venue/[id]`
  (+ JSON-LD + per-venue OG image), `/neighborhood/[slug]`, `/cuisine/[slug]`,
  `/happy-hour`, `sitemap.ts`, `robots.ts`, `manifest.ts`. `/api/venue/[id]` returns the
  full venue for the drawer. Admin under `/admin` (server actions in `actions.ts`).
- `lib/` — pure logic (tested): `filtering`, `sort`, `facets`, `hours`, `geo`, `url-state`,
  `jsonld`, `slug`. Plus `venues` (data load + `getVenuesLite`), `site` (canonical URL),
  `favorites`/`toast` (external stores), `rate-limit`, `useFocusTrap`.
- The home page ships a **lite** catalog (`getVenuesLite`); the drawer fetches the full
  record from `/api/venue/[id]` on open. Keep detail-only fields out of the lite shape.
- `data/venues.json` is **generated** — never edit by hand. Regenerate with
  `npm run build:data` (needs `GOOGLE_PLACES_API_KEY` + `NEXT_PUBLIC_MAPBOX_TOKEN`).

## Conventions

- Reuse: `filterVenues`/`computeFacets`/`sortVenues`, `happyHourStatus`, `priceLabel`,
  `cn`, the `VenueDrawer` bottom-sheet pattern, the `Wordmark` lockup.
- Brand (tokens in `app/globals.css` `@theme`): **Blaze** `#D9790C` golden-amber accent
  (`bg-blaze`, hover `bg-ember` `#C2640C`), **Marquee** `#FFB400` for happy hour,
  **Ink**/**Newsprint**/**Cream**
  surfaces, on a warm zinc neutral base. Type voices: `font-display` (Archivo) headlines,
  Inter body, `font-mono` (Space Mono) tags/eyebrows, `font-serif` (Fraunces) italic blurbs.
  Keep functional status colors: emerald = open now, sky = near me. Archivo is loaded at
  weights 600/800/900 — use `font-semibold`/`font-extrabold`/`font-black` with `font-display`.
- ESLint's react-hooks rules here forbid **setState in an effect body** and **reading/
  writing a ref during render** — derive during render or reset via a `key` instead.
- Client islands (e.g. `FavoriteButton`) keep server components (the venue page) SSR'd.

## Env / security

- `NEXT_PUBLIC_SITE_URL` is **required in production** (canonical/OG/sitemap); `lib/site.ts`
  warns loudly and falls back to localhost otherwise.
- Admin: `ADMIN_PASSWORD` gates `/admin` (HMAC-signed cookie, `timingSafeEqual`). Login +
  Google-enrich actions are rate-limited (`lib/rate-limit.ts`, per instance).
- `GOOGLE_PLACES_API_KEY` is build/server-time only — never shipped to the browser.
- Security headers + `poweredByHeader: false` live in `next.config.ts`. A tightened CSP
  (Mapbox/Supabase/image hosts) is a sensible next step.
