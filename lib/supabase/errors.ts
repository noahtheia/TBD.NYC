/**
 * Detects the "table doesn't exist" error returned when Supabase is connected
 * but a migration hasn't been applied yet. PostgREST surfaces this as
 * "Could not find the table 'public.posts' in the schema cache" (code PGRST205);
 * a direct Postgres error is `relation "public.posts" does not exist` (42P01).
 *
 * Used to tell "Supabase isn't configured" apart from "Supabase is configured
 * but the schema is missing", so the admin can show the right next step.
 */
export function isMissingTableError(message?: string | null): boolean {
  if (!message) return false;
  return (
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message) ||
    /relation .+ does not exist/i.test(message)
  );
}
