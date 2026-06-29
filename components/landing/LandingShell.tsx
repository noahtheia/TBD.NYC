import type { Venue } from "@/types/venue";
import SiteHeader from "@/components/site/SiteHeader";
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
    <div className="min-h-dvh bg-newsprint">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <h1 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
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
