import type { Venue } from "@/types/venue";
import { venueJsonLd } from "@/lib/jsonld";

/** Emits schema.org JSON-LD for a venue (rendered in the static /venue/[id] page). */
export default function VenueJsonLd({ venue }: { venue: Venue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd(venue)) }}
    />
  );
}
