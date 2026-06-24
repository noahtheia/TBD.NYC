import type { Venue } from "@/types/venue";
import VenueCard from "@/components/list/VenueCard";

/** A crawlable, linked grid of venue cards for the SSR landing pages.
 *  Cards render in navigation mode (no onSelect) so each links to /venue/[id]. */
export default function VenueResults({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) {
    return <p className="text-zinc-500">No spots here yet.</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {venues.map((v, i) => (
        <li key={v.id}>
          <VenueCard venue={v} eager={i < 4} />
        </li>
      ))}
    </ul>
  );
}
