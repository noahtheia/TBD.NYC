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
  return facets.neighborhoods.map((n) => ({ slug: slugify(n) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const facets = computeFacets(await getVenues());
  const name = unslug(slug, facets.neighborhoods);
  if (!name) return { title: "Not found — TBD.NYC" };
  const count = facets.counts.neighborhoods[name] ?? 0;
  const title = `Bars & Restaurants in ${name} — TBD.NYC`;
  const description = `Discover ${count} curated bars and restaurants in ${name}, NYC — happy hours, hours, ratings, price, and reservations on an interactive map.`;
  return {
    title,
    description,
    alternates: { canonical: `/neighborhood/${slug}` },
    openGraph: { title, description, url: `/neighborhood/${slug}`, type: "website" },
  };
}

export default async function NeighborhoodPage({ params }: Params) {
  const { slug } = await params;
  const venues = await getVenues();
  const facets = computeFacets(venues);
  const name = unslug(slug, facets.neighborhoods);
  if (!name) notFound();

  const results = filterVenues(
    venues,
    { ...EMPTY_FILTERS, neighborhoods: [name] },
    "",
    nycNow()
  );

  const others = facets.neighborhoods
    .filter((n) => n !== name)
    .map((n) => ({ n, c: facets.counts.neighborhoods[n] ?? 0 }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 12)
    .map(({ n, c }) => ({ href: `/neighborhood/${slugify(n)}`, label: n, count: c }));

  return (
    <LandingShell
      title={`Bars & Restaurants in ${name}`}
      intro={`Curated spots in ${name} — explore the full map and filter by happy hour, open now, price, and more.`}
      venues={results}
    >
      <RelatedLinks title="Other neighborhoods" links={others} />
    </LandingShell>
  );
}
