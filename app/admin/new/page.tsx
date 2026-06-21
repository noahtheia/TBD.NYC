import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import VenueForm from "../VenueForm";
import { createVenue } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
        ← Back to admin
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">Add venue</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter a name and click <strong>Enrich from Google</strong> to auto-fill location, hours,
        rating and price — then adjust and save.
      </p>
      <div className="mt-5">
        <VenueForm action={createVenue} />
      </div>
    </main>
  );
}
