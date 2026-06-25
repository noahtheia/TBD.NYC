import Link from "next/link";
import type { Venue } from "@/types/venue";
import VenueResults from "./VenueResults";

/** Shared chrome for the SSR landing pages (neighborhood / cuisine / happy hour):
 *  brand header + back-to-map link, an h1 + intro, the linked results grid, and a
 *  slot for related-link navs. */
export default function LandingShell({
  title,
  intro,
  venues,
  children,
}: {
  title: string;
  intro?: string;
  venues: Venue[];
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 lg:px-6">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-zinc-900"
          >
            TBD<span className="text-rose-600">.NYC</span>
          </Link>
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← Back to map
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {intro && <p className="mt-2 max-w-2xl text-zinc-600">{intro}</p>}
        <p className="mt-1 text-sm text-zinc-500">
          {venues.length} {venues.length === 1 ? "spot" : "spots"}
        </p>
        <div className="mt-6">
          <VenueResults venues={venues} />
        </div>
        {children}
      </main>
    </div>
  );
}
