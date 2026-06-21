import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getVenueById } from "@/lib/venues";
import VenueForm from "../VenueForm";
import { updateVenue, deleteVenue } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
        ← Back to admin
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Edit · {venue.name}</h1>
        <a
          href={`/venue/${venue.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          View page ↗
        </a>
      </div>
      <div className="mt-5">
        <VenueForm venue={venue} action={updateVenue} />
      </div>

      <form
        action={deleteVenue}
        className="mt-8 border-t border-zinc-200 pt-5"
      >
        <input type="hidden" name="id" value={venue.id} />
        <button className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
          Delete venue
        </button>
      </form>
    </main>
  );
}
