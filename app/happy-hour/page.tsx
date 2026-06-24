import type { Metadata } from "next";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import { filterVenues } from "@/lib/filtering";
import { EMPTY_FILTERS } from "@/types/venue";
import { nycNow } from "@/lib/hours";
import { slugify } from "@/lib/slug";
import LandingShell from "@/components/landing/LandingShell";
import RelatedLinks from "@/components/landing/RelatedLinks";

export const revalidate = 300;

const TITLE = "Happy Hours in NYC — TBD.NYC";
const DESCRIPTION =
  "Find happy hours across New York City — curated bars with structured happy-hour windows, deals, and live status on an interactive map.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/happy-hour" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/happy-hour", type: "website" },
};

export default async function HappyHourPage() {
  const venues = await getVenues();
  const facets = computeFacets(venues);

  const results = filterVenues(
    venues,
    { ...EMPTY_FILTERS, happyHourOnly: true },
    "",
    nycNow()
  );

  // Neighborhoods that actually have happy-hour spots, for cross-linking.
  const hhHoods = new Set(
    results.flatMap((v) => v.locations.map((l) => l.neighborhood).filter(Boolean) as string[])
  );
  const hoods = facets.neighborhoods
    .filter((n) => hhHoods.has(n))
    .map((n) => ({ n, c: facets.counts.neighborhoods[n] ?? 0 }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 12)
    .map(({ n }) => ({ href: `/neighborhood/${slugify(n)}`, label: n }));

  return (
    <LandingShell
      title="Happy Hours in NYC"
      intro="Curated NYC happy hours with structured windows and deals. Open the map for live “happy hour now” status and one-tap “near me”."
      venues={results}
    >
      <RelatedLinks title="Happy hour by neighborhood" links={hoods} />
    </LandingShell>
  );
}
