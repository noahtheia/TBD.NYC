import { hasSupabaseAdmin } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/errors";

/**
 * Amber notice shown above an admin feature when its Supabase-backed data can't
 * load. Distinguishes three cases so the message points at the actual fix:
 *  - Supabase env vars not set
 *  - Supabase connected but the table is missing (migration not applied)
 *  - some other error (surfaced verbatim)
 */
export default function SetupNotice({
  feature,
  migration,
  error,
  fallback,
}: {
  /** Human-readable feature name, e.g. "Posts" or "Editor's picks". */
  feature: string;
  /** Migration file that creates the backing tables. */
  migration: string;
  /** The error message returned from Supabase. */
  error: string;
  /** What public pages show until the feature is set up (optional). */
  fallback?: string;
}) {
  let body: React.ReactNode;

  if (!hasSupabaseAdmin) {
    body = (
      <>
        {feature} require Supabase. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code> in this server&apos;s environment.
      </>
    );
  } else if (isMissingTableError(error)) {
    body = (
      <>
        Supabase is connected, but the tables for {feature.toLowerCase()} don&apos;t exist
        yet. Apply <code>{migration}</code> — run <code>npm run migrate</code> (needs{" "}
        <code>SUPABASE_DB_URL</code>) or paste the file into the Supabase SQL editor.
      </>
    );
  } else {
    body = (
      <>
        {feature} couldn&apos;t load: {error}
      </>
    );
  }

  return (
    <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
      {body}
      {fallback ? <span className="block text-amber-700">{fallback}</span> : null}
    </p>
  );
}
