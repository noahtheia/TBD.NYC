// Google Places API (New) helper for the data build. One Text Search call per
// query (full field mask) returns location + structured hours + rating + price.
// Results are cached on disk so rebuilds are free and deterministic.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, "places-cache.json");

const KEY = process.env.GOOGLE_PLACES_API_KEY;

// NYC bounding rectangle (from Google's own docs example).
const NYC_RECT = {
  low: { latitude: 40.477398, longitude: -74.259087 },
  high: { latitude: 40.91618, longitude: -73.70018 },
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.regularOpeningHours",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.addressComponents",
  "places.types",
  "places.primaryTypeDisplayName",
].join(",");

const cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, "utf8"))
  : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Text Search (New). Returns the top matching place (full fields) or null. Cached by query. */
export async function searchPlace(query) {
  if (query in cache) return cache[query];
  let result = null;
  for (let attempt = 0; attempt < 2 && result === null; attempt++) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          locationRestriction: { rectangle: NYC_RECT },
          maxResultCount: 1,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      result = json.places?.[0] ?? false; // false = searched, no match (cache it)
    } catch (err) {
      if (attempt === 1) {
        console.warn(`  ! places search failed for "${query}": ${err.message}`);
        result = false;
      } else {
        await sleep(400);
      }
    }
  }
  cache[query] = result;
  return result;
}

export function flushPlacesCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

export function placesCacheSize() {
  return Object.keys(cache).length;
}

// --- Converters -----------------------------------------------------------

/** Google regularOpeningHours -> our OpeningHours ({periods, weekdayText, open24}). */
export function convertOpeningHours(g) {
  if (!g) return undefined;
  const periods = g.periods ?? [];
  // 24/7: a single period with an open at Sun 00:00 and no close.
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    return { periods: [], weekdayText: g.weekdayDescriptions, open24: true };
  }
  const out = [];
  for (const p of periods) {
    if (!p.open || !p.close) continue;
    out.push({
      openDay: p.open.day,
      openMin: (p.open.hour ?? 0) * 60 + (p.open.minute ?? 0),
      closeDay: p.close.day,
      closeMin: (p.close.hour ?? 0) * 60 + (p.close.minute ?? 0),
    });
  }
  if (!out.length && !g.weekdayDescriptions?.length) return undefined;
  return { periods: out, weekdayText: g.weekdayDescriptions };
}

const PRICE_MAP = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
export function mapPriceLevel(g) {
  return g ? PRICE_MAP[g] : undefined;
}

function component(components, type) {
  return components?.find((c) => c.types?.includes(type));
}

/** Best-effort neighborhood from Google address components (may be absent). */
export function googleNeighborhood(components) {
  return (
    component(components, "neighborhood")?.longText ||
    component(components, "sublocality_level_2")?.longText ||
    undefined
  );
}

/** Borough: sublocality_level_1 in NYC (Manhattan/Brooklyn/Queens/...). */
export function googleBorough(components) {
  return (
    component(components, "sublocality_level_1")?.longText ||
    component(components, "locality")?.longText ||
    undefined
  );
}
