// Builds data/venues.json from the parsed spreadsheet snapshot (data/source/bars.raw.json).
//
//   1. Filters to bars that have a Location (the mappable set).
//   2. Normalizes messy free-text fields (types, reservations, happy hour, links).
//   3. Geocodes each address with the Mapbox Geocoding API (v6 forward), caching
//      results in scripts/geocode-cache.json so re-runs are stable and free.
//   4. Scrapes each venue website's og:image for photoUrl, cached in
//      scripts/og-cache.json.
//
// Run:  node --env-file=.env.local scripts/build-data.mjs   (or: npm run build:data)
//
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in the environment (or .env.local via --env-file).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_PATH = join(ROOT, "data", "source", "bars.raw.json");
const CACHE_PATH = join(__dirname, "geocode-cache.json");
const OG_CACHE_PATH = join(__dirname, "og-cache.json");
const OUT_PATH = join(ROOT, "data", "venues.json");

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!TOKEN) {
  console.error(
    "Missing NEXT_PUBLIC_MAPBOX_TOKEN. Run: node --env-file=.env.local scripts/build-data.mjs"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const TYPE_CANON = {
  bar: "Bar",
  "cocktail bar": "Cocktail Bar",
  cocktail: "Cocktail Bar",
  "cocktail lounge": "Cocktail Bar",
  "wine bar": "Wine Bar",
  wine: "Wine Bar",
  "natural wine bar": "Wine Bar",
  "natural wine": "Wine Bar",
  restaurant: "Restaurant",
  restuarant: "Restaurant",
  resturant: "Restaurant",
  piano: "Piano Bar",
  brewery: "Brewery",
  "beer garden": "Beer Garden",
  "beer hall": "Beer Hall",
  taproom: "Taproom",
  speakeasy: "Speakeasy",
  "speakeasy bar": "Speakeasy",
  rooftop: "Rooftop Bar",
  "rooftop bar": "Rooftop Bar",
  "hotel bar": "Hotel Bar",
  hotel: "Hotel Bar",
  cafe: "Cafe",
  "café": "Cafe",
  coffee: "Cafe",
  "coffee shop": "Cafe",
  "oyster bar": "Oyster Bar",
  "raw bar": "Oyster Bar",
  "sports bar": "Sports Bar",
  "dive bar": "Dive Bar",
  dive: "Dive Bar",
  lounge: "Lounge",
  pub: "Pub",
  gastropub: "Gastropub",
  "irish pub": "Pub",
  club: "Nightclub",
  nightclub: "Nightclub",
  "piano bar": "Piano Bar",
  "tiki bar": "Tiki Bar",
  tiki: "Tiki Bar",
  "karaoke bar": "Karaoke Bar",
  karaoke: "Karaoke Bar",
  bistro: "Restaurant",
};

const titleCase = (s) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

function normalizeTypes(raw) {
  if (!raw || !raw.trim()) return [];
  const tokens = raw
    .split(/\/\/|\/|,|&| and /gi)
    .map((t) => t.trim())
    .filter(Boolean);
  const out = [];
  for (const tok of tokens) {
    const key = tok.toLowerCase().replace(/\s+/g, " ").trim();
    const canon = TYPE_CANON[key] || titleCase(tok);
    if (canon && !out.includes(canon)) out.push(canon);
  }
  return out;
}

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
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STREET_SUFFIX =
  "St|Street|Ave|Avenue|Av|Blvd|Boulevard|Pl|Place|Rd|Road|Way|Sq|Square|Broadway|Bowery|Ln|Lane|Dr|Drive|Ct|Court|Ter|Terrace|Pkwy|Parkway|Plz|Plaza|Walk|Row";

// Build a geocoding query + display address from the free-text Locations field.
// Handles single addresses, "Label: 123 Main St" prefixes, multiple concatenated
// addresses (uses the first), and neighborhood-only multi-location strings.
function parseLocation(locations) {
  // First line, with any leading "Neighborhood:" label stripped (letters before
  // the colon, never a street number).
  let primary = locations.split(/\r?\n/)[0].trim();
  primary = primary.replace(/^\s*[A-Za-z][A-Za-z .'’/&-]*:\s*/, "").trim();
  const address = primary;

  // 1. First complete address that ends in a 5-digit ZIP.
  const withZip = primary.match(/\d+\b[\s\S]*?\b\d{5}/);
  if (withZip) return { query: withZip[0].trim(), address, approx: false };

  // 2. First street address (no ZIP) -> append city/state.
  const street = new RegExp(`\\d{1,5}\\s+[\\w.'’\\s-]*?\\b(?:${STREET_SUFFIX})\\b\\.?`, "i");
  const stMatch = primary.match(street);
  if (stMatch)
    return { query: `${stMatch[0].trim()}, New York, NY`, address, approx: false };

  // 3. Neighborhood-only (e.g. "Williamsburg, Cobble Hill, ...") -> approximate pin.
  const firstSeg = primary.split(",")[0].trim();
  return { query: `${firstSeg}, New York, NY`, address, approx: true };
}

// ---------------------------------------------------------------------------
// Geocoding (Mapbox v6 forward) with on-disk cache
// ---------------------------------------------------------------------------

const cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, "utf8"))
  : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  if (cache[query]) return cache[query];
  const url =
    `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}` +
    `&access_token=${TOKEN}&country=us&limit=1&proximity=-73.98,40.74`;
  let result = null;
  for (let attempt = 0; attempt < 2 && !result; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const feat = json.features?.[0];
      if (feat) {
        const c = feat.properties.coordinates;
        const ctx = feat.properties.context || {};
        result = {
          lat: c.latitude,
          lng: c.longitude,
          neighborhood:
            ctx.neighborhood?.name || ctx.locality?.name || ctx.place?.name || null,
        };
      } else {
        result = { lat: null, lng: null, neighborhood: null };
      }
    } catch (err) {
      if (attempt === 1) {
        console.warn(`  ! geocode failed for "${query}": ${err.message}`);
        result = { lat: null, lng: null, neighborhood: null };
      } else {
        await sleep(500);
      }
    }
  }
  cache[query] = result;
  await sleep(120); // be gentle with the geocoding API
  return result;
}

