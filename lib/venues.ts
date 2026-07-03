import fallbackData from "@/data/venues.json";
import awardsOverlay from "@/data/awards.json";
import type { Venue } from "@/types/venue";
import { getSupabase, hasSupabase, VENUE_SELECT } from "@/lib/supabase/server";
import { rowToVenue, type DbVenue } from "@/lib/supabase/map";
import { normalizeAwards } from "@/lib/awards";

const fallback = fallbackData as unknown as Venue[];
const AWARDS_BY_ID = awardsOverlay as Record<string, string[]>;

/** Default a venue's awards from the committed data/awards.json overlay when it
 *  has none of its own. Admin/Supabase-set awards (a non-empty array) always win,
 *  so curators can override the seed per venue. */
function withAwards(v: Venue): Venue {
  if (v.awards?.length) return v;
  const seeded = AWARDS_BY_ID[v.id];
  if (!seeded?.length) return v;
  return { ...v, awards: normalizeAwards(seeded) };
}

/** All venues. Reads from Supabase when configured; otherwise the committed
 *  venues.json snapshot (so the app builds/runs without Supabase). */
export async function getVenues(): Promise<Venue[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback.map(withAwards);

  const { data, error } = await supabase.from("venues").select(VENUE_SELECT);
  if (error || !data) {
    console.error("Supabase getVenues failed, using fallback:", error?.message);
    return fallback.map(withAwards);
  }
  return (data as unknown as DbVenue[])
    .map(rowToVenue)
    .map(withAwards)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Project a venue down to the fields the explore list + map actually read,
 *  dropping detail-only payload (weekday text, gallery, raw reservation/menu/site
 *  fields, amenities, editorial notes). Structurally still a Venue. */
export function liteVenue(v: Venue): Venue {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    types: v.types,
    cuisines: v.cuisines,
    locations: v.locations.map((l) => ({
      address: l.address,
      neighborhood: l.neighborhood,
      borough: l.borough,
      coordinates: l.coordinates,
      hours: l.hours ? { periods: l.hours.periods, open24: l.hours.open24 } : undefined,
    })),
    neighborhood: v.neighborhood,
    rating: v.rating,
    userRatingCount: v.userRatingCount,
    priceLevel: v.priceLevel,
    happyHour: v.happyHour,
    happyHourWindows: v.happyHourWindows,
    reservationPolicy: v.reservationPolicy,
    businessStatus: v.businessStatus,
    booking: v.booking,
    photoUrl: v.photoUrl,
    awards: v.awards,
    unverified: v.unverified,
  };
}

/** Lightweight catalog for the home explore view — same shape as getVenues() but
 *  without detail-only fields, so the client/RSC payload is much smaller. The
 *  drawer/detail fetch the full record by id when opened. */
export async function getVenuesLite(): Promise<Venue[]> {
  return (await getVenues()).map(liteVenue);
}

export async function getVenueById(id: string): Promise<Venue | undefined> {
  const supabase = getSupabase();
  const fromFallback = () => {
    const v = fallback.find((x) => x.id === id);
    return v ? withAwards(v) : undefined;
  };
  if (!supabase) return fromFallback();

  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Supabase getVenueById failed, using fallback:", error.message);
    return fromFallback();
  }
  return data ? withAwards(rowToVenue(data as unknown as DbVenue)) : undefined;
}

export async function getAllVenueIds(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback.map((v) => v.id);

  const { data, error } = await supabase.from("venues").select("id");
  if (error || !data) return fallback.map((v) => v.id);
  return (data as { id: string }[]).map((r) => r.id);
}

export { hasSupabase };
