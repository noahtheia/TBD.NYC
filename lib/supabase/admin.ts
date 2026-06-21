import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseAdmin = Boolean(URL && SERVICE_ROLE);

/** Service-role client (bypasses RLS). Server-only — never import in client code. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!URL || !SERVICE_ROLE) {
    throw new Error(
      "Supabase admin not configured (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });
}
