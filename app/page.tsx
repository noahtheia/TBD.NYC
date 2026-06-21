import { Suspense } from "react";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import ExploreView from "@/components/ExploreView";

// Revalidate the catalog periodically (ISR) so Supabase edits appear without a
// redeploy. Admin mutations also revalidate this path explicitly.
export const revalidate = 300;

export default async function Home() {
  const venues = await getVenues();
  const facets = computeFacets(venues);

  return (
    <Suspense fallback={null}>
      <ExploreView venues={venues} facets={facets} />
    </Suspense>
  );
}
