import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import { filterVenues } from "@/lib/filtering";
import { EMPTY_FILTERS } from "@/types/venue";
import { nycNow } from "@/lib/hours";
import { slugify, unslug } from "@/lib/slug";
import LandingShell from "@/components/landing/LandingShell";
import RelatedLinks from "@/components/landing/RelatedLinks";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const facets = computeFacets(await getVenues());
  return facets.cuisines.map((c) => ({ slug: slugify(c) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const facets = computeFacets(await getVenues());
  const name = unslug(slug, facets.cuisines);
  if (!name) return { title: "Not found — TBD.NYC" };
  const count = facets.counts.cuisines[name] ?? 0;
  const title = `${name} Restaurants in NYC — TBD.NYC`;
  const description = `${count} curated ${name} restaurants in New York City — hours, ratings, price, and reservations on an interactive map.`;
  return {
    title,
    description,
    alternates: { canonical: `/cuisine/${slug}` },
    openGraph: { title, description, url: `/cuisine/${slug}`, type: "website" },
  };
}

export default async function CuisinePage({ params }: Params) {
  const { slug } = await params;
  const venues = await getVenues();
  const facets = computeFacets(venues);
  const name = unslug(slug, facets.cuisines);
  if (!name) notFound();

  const results = filterVenues(
    venues,
    { ...EMPTY_FILTERS, cuisines: [name] },
    "",
    nycNow()
  );

  const others = facets.cuisines
    .filter((c) => c !== name)
    .map((c) => ({ c, n: facets.counts.cuisines[c] ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 12)
    .map(({ c, n }) => ({ href: `/cuisine/${slugify(c)}`, label: c, count: n }));

  return (
    <LandingShell
      title={`${name} Restaurants in NYC`}
      intro={`Curated ${name} restaurants across New York City — explore the full map and filter by neighborhood, price, and open now.`}
      venues={results}
    >
      <RelatedLinks title="Other cuisines" links={others} />
    </LandingShell>
  );
}
