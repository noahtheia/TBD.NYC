import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Whether Supabase is configured. When false, the app falls back to venues.json. */
export const hasSupabase = Boolean(URL && ANON);

/** Public, read-only client (anon key + RLS public-SELECT). Server-side use. */
export function getSupabase(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

/** PostgREST embedded-select string for a venue with its locations. */
export const VENUE_SELECT = "*, locations:venue_locations(*)";
