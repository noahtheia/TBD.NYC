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
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
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

// Google primaryType (machine) -> a clean cuisine label.
const CUISINE_MAP = {
  american_restaurant: "American",
  italian_restaurant: "Italian",
  french_restaurant: "French",
  chinese_restaurant: "Chinese",
  japanese_restaurant: "Japanese",
  sushi_restaurant: "Sushi",
  ramen_restaurant: "Ramen",
  korean_restaurant: "Korean",
  mexican_restaurant: "Mexican",
  thai_restaurant: "Thai",
  indian_restaurant: "Indian",
  vietnamese_restaurant: "Vietnamese",
  mediterranean_restaurant: "Mediterranean",
  greek_restaurant: "Greek",
  spanish_restaurant: "Spanish",
  middle_eastern_restaurant: "Middle Eastern",
  lebanese_restaurant: "Lebanese",
  turkish_restaurant: "Turkish",
  seafood_restaurant: "Seafood",
  steak_house: "Steakhouse",
  pizza_restaurant: "Pizza",
  hamburger_restaurant: "Burgers",
  barbecue_restaurant: "Barbecue",
  brazilian_restaurant: "Brazilian",
  vegetarian_restaurant: "Vegetarian",
  vegan_restaurant: "Vegan",
  breakfast_restaurant: "Breakfast",
  brunch_restaurant: "Brunch",
  sandwich_shop: "Sandwiches",
  bakery: "Bakery",
  cafe: "Cafe",
  fine_dining_restaurant: "Fine Dining",
  diner: "Diner",
};

const GENERIC_CUISINE = new Set([
  "",
  "Restaurant",
  "Food",
  "Store",
  "Point Of Interest",
  "Establishment",
  "Bar",
]);

function cleanCuisineLabel(text) {
  if (!text) return null;
  let s = text.replace(/\s+Restaurant$/i, "").trim();
  const synonyms = { "Steak House": "Steakhouse", Hamburger: "Burgers", "Barbecue": "Barbecue" };
  s = synonyms[s] || s;
  return GENERIC_CUISINE.has(s) ? null : s;
}

/** Best-effort cuisine label(s) for a restaurant place. */
export function googleCuisine(place) {
  if (!place) return [];
  const primary = place.primaryType;
  if (primary && CUISINE_MAP[primary]) return [CUISINE_MAP[primary]];
  // scan secondary types for a known cuisine
  for (const t of place.types || []) {
    if (CUISINE_MAP[t]) return [CUISINE_MAP[t]];
  }
  const cleaned = cleanCuisineLabel(place.primaryTypeDisplayName?.text);
  return cleaned ? [cleaned] : [];
}