// ---------------------------------------------------------------------------
// Photos: scrape Open Graph image from each venue's website (cached)
// ---------------------------------------------------------------------------

const ogCache = existsSync(OG_CACHE_PATH)
  ? JSON.parse(readFileSync(OG_CACHE_PATH, "utf8"))
  : {};

function extractOgImage(html, baseUrl) {
  // Look for og:image / twitter:image in either attribute order.
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
      } catch {
        /* ignore malformed url */
      }
    }
  }
  return null;
}

async function fetchOgImage(website) {
  if (!website) return null;
  if (website in ogCache) return ogCache[website];
  let image = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(website, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = (await res.text()).slice(0, 200_000); // og tags live in <head>
      image = extractOgImage(html, res.url || website);
    }
  } catch (err) {
    console.warn(`  ! og:image failed for ${website}: ${err.message}`);
  }
  ogCache[website] = image;
  await sleep(80);
  return image;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const rows = JSON.parse(readFileSync(RAW_PATH, "utf8"));
const mappable = rows.filter((r) => (r.Locations || "").trim());
console.log(`Read ${rows.length} bars; ${mappable.length} have a Location.`);

const usedIds = new Set();
const venues = [];
let geocoded = 0;
let failed = 0;

for (const r of mappable) {
  const name = r.Establishment.trim();
  const { query, address, approx } = parseLocation(r.Locations);
  const geo = await geocode(query);
  if (geo.lat == null || geo.lng == null) {
    failed++;
    console.warn(`  ! no coordinates for "${name}" (${query})`);
    continue;
  }
  geocoded++;

  let id = slugify(name) || `venue-${venues.length}`;
  if (usedIds.has(id)) {
    let i = 2;
    while (usedIds.has(`${id}-${i}`)) i++;
    id = `${id}-${i}`;
  }
  usedIds.add(id);

  const { policy, raw: reservationRaw } = classifyReservation(r.Reservations);
  const website = firstUrl(r["Main Website"]);
  const instagram = firstUrl(r.Instagram);
  const photoUrl = (await fetchOgImage(website)) || undefined;

  const venue = {
    id,
    name,
    types: normalizeTypes(r.Type),
    rawType: r.Type?.trim() || undefined,
    neighborhood: geo.neighborhood || undefined,
    address,
    coordinates: { lat: geo.lat, lng: geo.lng },
    approxLocation: approx || undefined,
    happyHour: parseHappyHour(r["Happy Hour"]),
    happyHourDetails: r["Happy Hour Details"]?.trim() || undefined,
    hours: r.Hours?.trim() || undefined,
    reservationPolicy: policy,
    reservationRaw,
    booking: parseBooking(r["How to Book"]),
    menuUrl: firstUrl(r.Menu),
    website,
    instagram,
    photoUrl,
    otherInfo: r["Other information"]?.trim() || undefined,
  };

  // Drop undefined keys for a clean JSON file.
  for (const k of Object.keys(venue)) if (venue[k] === undefined) delete venue[k];
  venues.push(venue);
}

venues.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
writeFileSync(OG_CACHE_PATH, JSON.stringify(ogCache, null, 2) + "\n");
writeFileSync(OUT_PATH, JSON.stringify(venues, null, 2) + "\n");

const withPhoto = venues.filter((v) => v.photoUrl).length;
console.log(`\nGeocoded ${geocoded}, failed ${failed}.`);
console.log(`Photos: ${withPhoto}/${venues.length} venues have an og:image.`);
console.log(`Wrote ${venues.length} venues to ${OUT_PATH}`);
console.log(`Cache: ${Object.keys(cache).length} geocode, ${Object.keys(ogCache).length} og entries`);

// Quick facets summary
const hoods = [...new Set(venues.map((v) => v.neighborhood).filter(Boolean))].sort();
const types = [...new Set(venues.flatMap((v) => v.types))].sort();
const hh = venues.filter((v) => v.happyHour === true).length;
console.log(`\nNeighborhoods (${hoods.length}): ${hoods.join(", ")}`);
console.log(`Types (${types.length}): ${types.join(", ")}`);
console.log(`Happy hour venues: ${hh}`);
