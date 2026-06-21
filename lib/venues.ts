import fallbackData from "@/data/venues.json";
import type { Venue } from "@/types/venue";
import { getSupabase, hasSupabase, VENUE_SELECT } from "@/lib/supabase/server";
import { rowToVenue, type DbVenue } from "@/lib/supabase/map";

const fallback = fallbackData as unknown as Venue[];

/** All venues. Reads from Supabase when configured; otherwise the committed
 *  venues.json snapshot (so the app builds/runs without Supabase). */
export async function getVenues(): Promise<Venue[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback;

  const { data, error } = await supabase.from("venues").select(VENUE_SELECT);
  if (error || !data) {
    console.error("Supabase getVenues failed, using fallback:", error?.message);
    return fallback;
  }
  return (data as unknown as DbVenue[])
    .map(rowToVenue)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getVenueById(id: string): Promise<Venue | undefined> {
  const supabase = getSupabase();
  if (!supabase) return fallback.find((v) => v.id === id);

  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Supabase getVenueById failed, using fallback:", error.message);
    return fallback.find((v) => v.id === id);
  }
  return data ? rowToVenue(data as unknown as DbVenue) : undefined;
}

export async function getAllVenueIds(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback.map((v) => v.id);

  const { data, error } = await supabase.from("venues").select("id");
  if (error || !data) return fallback.map((v) => v.id);
  return (data as { id: string }[]).map((r) => r.id);
}

export { hasSupabase };
