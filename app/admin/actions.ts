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
import type { HappyHourItem, OpeningHours, VenueLocation } from "@/types/venue";

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
    other_info: str(form.get("otherInfo")),
    unverified: form.get("unverified") === "on",
    editorial_note: str(form.get("editorialNote")),
    featured: form.get("featured") === "on",
    source: "manual",
  };
}

function buildLocations(form: FormData, venueId: string) {
  const lat = num(form.get("locLat"));
  const lng = num(form.get("locLng"));
  const address = str(form.get("locAddress"));
  if (lat === null || lng === null || !address) {
    throw new Error("A primary location with address, latitude and longitude is required.");
  }
  let hours: OpeningHours | null = null;
  try {
    hours = JSON.parse(String(form.get("primaryHoursJson") ?? "null"));
  } catch {
    hours = null;
  }
  let extra: VenueLocation[] = [];
  try {
    extra = JSON.parse(String(form.get("extraLocationsJson") ?? "[]"));
  } catch {
    extra = [];
  }
  const primary: VenueLocation = {
    address,
    neighborhood: str(form.get("locNeighborhood")) ?? undefined,
    borough: str(form.get("locBorough")) ?? undefined,
    coordinates: { lat, lng },
    placeId: str(form.get("locPlaceId")) ?? undefined,
    hours: hours ?? undefined,
  };
  return [primary, ...extra].map((loc, i) => locationToRow(venueId, loc, i));
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
