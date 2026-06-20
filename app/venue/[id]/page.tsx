import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVenueIds, getVenueById } from "@/lib/venues";
import VenueDetailContent from "@/components/detail/VenueDetailContent";

export function generateStaticParams() {
  return getAllVenueIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = getVenueById(id);
  if (!venue) return { title: "Not found — TBD.NYC" };
  const desc = [venue.types.join(", "), venue.neighborhood]
    .filter(Boolean)
    .join(" · ");
  return {
    title: `${venue.name} — TBD.NYC`,
    description: desc || `${venue.name} in NYC`,
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = getVenueById(id);
  if (!venue) notFound();

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
      >
        ← Back to map
      </Link>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <VenueDetailContent venue={venue} />
      </div>
    </main>
  );
}
