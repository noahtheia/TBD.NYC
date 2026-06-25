import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVenueIds, getVenueById, getVenues } from "@/lib/venues";
import { priceLabel } from "@/lib/display";
import { slugify } from "@/lib/slug";
import VenueDetailContent from "@/components/detail/VenueDetailContent";
import VenueJsonLd from "@/components/detail/VenueJsonLd";
import VenueResults from "@/components/landing/VenueResults";
import ShareButton from "@/components/ui/ShareButton";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllVenueIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) return { title: "Not found — TBD.NYC" };

  const primaryType =
    venue.category === "restaurant"
      ? venue.cuisines?.length
        ? `${venue.cuisines.slice(0, 2).join(" & ")} restaurant`
        : "restaurant"
      : venue.types[0] ?? "bar";
  const where = venue.neighborhood ? ` in ${venue.neighborhood}` : "";
  const price = priceLabel(venue.priceLevel);

  const title = `${venue.name} — ${primaryType}${where} | TBD.NYC`;
  const lead = `${venue.name} — a ${price ? `${price} ` : ""}${primaryType}${where}, NYC.`;
  const rating =
    venue.rating != null
      ? ` Rated ★${venue.rating.toFixed(1)}${venue.userRatingCount ? ` by ${venue.userRatingCount}` : ""}.`
      : "";
  const hh = venue.happyHour === true ? " Happy hour available." : "";
  const description = `${lead}${rating}${hh}`.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/venue/${venue.id}` },
    // Image comes from the colocated opengraph-image route (branded per-venue card).
    openGraph: {
      title,
      description,
      type: "article",
      url: `/venue/${venue.id}`,
    },
    twitter: { card: "summary_large_image", title: venue.name, description },
  };
}

const CHIP =
  "inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-rose-700";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  // Sibling venues in the same neighborhood, for internal linking + dwell time.
  const related = venue.neighborhood
    ? (await getVenues())
        .filter((v) => v.id !== venue.id && v.neighborhood === venue.neighborhood)
        .slice(0, 6)
    : [];

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <VenueJsonLd venue={venue} />

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          ← Back to map
        </Link>
        <ShareButton title={venue.name} />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <VenueDetailContent venue={venue} />
      </div>

      {/* Crawlable internal links to landing pages. */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {venue.neighborhood && (
          <Link href={`/neighborhood/${slugify(venue.neighborhood)}`} className={CHIP}>
            More in {venue.neighborhood}
          </Link>
        )}
        {venue.category === "restaurant" &&
          venue.cuisines?.map((c) => (
            <Link key={c} href={`/cuisine/${slugify(c)}`} className={CHIP}>
              {c}
            </Link>
          ))}
        {venue.happyHour === true && (
          <Link href="/happy-hour" className={CHIP}>
            NYC happy hours
          </Link>
        )}
      </nav>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">
            More in {venue.neighborhood}
          </h2>
          <div className="mt-4">
            <VenueResults venues={related} />
          </div>
        </section>
      )}
    </main>
  );
}
