// Builds data/venues.json by enriching the spreadsheet venues with Google Places.
//
//   - Bars: spreadsheet fields (happy hour, reservations, booking, menu, IG) +
//     Google Places (location, structured hours, rating, price) per address.
//   - Restaurants: names-only -> resolved via Google Places (location, hours,
//     rating, price, type) with a confidence gate.
//   - Neighborhood from Mapbox reverse geocoding (consistent NYC names).
//   - Photos from website og:image. Everything cached for free rebuilds.
//
// Run:  node --env-file=.env.local scripts/build-data.mjs   (npm run build:data)
// Requires GOOGLE_PLACES_API_KEY and NEXT_PUBLIC_MAPBOX_TOKEN.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  searchPlace,
  flushPlacesCache,
  placesCacheSize,
  convertOpeningHours,
  mapPriceLevel,
  googleNeighborhood,
  googleBorough,
} from "./places.mjs";
import { parseHappyHourWindows } from "./parse-happy-hour.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BARS_PATH = join(ROOT, "data", "source", "bars.raw.json");
const RESTAURANTS_PATH = join(ROOT, "data", "source", "restaurants.raw.json");
const GEO_CACHE_PATH = join(__dirname, "geocode-cache.json");
const OG_CACHE_PATH = join(__dirname, "og-cache.json");
const OUT_PATH = join(ROOT, "data", "venues.json");

const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!process.env.GOOGLE_PLACES_API_KEY || !MAPBOX) {
  console.error("Missing GOOGLE_PLACES_API_KEY and/or NEXT_PUBLIC_MAPBOX_TOKEN.");
  process.exit(1);
}

// --- Concurrency pool -----------------------------------------------------
async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// --- Type normalization (bars) -------------------------------------------
const TYPE_CANON = {
  bar: "Bar", "cocktail bar": "Cocktail Bar", cocktail: "Cocktail Bar",
  "cocktail lounge": "Cocktail Bar", "wine bar": "Wine Bar", wine: "Wine Bar",
  "natural wine bar": "Wine Bar", "natural wine": "Wine Bar",
  restaurant: "Restaurant", restuarant: "Restaurant", resturant: "Restaurant",
  piano: "Piano Bar", brewery: "Brewery", "beer garden": "Beer Garden",
  "beer hall": "Beer Hall", taproom: "Taproom", speakeasy: "Speakeasy",
  "speakeasy bar": "Speakeasy", rooftop: "Rooftop Bar", "rooftop bar": "Rooftop Bar",
  "hotel bar": "Hotel Bar", hotel: "Hotel Bar", cafe: "Cafe", "café": "Cafe",
  coffee: "Cafe", "coffee shop": "Cafe", "oyster bar": "Oyster Bar",
  "raw bar": "Oyster Bar", "sports bar": "Sports Bar", "dive bar": "Dive Bar",
  dive: "Dive Bar", lounge: "Lounge", pub: "Pub", gastropub: "Gastropub",
  "irish pub": "Pub", club: "Nightclub", nightclub: "Nightclub",
  "piano bar": "Piano Bar", "tiki bar": "Tiki Bar", tiki: "Tiki Bar",
  "karaoke bar": "Karaoke Bar", karaoke: "Karaoke Bar", bistro: "Restaurant",
};
const titleCase = (s) =>
  s.toLowerCase().split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
function normalizeTypes(raw) {
  if (!raw || !raw.trim()) return [];
  const out = [];
  for (const tok of raw.split(/\/\/|\/|,|&| and /gi).map((t) => t.trim()).filter(Boolean)) {
    const canon = TYPE_CANON[tok.toLowerCase().replace(/\s+/g, " ").trim()] || titleCase(tok);
    if (canon && !out.includes(canon)) out.push(canon);
  }
  return out;
}

