"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  checkPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/admin-auth";
import { enrichFromGoogle, type EnrichResult } from "@/lib/places";
import { normalizeAmenities } from "@/lib/amenities";
import { normalizeAwards } from "@/lib/awards";
import { rateLimit } from "@/lib/rate-limit";
import type { HappyHourItem, OpeningHours, VenueLocation, VenuePhoto } from "@/types/venue";

// --- helpers --------------------------------------------------------------
function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}
function arr(v: FormDataEntryValue | null): string[] {
  return String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function slugify(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function locationToRow(venueId: string, loc: VenueLocation, position: number) {
  return {
    venue_id: venueId,
    position,
    address: loc.address,
    neighborhood: loc.neighborhood ?? null,
    borough: loc.borough ?? null,
    lat: loc.coordinates.lat,
    lng: loc.coordinates.lng,
    place_id: loc.placeId ?? null,
    hours: loc.hours ?? null,
    approx_location: loc.approxLocation ?? false,
  };
}

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

// --- auth -----------------------------------------------------------------
export async function loginAction(formData: FormData) {
  // Throttle login attempts to slow brute force (per server instance).
  if (!rateLimit("admin-login", 10, 60_000)) {
    redirect("/admin/login?error=1");
  }
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    redirect("/admin/login?error=1");
  }
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

// --- enrich (callable from the client form) -------------------------------
export async function enrichVenueAction(name: string, address?: string): Promise<EnrichResult> {
  // Return errors as data (not thrown) so the form can show the real reason —
  // thrown server-action errors are sanitized to a generic digest in production.
  try {
    if (!(await isAdmin())) return { found: false, confidence: 0, error: "Not signed in." };
    if (!rateLimit("places-enrich", 30, 60_000)) {
      return { found: false, confidence: 0, error: "Too many lookups — try again in a minute." };
    }
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return { found: false, confidence: 0, error: "GOOGLE_PLACES_API_KEY is not set in this environment." };
    }
    return await enrichFromGoogle(name, address);
  } catch (e) {
    return { found: false, confidence: 0, error: (e as Error).message };
  }
}

// --- create / update ------------------------------------------------------
function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return JSON.parse(String(value ?? "")) as T;
  } catch {
    return fallback;
  }
}

function buildVenueRow(form: FormData, id: string) {
  const hh = str(form.get("happyHour")); // "yes" | "no" | "unknown"
  const windows = parseJson<OpeningHours | null>(form.get("happyHourWindowsJson"), null);
  const hasWindows = Boolean(windows?.periods?.length);
  const happy_hour = hasWindows ? true : hh === "yes" ? true : hh === "no" ? false : null;
  const menu = parseJson<HappyHourItem[]>(form.get("happyHourMenuJson"), [])
    .map((m) => ({ item: (m.item ?? "").trim(), price: (m.price ?? "").trim() || undefined }))
    .filter((m) => m.item);
  const amenities = normalizeAmenities(parseJson<string[]>(form.get("amenitiesJson"), []));
  const awards = normalizeAwards(parseJson<string[]>(form.get("awardsJson"), []));
  const photos = parseJson<VenuePhoto[]>(form.get("photosJson"), [])
    .map((p) => ({ url: (p.url ?? "").trim(), caption: (p.caption ?? "").trim() || undefined }))
    .filter((p) => p.url);
  const bookingUrl = str(form.get("bookingUrl"));
  return {
    id,
    name: String(form.get("name") ?? "").trim(),
    category: str(form.get("category")) === "restaurant" ? "restaurant" : "bar",
    types: arr(form.get("types")),
    cuisines: arr(form.get("cuisines")),
    neighborhood: str(form.get("neighborhood")),
    rating: num(form.get("rating")),
    price_level: num(form.get("priceLevel")),
    happy_hour,
    happy_hour_details: str(form.get("happyHourDetails")),
    happy_hour_windows: hasWindows ? windows : null,
    happy_hour_menu: menu.length ? menu : null,
    reservation_policy: str(form.get("reservationPolicy")) ?? "unknown",
    reservation_raw: str(form.get("reservationRaw")),
    booking: bookingUrl ? { url: bookingUrl, host: str(form.get("bookingHost")) ?? "other" } : null,
    menu_url: str(form.get("menuUrl")),
    website: str(form.get("website")),
    instagram: str(form.get("instagram")),
    google_maps_uri: str(form.get("googleMapsUri")),
    photo_url: str(form.get("photoUrl")),
    photos: photos.length ? photos : null,
    amenities,
    awards,
    other_info: str(form.get("otherInfo")),
    unverified: form.get("unverified") === "on",
    editorial_note: str(form.get("editorialNote")),
    featured: form.get("featured") === "on",
    source: "manual",
  };
}

function buildLocations(form: FormData, venueId: string) {
  const locs = parseJson<VenueLocation[]>(form.get("locationsJson"), []);
  const valid = (Array.isArray(locs) ? locs : []).filter(
    (l) =>
      l &&
      typeof l.address === "string" &&
      l.address.trim() &&
      Number.isFinite(l.coordinates?.lat) &&
      Number.isFinite(l.coordinates?.lng)
  );
  if (!valid.length) {
    throw new Error("A primary location with address, latitude and longitude is required.");
  }
  return valid.map((loc, i) => locationToRow(venueId, loc, i));
}

