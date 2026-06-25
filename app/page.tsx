import { Suspense } from "react";
import { getVenuesLite } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import ExploreView from "@/components/ExploreView";

// Revalidate the catalog periodically (ISR) so Supabase edits appear without a
// redeploy. Admin mutations also revalidate this path explicitly.
export const revalidate = 300;

export default async function Home() {
  // Lite catalog (no detail-only fields) keeps the hydrated client payload small;
  // the drawer fetches the full record by id on open.
  const venues = await getVenuesLite();
  const facets = computeFacets(venues);

  return (
    <Suspense fallback={null}>
      <ExploreView venues={venues} facets={facets} />
    </Suspense>
  );
}