// --- Other spreadsheet field helpers -------------------------------------
function classifyReservation(raw) {
  if (!raw || !raw.trim()) return { policy: "unknown", raw: undefined };
  const lc = raw.toLowerCase();
  const hasWalk = lc.includes("walk");
  const hasYes = /\byes\b/.test(lc) || lc.includes("reserv");
  let policy = "unknown";
  if (hasWalk && hasYes) policy = "mixed";
  else if (hasWalk) policy = "walk-in";
  else if (hasYes) policy = "reservations";
  return { policy, raw: raw.trim() };
}
function parseHappyHour(raw) {
  const t = (raw || "").trim().toLowerCase();
  if (!t) return null;
  if (t.startsWith("yes")) return true;
  if (t.startsWith("no")) return false;
  return null;
}
const URL_RE = /https?:\/\/[^\s,]+/i;
const firstUrl = (raw) => {
  const m = (raw || "").match(URL_RE);
  return m ? m[0].replace(/[.,;]+$/, "") : undefined;
};
function parseBooking(raw) {
  const url = firstUrl(raw);
  if (!url) return undefined;
  const lc = url.toLowerCase();
  let host = "other";
  if (lc.includes("resy")) host = "resy";
  else if (lc.includes("opentable")) host = "opentable";
  else if (lc.includes("tock")) host = "tock";
  return { url, host };
}
function slugify(name) {
  return name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// --- Location parsing (one or many addresses from the Locations field) ----
const STREET_SUFFIX =
  "St|Street|Ave|Avenue|Av|Blvd|Boulevard|Pl|Place|Rd|Road|Way|Sq|Square|Broadway|Bowery|Ln|Lane|Dr|Drive|Ct|Court|Ter|Terrace|Pkwy|Parkway|Plz|Plaza|Walk|Row";

function parseOneLocation(seg) {
  let s = seg.replace(/^\s*[A-Za-z][A-Za-z .'’/&-]*:\s*/, "").trim();
  const withZip = s.match(/\d+\b[\s\S]*?\b\d{5}/);
  if (withZip) return { query: withZip[0].trim(), address: s, approx: false };
  const street = new RegExp(`\\d{1,5}\\s+[\\w.'’\\s-]*?\\b(?:${STREET_SUFFIX})\\b\\.?`, "i");
  const m = s.match(street);
  if (m) return { query: `${m[0].trim()}, New York, NY`, address: s, approx: false };
  const firstSeg = s.split(",")[0].trim();
  return { query: `${firstSeg}, New York, NY`, address: firstSeg, approx: true };
}

function parseLocations(locations) {
  const line = locations.split(/\r?\n/)[0].trim();
  if (!/\d/.test(line)) {
    // No street numbers: treat as a neighborhood list (multi-location, approx).
    return line.split(",").map((s) => s.trim()).filter(Boolean)
      .map((seg) => ({ query: `${seg}, New York, NY`, address: seg, approx: true }));
  }
  const parts = line.split(/;/).map((s) => s.trim()).filter(Boolean);
  const segs = [];
  for (const part of parts) {
    // Split a run of labeled addresses: "A: addr  B: addr"
    segs.push(...part.split(/\s+(?=[A-Z][A-Za-z'’ ]{1,22}:\s)/).map((s) => s.trim()).filter(Boolean));
  }
  return segs.map(parseOneLocation);
}

// --- Caches: Mapbox geocoding + og:image ---------------------------------
const geoCache = existsSync(GEO_CACHE_PATH) ? JSON.parse(readFileSync(GEO_CACHE_PATH, "utf8")) : {};
const ogCache = existsSync(OG_CACHE_PATH) ? JSON.parse(readFileSync(OG_CACHE_PATH, "utf8")) : {};

async function reverseGeocodeNeighborhood(lat, lng) {
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (key in geoCache) return geoCache[key];
  let hood = null;
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${MAPBOX}&types=neighborhood,locality,place&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json();
      const ctx = j.features?.[0]?.properties?.context || {};
      hood = ctx.neighborhood?.name || ctx.locality?.name || ctx.place?.name || null;
    }
  } catch {
    /* ignore */
  }
  geoCache[key] = hood;
  return hood;
}

async function mapboxForward(query) {
  if (query in geoCache) return geoCache[query];
  let result = null;
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${MAPBOX}&country=us&limit=1&proximity=-73.98,40.74`;
    const res = await fetch(url);
    if (res.ok) {
      const feat = (await res.json()).features?.[0];
      if (feat) {
        const c = feat.properties.coordinates;
        const ctx = feat.properties.context || {};
        result = { lat: c.latitude, lng: c.longitude, neighborhood: ctx.neighborhood?.name || ctx.locality?.name || null };
      }
    }
  } catch {
    /* ignore */
  }
  geoCache[query] = result;
  return result;
}

function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      try {
        const abs = new URL(m[1].trim(), baseUrl).href;
        if (abs.startsWith("http")) return abs;
      } catch { /* ignore */ }
    }
  }
  return null;
}
async function fetchOgImage(website) {
  if (!website) return undefined;
  if (website in ogCache) return ogCache[website] || undefined;
  let image = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(website, {
      signal: ctrl.signal, redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", Accept: "text/html" },
    });
    clearTimeout(timer);
    if (res.ok) image = extractOgImage((await res.text()).slice(0, 200_000), res.url || website);
  } catch { /* ignore */ }
  ogCache[website] = image;
  return image || undefined;
}

// --- Google place -> VenueLocation ---------------------------------------
async function placeToLocation(place, fallbackAddress, approx) {
  const lat = place.location.latitude;
  const lng = place.location.longitude;
  const neighborhood =
    (await reverseGeocodeNeighborhood(lat, lng)) || googleNeighborhood(place.addressComponents);
  return {
    address: place.formattedAddress || fallbackAddress,
    neighborhood: neighborhood || undefined,
    borough: googleBorough(place.addressComponents) || undefined,
    coordinates: { lat, lng },
    placeId: place.id,
    hours: convertOpeningHours(place.regularOpeningHours),
    approxLocation: approx || undefined,
  };
}

// Derive a readable type from Google place data (restaurants).
const GENERIC_TYPES = new Set(["point_of_interest", "establishment", "food", "store"]);
function googleTypes(place) {
  if (place.primaryTypeDisplayName?.text) return [place.primaryTypeDisplayName.text];
  const t = (place.types || []).find((x) => !GENERIC_TYPES.has(x));
  return t ? [titleCase(t.replace(/_/g, " "))] : ["Restaurant"];
}

// --- Confidence: does the Google result match the queried name? -----------
function normName(s) {
  return (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/['’.]/g, "").replace(/\b(the|bar|restaurant|nyc|new york|ny|cafe|café)\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function matchConfidence(name, displayName) {
  const a = normName(name);
  const b = normName(displayName);
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 1;
  const at = new Set(a.split(" ").filter(Boolean));
  const bt = new Set(b.split(" ").filter(Boolean));
  const shared = [...at].filter((x) => bt.has(x)).length;
  return shared / Math.min(at.size, bt.size);
}

// --- Build a bar venue ----------------------------------------------------
async function buildBar(row) {
  const name = row.Establishment.trim();
  const parsed = parseLocations(row.Locations);
  const locations = [];
  const seenPlaceIds = new Set();
  let primaryPlace = null;

  for (const loc of parsed) {
    const place = await searchPlace(`${name}, ${loc.query}`);
    if (place && place.location) {
      if (place.id && seenPlaceIds.has(place.id)) continue;
      if (place.id) seenPlaceIds.add(place.id);
      locations.push(await placeToLocation(place, loc.address, loc.approx));
      if (!primaryPlace) primaryPlace = place;
    } else {
      const geo = await mapboxForward(loc.query);
      if (geo) {
        locations.push({
          address: loc.address, neighborhood: geo.neighborhood || undefined,
          coordinates: { lat: geo.lat, lng: geo.lng }, approxLocation: true,
        });
      }
    }
  }
  if (!locations.length) return null;

  const { policy, raw: reservationRaw } = classifyReservation(row.Reservations);
  const happyHour = parseHappyHour(row["Happy Hour"]);
  const happyHourDetails = row["Happy Hour Details"]?.trim() || undefined;
  const website = firstUrl(row["Main Website"]) || primaryPlace?.websiteUri;

  const venue = {
    name, category: "bar",
    types: normalizeTypes(row.Type),
    locations,
    neighborhood: locations[0].neighborhood,
    rating: primaryPlace?.rating,
    userRatingCount: primaryPlace?.userRatingCount,
    priceLevel: mapPriceLevel(primaryPlace?.priceLevel),
    happyHour,
    happyHourDetails,
    happyHourWindows: happyHour ? parseHappyHourWindows(happyHourDetails) : undefined,
    reservationPolicy: policy,
    reservationRaw,
    booking: parseBooking(row["How to Book"]),
    menuUrl: firstUrl(row.Menu),
    website,
    instagram: firstUrl(row.Instagram),
    googleMapsUri: primaryPlace?.googleMapsUri,
    photoUrl: await fetchOgImage(website),
    otherInfo: row["Other information"]?.trim() || undefined,
  };
  return venue;
}

// --- Build a restaurant venue --------------------------------------------
async function buildRestaurant(row) {
  const name = row.Establishment.trim();
  const place = await searchPlace(`${name}, New York, NY`);
  if (!place || !place.location) return { skipped: name };
  const confidence = matchConfidence(name, place.displayName?.text);
  if (confidence < 0.34) return { skipped: name };

  const website = place.websiteUri;
  return {
    name, category: "restaurant",
    types: googleTypes(place),
    locations: [await placeToLocation(place, place.formattedAddress, false)],
    neighborhood: undefined, // filled below from locations[0]
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    priceLevel: mapPriceLevel(place.priceLevel),
    happyHour: null,
    reservationPolicy: "unknown",
    website,
    googleMapsUri: place.googleMapsUri,
    photoUrl: await fetchOgImage(website),
    unverified: confidence < 0.6 || undefined,
  };
}

// --- Main -----------------------------------------------------------------
const bars = JSON.parse(readFileSync(BARS_PATH, "utf8")).filter((r) => (r.Locations || "").trim());
const restaurants = JSON.parse(readFileSync(RESTAURANTS_PATH, "utf8"));
console.log(`Enriching ${bars.length} bars + ${restaurants.length} restaurants via Google Places…`);

const barVenues = (await mapPool(bars, 6, buildBar)).filter(Boolean);
console.log(`  bars done: ${barVenues.length} mapped`);

const restaurantResults = await mapPool(restaurants, 6, buildRestaurant);
const restaurantVenues = restaurantResults.filter((v) => v && !v.skipped);
const skipped = restaurantResults.filter((v) => v && v.skipped).length;
console.log(`  restaurants done: ${restaurantVenues.length} mapped, ${skipped} skipped (no match)`);

// Finalize: neighborhood convenience, ids, clean undefined keys.
const all = [...barVenues, ...restaurantVenues];
const usedIds = new Set();
for (const v of all) {
  v.neighborhood = v.locations[0]?.neighborhood;
  let id = slugify(v.name) || "venue";
  if (usedIds.has(id)) { let i = 2; while (usedIds.has(`${id}-${i}`)) i++; id = `${id}-${i}`; }
  usedIds.add(id);
  v.id = id;
  for (const k of Object.keys(v)) if (v[k] === undefined) delete v[k];
  for (const loc of v.locations) for (const k of Object.keys(loc)) if (loc[k] === undefined) delete loc[k];
}
all.sort((a, b) => a.name.localeCompare(b.name));

// Reorder so `id` and `name` lead each record (purely cosmetic for the JSON).
const ordered = all.map(({ id, name, category, ...rest }) => ({ id, name, category, ...rest }));

writeFileSync(OUT_PATH, JSON.stringify(ordered, null, 2) + "\n");
writeFileSync(GEO_CACHE_PATH, JSON.stringify(geoCache, null, 2) + "\n");
writeFileSync(OG_CACHE_PATH, JSON.stringify(ogCache, null, 2) + "\n");
flushPlacesCache();

const withHours = all.filter((v) => v.locations.some((l) => l.hours)).length;
const withPhoto = all.filter((v) => v.photoUrl).length;
const withRating = all.filter((v) => v.rating).length;
const multi = all.filter((v) => v.locations.length > 1).length;
console.log(`\nWrote ${all.length} venues (${barVenues.length} bars, ${restaurantVenues.length} restaurants) to ${OUT_PATH}`);
console.log(`  with hours: ${withHours}, with photo: ${withPhoto}, with rating: ${withRating}, multi-location: ${multi}`);
console.log(`  caches: ${placesCacheSize()} places, ${Object.keys(geoCache).length} geo, ${Object.keys(ogCache).length} og`);