async function saveVenue(form: FormData, mode: "create" | "update") {
  await assertAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const supabase = getSupabaseAdmin();
  let id = str(form.get("id"));
  if (mode === "create") {
    const base = slugify(name) || "venue";
    id = base;
    // ensure uniqueness
    for (let i = 2; ; i++) {
      const { data } = await supabase.from("venues").select("id").eq("id", id).maybeSingle();
      if (!data) break;
      id = `${base}-${i}`;
    }
  }
  if (!id) throw new Error("Missing venue id.");

  const venueRow = buildVenueRow(form, id);
  const locationRows = buildLocations(form, id);
  // Default the venue's neighborhood to its primary location's when not set.
  if (!venueRow.neighborhood) venueRow.neighborhood = locationRows[0]?.neighborhood ?? null;

  const { error: vErr } = await supabase.from("venues").upsert(venueRow);
  if (vErr) throw new Error(`Save failed: ${vErr.message}`);

  await supabase.from("venue_locations").delete().eq("venue_id", id);
  const { error: lErr } = await supabase.from("venue_locations").insert(locationRows);
  if (lErr) throw new Error(`Save failed (locations): ${lErr.message}`);

  revalidatePath("/");
  revalidatePath(`/venue/${id}`);
  redirect(`/admin?saved=${id}`);
}

export async function createVenue(formData: FormData) {
  await saveVenue(formData, "create");
}
export async function updateVenue(formData: FormData) {
  await saveVenue(formData, "update");
}

export async function deleteVenue(formData: FormData) {
  await assertAdmin();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Missing id.");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath(`/venue/${id}`);
  redirect("/admin?deleted=1");
}

// --- bulk operations (called from the admin list) -------------------------
export async function bulkSetFeatured(ids: string[], featured: boolean) {
  await assertAdmin();
  if (!ids.length) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("venues").update({ featured }).in("id", ids);
  if (error) throw new Error(`Bulk update failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function bulkSetUnverified(ids: string[], unverified: boolean) {
  await assertAdmin();
  if (!ids.length) return;
  const supabase = getSupabaseAdmin();
  // Stamp source=manual: the seed pipeline writes `unverified`, so without this
  // a bulk verify on a synced row would be reverted on the next seed.
  const { error } = await supabase
    .from("venues")
    .update({ unverified, source: "manual" })
    .in("id", ids);
  if (error) throw new Error(`Bulk update failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function bulkDeleteVenues(ids: string[]) {
  await assertAdmin();
  if (!ids.length) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("venues").delete().in("id", ids);
  if (error) throw new Error(`Bulk delete failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin");
}

// --- re-enrich a single venue from Google (refresh sync fields) -----------
export async function reEnrichVenue(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!(await isAdmin())) return { ok: false, message: "Not signed in." };
    if (!rateLimit("places-enrich", 30, 60_000)) {
      return { ok: false, message: "Too many lookups — try again in a minute." };
    }
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return { ok: false, message: "GOOGLE_PLACES_API_KEY is not set in this environment." };
    }
    const supabase = getSupabaseAdmin();
    const { data: venue } = await supabase
      .from("venues")
      .select("id,name,locations:venue_locations(address,position)")
      .eq("id", id)
      .maybeSingle();
    if (!venue) return { ok: false, message: "Venue not found." };

    const primary = (venue.locations ?? [])
      .slice()
      .sort((a: { position: number | null }, b: { position: number | null }) => (a.position ?? 0) - (b.position ?? 0))[0];
    const r = await enrichFromGoogle(venue.name, primary?.address);
    if (!r.found) return { ok: false, message: r.error ?? "No Google match found." };
    if (r.confidence < 0.6) {
      return { ok: false, message: `Low confidence (${(r.confidence * 100).toFixed(0)}%) — skipped to avoid a bad match.` };
    }

    const patch: Record<string, unknown> = {};
    if (r.rating != null) patch.rating = r.rating;
    if (r.userRatingCount != null) patch.user_rating_count = r.userRatingCount;
    if (r.priceLevel != null) patch.price_level = r.priceLevel;
    if (r.website) patch.website = r.website;
    if (r.googleMapsUri) patch.google_maps_uri = r.googleMapsUri;
    if (r.photoUrl) patch.photo_url = r.photoUrl;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("venues").update(patch).eq("id", id);
      if (error) return { ok: false, message: error.message };
    }
    if (r.location && primary) {
      await supabase
        .from("venue_locations")
        .update({
          lat: r.location.coordinates.lat,
          lng: r.location.coordinates.lng,
          place_id: r.location.placeId ?? null,
          hours: r.location.hours ?? null,
        })
        .eq("venue_id", id)
        .eq("position", primary.position ?? 0);
    }
    revalidatePath("/");
    revalidatePath(`/venue/${id}`);
    revalidatePath("/admin");
    return { ok: true, message: `Re-enriched (match ${(r.confidence * 100).toFixed(0)}%).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
