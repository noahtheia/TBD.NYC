import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVenueIds, getVenueById } from "@/lib/venues";
import VenueDetailContent from "@/components/detail/VenueDetailContent";
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
  const desc = [venue.types.join(", "), venue.neighborhood]
    .filter(Boolean)
    .join(" · ");
  const description = desc || `${venue.name} in NYC`;
  const images = venue.photoUrl ? [venue.photoUrl] : undefined;
  return {
    title: `${venue.name} — TBD.NYC`,
    description,
    alternates: { canonical: `/venue/${venue.id}` },
    openGraph: {
      title: `${venue.name} — TBD.NYC`,
      description,
      type: "article",
      url: `/venue/${venue.id}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: venue.name,
      description,
      images,
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          ← Back to map
        </Link>
        <ShareButton />
      </div>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <VenueDetailContent venue={venue} />
      </div>
    </main>
  );
}
