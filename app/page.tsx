import type { Metadata } from "next";
import Link from "next/link";
import { getResolvedPicks } from "@/lib/picks";
import { getPublishedPosts } from "@/lib/posts";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import { slugify } from "@/lib/slug";
import { websiteJsonLd } from "@/lib/jsonld";
import SiteHeader from "@/components/site/SiteHeader";
import HeroSearch from "@/components/home/HeroSearch";
import CollectionRail from "@/components/site/CollectionRail";
import PickCard from "@/components/home/PickCard";
import PostCard from "@/components/blog/PostCard";
import RelatedLinks from "@/components/landing/RelatedLinks";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "TBD.NYC — NYC Bars, Restaurants & Happy Hours",
  description:
    "Editor's picks, neighborhood guides, and an interactive map of curated New York City bars and restaurants — with live happy hours, hours, and ratings.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [picks, posts, venues] = await Promise.all([
    getResolvedPicks(),
    getPublishedPosts(),
    getVenues(),
  ]);
  const facets = computeFacets(venues);

  const topHoods = Object.entries(facets.counts.neighborhoods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([n, c]) => ({ href: `/neighborhood/${slugify(n)}`, label: n, count: c }));
  const topCuisines = Object.entries(facets.counts.cuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([c, n]) => ({ href: `/cuisine/${slugify(c)}`, label: c, count: n }));
  const latest = posts.slice(0, 6);

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader active="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />

      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-rose-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Find your next NYC bar or table.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600">
            Editor&apos;s picks, neighborhood guides, and {venues.length}+ curated spots on an
            interactive map — with live happy hours and open-now status.
          </p>
          <div className="mt-6 max-w-2xl">
            <HeroSearch
              facets={facets}
              venues={venues.map((v) => ({ id: v.id, name: v.name, category: v.category }))}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-12 lg:px-6">
        {picks.length > 0 && (
          <CollectionRail
            eyebrow="Editor's picks"
            title="Where to go right now"
            seeAllHref="/explore"
            seeAllLabel="Open the map"
          >
            {picks.map((p) => (
              <div key={p.id} className="w-72 shrink-0 snap-start">
                <PickCard pick={p} />
              </div>
            ))}
          </CollectionRail>
        )}

        {latest.length > 0 && (
          <CollectionRail eyebrow="The Guide" title="From the blog" seeAllHref="/blog">
            {latest.map((p) => (
              <div key={p.id} className="w-80 shrink-0 snap-start">
                <PostCard post={p} />
              </div>
            ))}
          </CollectionRail>
        )}

        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Browse</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            Explore by neighborhood &amp; cuisine
          </h2>
          <RelatedLinks title="Neighborhoods" links={topHoods} />
          <RelatedLinks title="Cuisines" links={topCuisines} />
        </section>
      </main>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-zinc-500 lg:px-6">
          <Link href="/explore" className="transition hover:text-zinc-800">
            Explore the map
          </Link>
          <Link href="/blog" className="transition hover:text-zinc-800">
            The Guide
          </Link>
          <Link href="/happy-hour" className="transition hover:text-zinc-800">
            Happy hours
          </Link>
          <span className="ml-auto">© TBD.NYC</span>
        </div>
      </footer>
    </div>
  );
}
