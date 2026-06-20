import { Suspense } from "react";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import ExploreView from "@/components/ExploreView";

export default function Home() {
  const venues = getVenues();
  const facets = computeFacets(venues);

  return (
    <Suspense fallback={null}>
      <ExploreView venues={venues} facets={facets} />
    </Suspense>
  );
}
