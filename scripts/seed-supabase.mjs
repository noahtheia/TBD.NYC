// Seed/sync Supabase from data/venues.json (the enriched snapshot).
// Upserts venues + venue_locations via the service-role key. Idempotent.
// Rows whose DB `source = 'manual'` (edited in the admin) are skipped.
//
// Run: node --env-file=.env.local scripts/seed-supabase.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENUES = join(__dirname, "..", "data", "venues.json");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

function venueRow(v) {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    types: v.types ?? [],
    cuisines: v.cuisines ?? [],
    neighborhood: v.neighborhood ?? null,
    rating: v.rating ?? null,
    user_rating_count: v.userRatingCount ?? null,
    price_level: v.priceLevel ?? null,
    happy_hour: v.happyHour ?? null,
    happy_hour_details: v.happyHourDetails ?? null,
    happy_hour_windows: v.happyHourWindows ?? null,
    reservation_policy: v.reservationPolicy ?? "unknown",
    reservation_raw: v.reservationRaw ?? null,
    booking: v.booking ?? null,
    menu_url: v.menuUrl ?? null,
    website: v.website ?? null,
    instagram: v.instagram ?? null,
    google_maps_uri: v.googleMapsUri ?? null,
    photo_url: v.photoUrl ?? null,
    other_info: v.otherInfo ?? null,
    unverified: v.unverified ?? false,
    source: "sync",
  };
}
function locationRows(v) {
  return (v.locations ?? []).map((l, i) => ({
    venue_id: v.id,
    position: i,
    address: l.address,
    neighborhood: l.neighborhood ?? null,
    borough: l.borough ?? null,
    lat: l.coordinates.lat,
    lng: l.coordinates.lng,
    place_id: l.placeId ?? null,
    hours: l.hours ?? null,
    approx_location: l.approxLocation ?? false,
  }));
}

const all = JSON.parse(readFileSync(VENUES, "utf8"));

// Preserve admin-edited rows.
const { data: manualRows, error: manualErr } = await supabase
  .from("venues")
  .select("id")
  .eq("source", "manual");
if (manualErr) {
  console.error("Could not read existing rows:", manualErr.message);
  process.exit(1);
}
const manual = new Set((manualRows ?? []).map((r) => r.id));
const venues = all.filter((v) => !manual.has(v.id));
console.log(`Seeding ${venues.length} venues (${manual.size} manual rows preserved)…`);

for (const part of chunk(venues, 200)) {
  const { error } = await supabase.from("venues").upsert(part.map(venueRow));
  if (error) { console.error("venue upsert failed:", error.message); process.exit(1); }
}

// Replace locations for the seeded venues.
const ids = venues.map((v) => v.id);
for (const part of chunk(ids, 200)) {
  const { error } = await supabase.from("venue_locations").delete().in("venue_id", part);
  if (error) { console.error("location delete failed:", error.message); process.exit(1); }
}
const locs = venues.flatMap(locationRows);
for (const part of chunk(locs, 500)) {
  const { error } = await supabase.from("venue_locations").insert(part);
  if (error) { console.error("location insert failed:", error.message); process.exit(1); }
}

const { count } = await supabase.from("venues").select("*", { count: "exact", head: true });
console.log(`Done. venues table now has ${count} rows; inserted ${locs.length} locations.`);
